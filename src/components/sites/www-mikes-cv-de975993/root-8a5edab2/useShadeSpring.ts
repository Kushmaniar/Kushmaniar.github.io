import { useEffect, useRef, useState, type PointerEvent } from "react";
import { prefersReducedMotion } from "./config";

interface ShadeSpringOptions {
  /** Pixels of vertical drag that move the shade from fully open to fully closed. */
  travel: number;
  /** Starting shade (0 open, 1 closed), or a lazy initialiser. */
  initial: number | (() => number);
  /** Called after every render with the current shade and whether it has come to rest. */
  onChange?: (shade: number, settled: boolean) => void;
}

interface ShadeHandlers {
  onPointerDown: (e: PointerEvent<HTMLElement>) => void;
  onPointerMove: (e: PointerEvent<HTMLElement>) => void;
  onPointerUp: (e: PointerEvent<HTMLElement>) => void;
  onPointerCancel: (e: PointerEvent<HTMLElement>) => void;
  onClick: () => void;
}

interface AnimState {
  v: number;
  target: number | null;
  raf: number;
  dragging: boolean;
}

interface DragState {
  y: number;
  from: number;
  t: number;
  armed: boolean;
}

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/**
 * Drag-driven window shade: pointer drags move it 1:1, releases spring it to
 * the nearest end (or the flick direction), keyboard clicks tween-toggle it.
 */
export function useShadeSpring({ travel, initial, onChange }: ShadeSpringOptions) {
  const [shade, setShade] = useState(initial);
  const [settled, setSettled] = useState(true);
  const [dragging, setDragging] = useState(false);

  const pos = useRef(shade);
  const anim = useRef<AnimState>({ v: 0, target: null, raf: 0, dragging: false });
  const drag = useRef<DragState | null>(null);
  const lastUp = useRef(-Infinity);

  useEffect(() => {
    onChange?.(shade, settled);
  }, [shade, settled, onChange]);

  useEffect(() => {
    const a = anim.current;
    return () => cancelAnimationFrame(a.raf);
  }, []);

  const jump = (target: number) => {
    const a = anim.current;
    pos.current = target;
    setShade(target);
    setSettled(true);
    a.v = 0;
    a.raf = 0;
  };

  const stop = () => {
    const a = anim.current;
    cancelAnimationFrame(a.raf);
    a.raf = 0;
    a.target = null;
  };

  const springTo = (target: number) => {
    const a = anim.current;
    a.target = target;
    if (a.raf) return;
    if (prefersReducedMotion()) {
      a.target = null;
      jump(target);
      return;
    }
    let last = performance.now();
    const step = (ts: number) => {
      const goal = a.target;
      if (goal === null) {
        a.raf = 0;
        return;
      }
      const dt = Math.min(Math.max(ts - last, 0) / 1000, 1 / 30);
      last = ts;
      const x = pos.current;
      const acc = 190 * (goal - x) - 26 * a.v;
      a.v += acc * dt;
      const nx = x + a.v * dt;
      if (Math.abs(a.v) < 0.002 && Math.abs(goal - nx) < 0.001) {
        pos.current = goal;
        setShade(goal);
        setSettled(true);
        a.v = 0;
        a.raf = 0;
        a.target = null;
        return;
      }
      pos.current = clamp01(nx);
      setShade(pos.current);
      a.raf = requestAnimationFrame(step);
    };
    a.raf = requestAnimationFrame(step);
  };

  const tweenTo = (target: number, ms = 900) => {
    const a = anim.current;
    cancelAnimationFrame(a.raf);
    a.raf = 0;
    if (prefersReducedMotion()) {
      jump(target);
      return;
    }
    const from = pos.current;
    const start = performance.now();
    const step = (ts: number) => {
      const t = Math.min(Math.max((ts - start) / ms, 0), 1);
      if (t >= 1) {
        pos.current = target;
        setShade(target);
        setSettled(true);
        a.v = 0;
        a.raf = 0;
        return;
      }
      pos.current = from + (target - from) * easeInOutCubic(t);
      setShade(pos.current);
      a.raf = requestAnimationFrame(step);
    };
    a.raf = requestAnimationFrame(step);
  };

  const endDrag = () => {
    anim.current.dragging = false;
    setDragging(false);
    drag.current = null;
  };

  const onPointerDown = (e: PointerEvent<HTMLElement>) => {
    if (e.button !== 0) return;
    stop();
    try {
      e.currentTarget.setPointerCapture?.(e.pointerId);
    } catch {
      // Pointer already gone; the drag still works without capture.
    }
    anim.current.dragging = true;
    setDragging(true);
    setSettled(false);
    anim.current.v = 0;
    drag.current = { y: e.clientY, from: pos.current, t: performance.now(), armed: false };
  };

  const onPointerMove = (e: PointerEvent<HTMLElement>) => {
    const d = drag.current;
    const a = anim.current;
    if (!d || !a.dragging) return;
    const x = clamp01(d.from + (e.clientY - d.y) / travel);

    const finish = (goal: number) => {
      endDrag();
      pos.current = x;
      setShade(x);
      tweenTo(goal, Math.max(260, 900 * Math.abs(goal - x)));
    };

    if (!d.armed && Math.abs(x - d.from) > 0.1) d.armed = true;
    if (d.armed) {
      if (x <= 0.1) return finish(0);
      if (x >= 0.9) return finish(1);
    }
    // Crossing the halfway mark commits to the opposite end.
    const goal = d.from < 0.5 ? 1 : 0;
    if (goal === 1 ? x >= 0.5 : x <= 0.5) return finish(goal);

    const now = performance.now();
    const dt = (now - d.t) / 1000;
    if (dt > 0) a.v = (x - pos.current) / dt;
    if (x === 0 || x === 1) a.v = 0;
    d.t = now;
    pos.current = x;
    setShade(x);
  };

  const onPointerUp = (e: PointerEvent<HTMLElement>) => {
    lastUp.current = performance.now();
    if (!drag.current) return;
    endDrag();
    const el = e.currentTarget;
    if (el.hasPointerCapture?.(e.pointerId)) el.releasePointerCapture(e.pointerId);
    const { v } = anim.current;
    if (v > 1.6) springTo(1);
    else if (v < -1.6) springTo(0);
    else springTo(pos.current > 0.5 ? 1 : 0);
  };

  // Keyboard activation only: the click that trails a pointer gesture is dropped.
  const onClick = () => {
    if (performance.now() - lastUp.current < 500) return;
    stop();
    setSettled(false);
    tweenTo(pos.current > 0.5 ? 0 : 1);
  };

  const handlers: ShadeHandlers = {
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel: onPointerUp,
    onClick,
  };

  return { shade, dragging, handlers };
}
