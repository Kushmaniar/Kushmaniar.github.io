"use client";

import { useState, type CSSProperties } from "react";
import type { TimelineLogo } from "./types";

const LIFT = -4;
const SCALE = 1.05;
const FALLOFF = 0.45;

type Ease = "in" | "out";

interface HoverState {
  idx: number | null;
  ease: Ease;
}

const LOGO_CLASS =
  "box-border flex size-(--tl-logo-size) shrink-0 overflow-hidden rounded-full border-[0.5px] border-solid border-keyline shadow-[0_0_0_1px_var(--keyline)]";

function avatarStyle(i: number, hover: HoverState): CSSProperties {
  const h = hover.idx;
  const shift = h === null ? 0 : LIFT * FALLOFF ** Math.abs(i - h);
  return {
    "--shift": `${shift.toFixed(3)}px`,
    "--scale-active": i === h ? SCALE : 1,
    transitionTimingFunction: `var(--avatar-ease-${hover.ease})`,
    zIndex: i === h ? 2 : 1,
  } as CSSProperties;
}

export function TimelineLogos({ logos, company }: { logos: TimelineLogo[]; company: string }) {
  const [hover, setHover] = useState<HoverState>({ idx: null, ease: "in" });

  return (
    <span
      className="mb-[6px] flex items-center"
      onPointerLeave={() => setHover({ idx: null, ease: "out" })}
    >
      {logos.map((logo, i) => {
        const bg = logo.bg ? { background: logo.bg } : undefined;
        const img = (
          // eslint-disable-next-line @next/next/no-img-element -- 28px logo, matches original markup
          <img
            src={logo.src}
            alt=""
            className="block size-full object-cover [transform:scale(1.1)]"
          />
        );
        return (
          <span
            key={`${logo.src}-${i}`}
            className="relative block shrink-0 origin-center [transform:translateY(var(--shift,0px))_scale(var(--scale-active,1))] [transition:transform_var(--avatar-dur)_var(--avatar-ease-in)] will-change-transform not-first:ml-[-6px] motion-reduce:[transform:none] motion-reduce:[transition:none]"
            style={avatarStyle(i, hover)}
            onPointerEnter={() => setHover({ idx: i, ease: "in" })}
          >
            {logo.url ? (
              <a
                className={`${LOGO_CLASS} no-underline`}
                style={bg}
                href={logo.url}
                target="_blank"
                rel="noreferrer noopener"
                aria-label={`${logo.name || company} website (opens in a new tab)`}
              >
                {img}
              </a>
            ) : (
              <span className={LOGO_CLASS} style={bg}>
                {img}
              </span>
            )}
          </span>
        );
      })}
    </span>
  );
}
