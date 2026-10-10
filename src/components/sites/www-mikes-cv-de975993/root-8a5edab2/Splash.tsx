"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { cn } from "@/lib/utils";
import { asset, canRenderWebGL } from "./config";

export interface SplashProps {
  /** Roots whose <img>/<video> must finish loading before the splash leaves. */
  targets: RefObject<HTMLElement | null>[];
  /** False during SSR/hydration; preloading starts the first time it's true. */
  ready: boolean;
  onDone: () => void;
}

/** Minimum time the mark stays up (matches its intro animation). */
const MIN_VISIBLE_MS = 620;
const PRELOAD_TIMEOUT_MS = 12000;
const SETTLE_FRAMES = 6;

function settleOn(el: EventTarget, events: string[]) {
  return new Promise<void>((resolve) => {
    const done = () => resolve();
    for (const type of events) el.addEventListener(type, done, { once: true });
  });
}

function waitForMedia(root: HTMLElement) {
  const waits: Promise<void>[] = [];
  root.querySelectorAll<HTMLImageElement>("img:not([data-lazy])").forEach((img) => {
    waits.push(img.complete ? Promise.resolve() : settleOn(img, ["load", "error"]));
  });
  root.querySelectorAll<HTMLVideoElement>("video:not([data-lazy])").forEach((video) => {
    waits.push(video.readyState >= 2 ? Promise.resolve() : settleOn(video, ["loadeddata", "error"]));
  });
  return waits;
}

async function waitForFonts(webgl: boolean) {
  if (!("fonts" in document) || !document.fonts) return;
  try {
    const faces = ['400 16px "MB Sans"', '500 16px "MB Sans"'];
    if (webgl) faces.push('400 62px "MB LCD"');
    await Promise.all(faces.map((f) => document.fonts.load(f).catch(() => {})));
    await document.fonts.ready;
  } catch {}
}

function warmImage(src: string) {
  return new Promise<void>((resolve) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => resolve();
    img.src = src;
  });
}

function waitFrames(count: number) {
  return new Promise<void>((resolve) => {
    const tick = (left: number) => {
      if (left <= 0) resolve();
      else requestAnimationFrame(() => tick(left - 1));
    };
    tick(count);
  });
}

/** Resolves once the page's media, fonts and gate assets are ready (or after 12s). */
function preloadSite(roots: (HTMLElement | null)[]) {
  const webgl = canRenderWebGL();
  const waits: Promise<unknown>[] = [];

  for (const root of roots) if (root) waits.push(...waitForMedia(root));
  waits.push(waitForFonts(webgl));
  if (webgl) waits.push(import("./access-pass/AccessPass").catch(() => {}));

  const images = ["/cloud.png"];
  if (webgl) {
    images.push("/CirrusCloud.png", "/waternormals.jpg", "/folio/boarding-pass.png", "/folio/boarding-pass-back.png");
  }
  for (const src of images) waits.push(warmImage(asset(src)));

  const loaded = Promise.all(waits).then(() => waitFrames(SETTLE_FRAMES));
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<void>((resolve) => {
    timer = setTimeout(resolve, PRELOAD_TIMEOUT_MS);
  });
  return Promise.race([loaded, timeout]).finally(() => clearTimeout(timer));
}

export function Splash({ targets, ready, onDone }: SplashProps) {
  const [leaving, setLeaving] = useState(false);
  const onDoneRef = useRef(onDone);
  // Set once the splash has handed off, so the gate never fires twice.
  const doneRef = useRef(false);

  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    if (!ready || doneRef.current) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const start = performance.now();

    preloadSite(targets.map((r) => r.current)).then(() => {
      if (cancelled) return;
      const elapsed = performance.now() - start;
      timer = setTimeout(() => {
        if (cancelled || doneRef.current) return;
        doneRef.current = true;
        setLeaving(true);
        onDoneRef.current();
      }, Math.max(0, MIN_VISIBLE_MS - elapsed));
    });

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [ready, targets]);

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "splash fixed inset-0 z-[100] grid place-items-center bg-folio-bg px-[6vw] transition-[opacity,filter] duration-[280ms] ease-[ease]",
        leaving && "pointer-events-none opacity-0 blur-[6px]",
      )}
    >
      <div className="motion-reduce:[&_animate]:hidden">
        <span className="sr-only">Loading</span>
        <svg viewBox="0 0 100 100" aria-hidden="true" className="block h-[60px] w-[60px]">
          <defs>
            <linearGradient id="splash-sheen" gradientUnits="userSpaceOnUse" x1={-120} y1="0" x2="0" y2="0">
              <stop offset="0%" stopColor="var(--folio-blue)" />
              <stop offset="28%" stopColor="var(--folio-blue)" />
              <stop offset="50%" stopColor="var(--path-blue)" />
              <stop offset="72%" stopColor="var(--folio-blue)" />
              <stop offset="100%" stopColor="var(--folio-blue)" />
              <animate attributeName="x1" values="-120;100" dur="2.4s" repeatCount="indefinite" />
              <animate attributeName="x2" values="0;220" dur="2.4s" repeatCount="indefinite" />
            </linearGradient>
            <mask id="splash-mask">
              <text
                x="50"
                y="54"
                textAnchor="middle"
                dominantBaseline="central"
                fill="#fff"
                fontFamily="ui-sans-serif, system-ui, sans-serif"
                fontWeight="700"
                fontSize="42"
                letterSpacing="-1"
              >
                KM
              </text>
            </mask>
          </defs>
          <g className="origin-[50px_50px] animate-[splashMarkIn_.62s_var(--ease-out)_both] motion-reduce:animate-[splashMarkIn_.2s_ease_both]">
            <rect width="100" height="100" fill="url(#splash-sheen)" mask="url(#splash-mask)" />
          </g>
        </svg>
      </div>
    </div>
  );
}
