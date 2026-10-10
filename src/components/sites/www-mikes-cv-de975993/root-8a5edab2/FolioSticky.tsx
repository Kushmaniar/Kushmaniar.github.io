"use client";

import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "./config";

const LAT = 1.3521;
const LON = 103.8198;
const COUNT_MS = 900;
const OFFSET_REFRESH_MS = 30 * 60 * 1000;

const easeOutExpo = (p: number) => (p === 1 ? 1 : 1 - 2 ** (-10 * p));

/** Fixed 4-dp value, integer part zero-padded to the target's width ("00.0000"). */
function formatCoord(value: number, digits: number) {
  const [int, frac] = value.toFixed(4).split(".");
  return `${int.padStart(digits, "0")}.${frac}`;
}

/** Counts 0 → target once, the first time `active` turns true. */
function useCountUp(target: number, active: boolean) {
  const [value, setValue] = useState(() => (active ? 0 : target));
  const startedRef = useRef(false);

  useEffect(() => {
    if (!active || startedRef.current) return;
    startedRef.current = true;
    const reduce = prefersReducedMotion();
    let done = false;
    let start: number | undefined;
    let raf = 0;

    const tick = (now: number) => {
      start ??= now;
      const p = reduce ? 1 : Math.min(1, (now - start) / COUNT_MS);
      setValue(p === 1 ? target : target * easeOutExpo(p));
      if (p < 1) raf = requestAnimationFrame(tick);
      else done = true;
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      // Interrupted (e.g. StrictMode remount): let the next activation restart it.
      if (!done) startedRef.current = false;
    };
  }, [active, target]);

  return formatCoord(value, String(Math.floor(Math.abs(target))).length);
}

/** Current Singapore offset from GMT — fixed at GMT+8, no DST. */
function singaporeOffset() {
  try {
    const s =
      new Intl.DateTimeFormat("en-GB", {
        timeZone: "Asia/Singapore",
        timeZoneName: "longOffset",
      })
        .formatToParts(new Date())
        .find((p) => p.type === "timeZoneName")?.value ?? "GMT+8";
    const h = parseInt(s.slice(3), 10) || 8;
    return `GMT${h < 0 ? "-" : "+"}${Math.abs(h)}`;
  } catch {
    return "GMT+8";
  }
}

export function FolioSticky({ booting }: { booting: boolean }) {
  const active = !booting;
  const lat = useCountUp(LAT, active);
  const lon = useCountUp(LON, active);
  const [gmt, setGmt] = useState(singaporeOffset);

  useEffect(() => {
    const id = window.setInterval(() => setGmt(singaporeOffset()), OFFSET_REFRESH_MS);
    return () => window.clearInterval(id);
  }, []);

  return (
    <aside className="z-[3] flex items-center self-center pt-[40px] min-[1220px]:pointer-events-none min-[1220px]:fixed min-[1220px]:top-[72px] min-[1220px]:left-[clamp(24px,calc((100vw_-_var(--folio-col-w))_/_2_-_306px),72px)] min-[1220px]:gap-[22px] min-[1220px]:pt-0">
      <span
        className="hidden w-[8px] shrink-0 self-stretch bg-[image:radial-gradient(circle_at_0.8px_0.8px,var(--folio-rule)_0.8px,transparent_0.9px)] bg-[length:3.2px_3.6px] min-[1220px]:block"
        aria-hidden="true"
      />
      <div className="text-center font-folio-mono text-[12px] leading-[1.8] font-medium tracking-[1.84px] whitespace-nowrap text-folio-mute uppercase min-[1220px]:py-[12px] min-[1220px]:text-start">
        <p className="text-folio-ink">Kush Maniar</p>
        <p>Singapore</p>
        <p aria-hidden="true">
          {lat}° N, {lon}° E
        </p>
        <p className="sr-only">1.3521° north, 103.8198° east</p>
        <p>{gmt}</p>
      </div>
    </aside>
  );
}
