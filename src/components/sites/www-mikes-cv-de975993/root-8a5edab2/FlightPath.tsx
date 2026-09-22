"use client";

import { useEffect, useRef, type RefObject } from "react";

export interface FlightPathProps {
  /** The `.folio-track` element (receives --rail-tail, holds .tl-dot and .plan-plane). */
  trackRef: RefObject<HTMLDivElement | null>;
  /** The outro text block; the rail ends level with its vertical centre. */
  tailRef: RefObject<HTMLDivElement | null>;
}

// Desktop: fixed S-curve from the plan head (44px right of the rail) down to the rail.
const DESKTOP_D = "M43 0V7.3A39 39 0 0 1 21.71 42.05A39 39 0 0 0 0.5 76.75V110";
const DESKTOP_H = 110;
const DESKTOP_LEN = 118;

// Mobile: the plan head is centred, so the curve is rebuilt to swing left to the rail.
const R = 30;
const LEAD = 15;
const MOBILE_H = LEAD + R * 2;

const EASE = 0.12;
const REVEAL_ANIMATIONS = new Set(["itemReveal", "itemRevealReduced"]);

function mobileD(w: number): string {
  const t = w + 0.5;
  return `M${t} 0V${LEAD}A${R} ${R} 0 0 1 ${t - R} ${LEAD + R}H${0.5 + R}A${R} ${R} 0 0 0 0.5 ${MOBILE_H}`;
}

function clamp01(v: number): number {
  return Math.min(1, Math.max(0, v));
}

interface RailDot {
  el: Element;
  y: number;
  lit: boolean;
}

export function FlightPath({ trackRef, tailRef }: FlightPathProps) {
  const pathRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const dotsRef = useRef<SVGPathElement>(null);
  const litRef = useRef<SVGPathElement>(null);
  const railRef = useRef<HTMLDivElement>(null);

  // The rail stops level with the vertical centre of the outro text.
  useEffect(() => {
    const track = trackRef.current;
    const tail = tailRef.current;
    if (!track || !tail) return;

    const measure = () => {
      const tailRect = tail.getBoundingClientRect();
      const k = track.getBoundingClientRect().bottom - (tailRect.top + tailRect.height / 2);
      track.style.setProperty("--rail-tail", `${k.toFixed(1)}px`);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(tail);
    ro.observe(track);
    return () => ro.disconnect();
  }, [trackRef, tailRef]);

  // Scroll progress lights the curve, then the rail; dots light as the tip passes them.
  useEffect(() => {
    const root = pathRef.current;
    const svg = svgRef.current;
    const dotsPath = dotsRef.current;
    const lit = litRef.current;
    const rail = railRef.current;
    if (!root || !svg || !dotsPath || !lit || !rail) return;

    let curveLen = DESKTOP_LEN;
    let curveH = DESKTOP_H;
    let railH = 0;
    let pathTop = 0;
    let dots: RailDot[] = [];
    let current = 0;
    let target = 0;
    let raf = 0;

    const setD = (d: string) => {
      dotsPath.setAttribute("d", d);
      lit.setAttribute("d", d);
    };

    const layoutCurve = (track: HTMLDivElement) => {
      if (getComputedStyle(track).getPropertyValue("--plan-centre").trim() !== "1") {
        curveH = DESKTOP_H;
        svg.removeAttribute("style");
        svg.setAttribute("viewBox", `0 0 44 ${DESKTOP_H}`);
        setD(DESKTOP_D);
        return;
      }
      const plane = track.querySelector(".plan-plane");
      if (!plane) return;
      const planeRect = plane.getBoundingClientRect();
      const railRect = rail.getBoundingClientRect();
      const w = Math.max(
        R * 2,
        planeRect.left + planeRect.width / 2 - (railRect.left + railRect.width / 2),
      );
      curveH = MOBILE_H;
      svg.setAttribute("viewBox", `0 0 ${w + 1} ${MOBILE_H}`);
      svg.style.width = `${w + 1}px`;
      svg.style.height = `${MOBILE_H}px`;
      setD(mobileD(w));
    };

    const measure = () => {
      const track = trackRef.current;
      if (track) layoutCurve(track);
      curveLen = lit.getTotalLength() || DESKTOP_LEN;
      railH = rail.offsetHeight;
      pathTop = root.getBoundingClientRect().top + window.scrollY;
      dots = track
        ? Array.from(track.querySelectorAll(".tl-dot"), (el) => {
            const rect = el.getBoundingClientRect();
            return {
              el,
              y: rect.top + rect.height / 2 + window.scrollY,
              lit: el.classList.contains("is-lit"),
            };
          })
        : [];
    };

    const progress = (y: number) => {
      const max = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      return max <= 0 ? 1 : clamp01(y / max);
    };

    const tick = () => {
      raf = 0;
      const d = target - current;
      current = Math.abs(d) < 2e-4 ? target : current + d * EASE;

      const g = current * (curveLen + railH);
      const curveP = clamp01(g / curveLen);
      const railP = railH ? clamp01((g - curveLen) / railH) : 0;
      root.style.setProperty("--curve-p", curveP.toFixed(4));
      root.style.setProperty("--rail-p", railP.toFixed(4));

      const tipY = pathTop + curveH * curveP + railH * railP;
      for (const dot of dots) {
        const isLit = dot.y <= tipY;
        if (isLit !== dot.lit) {
          dot.lit = isLit;
          dot.el.classList.toggle("is-lit", isLit);
        }
      }

      if (current !== target) raf = requestAnimationFrame(tick);
    };

    const onScroll = () => {
      target = progress(window.scrollY);
      if (!raf) raf = requestAnimationFrame(tick);
    };

    const onResize = () => {
      measure();
      onScroll();
    };

    // Entry reveals shift layout, so re-measure dot positions once they settle.
    const onAnimationEnd = (e: AnimationEvent) => {
      if (REVEAL_ANIMATIONS.has(e.animationName)) onResize();
    };

    measure();
    current = progress(window.scrollY);
    onScroll();

    const track = trackRef.current;
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    track?.addEventListener("animationend", onAnimationEnd);
    const ro = new ResizeObserver(onResize);
    ro.observe(document.body);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      track?.removeEventListener("animationend", onAnimationEnd);
      ro.disconnect();
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };
  }, [trackRef]);

  return (
    <div
      ref={pathRef}
      className="absolute top-[-74px] bottom-[var(--rail-tail,24px)] left-[calc(var(--rail-x)_-_0.5px)] w-px min-[761px]:top-[-65px]"
      aria-hidden="true"
    >
      <svg
        ref={svgRef}
        className="path-curve absolute top-0 left-0 h-[110px] w-[44px] overflow-visible"
        viewBox="0 0 44 110"
        fill="none"
      >
        <path ref={dotsRef} className="pc-dots" d={DESKTOP_D} />
        <path ref={litRef} className="pc-lit" d={DESKTOP_D} pathLength="1" />
      </svg>
      <div ref={railRef} className="path-rail">
        <div className="path-lit" />
      </div>
      <svg
        className="path-tip absolute bottom-[-1px] left-1/2 h-[3px] w-[7px] -translate-x-1/2 overflow-visible"
        viewBox="0 0 7 3"
        fill="none"
      >
        <path d="M0.5 0.5 3.5 2.5 6.5 0.5" />
      </svg>
    </div>
  );
}
