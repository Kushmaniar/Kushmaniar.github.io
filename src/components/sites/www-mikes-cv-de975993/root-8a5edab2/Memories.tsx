"use client";

import { useState, type CSSProperties } from "react";

import type { Memory } from "./types";

type CardStyle = CSSProperties & Record<`--${string}`, string | number>;

const LAYOUT = [
  { x: -55.8, y: 0.2, r: -7.65 },
  { x: -26.1, y: -1.7, r: -3 },
  { x: 0, y: -2.1, r: 0 },
  { x: 26.2, y: -1.4, r: 3 },
  { x: 55.9, y: 0.2, r: 7.54 },
];

const REST_SHADOW =
  "shadow-[0_0.6px_3.6px_rgba(var(--shadow-rgb),.1),0_0.3px_0.9px_rgba(var(--shadow-rgb),.06)]";
const ACTIVE_SHADOW =
  "shadow-[0_6px_18px_rgba(var(--shadow-rgb),.16),0_1px_3px_rgba(var(--shadow-rgb),.08)]";

const IMG_BASE = "block object-cover rounded-[4.4px]";
const IMG_FLAT = "h-full w-full";
const IMG_TURNED =
  "absolute top-1/2 left-1/2 h-[calc(var(--mem-w)_-_var(--mem-b)_*_2)] w-[calc(var(--mem-h)_-_var(--mem-b)_*_2)] max-w-none [transform:translate(-50%,-50%)_rotate(-90deg)]";

function cardStyle(i: number, active: number | null): CardStyle {
  const pos = LAYOUT[i] ?? LAYOUT[LAYOUT.length - 1];
  const isActive = active === i;
  const d = active == null ? 0 : i - active;
  const push = d === 0 ? 0 : Math.sign(d) * 9 * 0.5 ** (Math.abs(d) - 1);
  return {
    "--x": `${(pos.x + push).toFixed(2)}px`,
    "--y": `${(isActive ? pos.y - 11 : pos.y).toFixed(2)}px`,
    "--r": `${(isActive ? pos.r * 0.3 : pos.r).toFixed(2)}deg`,
    "--s": isActive ? 1.12 : 1,
    zIndex: isActive ? 10 : LAYOUT.length - i,
  };
}

export function Memories({ items }: { items: Memory[] }) {
  const [active, setActive] = useState<number | null>(null);

  return (
    <div
      className="relative h-[62px] w-[161px] shrink-0 [--mem-b:1.234px] [--mem-h:56.5px] [--mem-w:42.4px] min-[761px]:mr-[29px]"
      onPointerLeave={() => setActive(null)}
    >
      {items.map((item, i) => (
        <span
          key={item.src}
          className={`absolute top-1/2 left-1/2 h-(--mem-h) w-(--mem-w) overflow-visible rounded-[5.65px] border-[length:var(--mem-b)] border-solid border-keyline [transform:translate(-50%,-50%)_translate(var(--x),var(--y))_rotate(var(--r))_scale(var(--s,1))] transition-[transform,box-shadow] duration-[.42s] ease-avatar-in motion-reduce:transition-none ${active === i ? ACTIVE_SHADOW : REST_SHADOW}`}
          style={cardStyle(i, active)}
          onPointerEnter={() => setActive(i)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className={`${IMG_BASE} ${item.turned ? IMG_TURNED : IMG_FLAT}`}
            src={item.src}
            alt={item.caption || ""}
            draggable={false}
          />
          {active === i && item.caption && (
            <span
              aria-hidden
              className="pointer-events-none absolute bottom-[calc(100%_+_9px)] left-1/2 animate-[memTipIn_.18s_var(--ease-out)_both] rounded-[6px] bg-[#141313eb] px-[8px] py-[3px] font-folio-mono text-[9px] leading-[1.5] font-medium tracking-[.6px] whitespace-nowrap text-white uppercase [transform:translate(-50%)_rotate(calc(var(--r)_*_-1))] motion-reduce:animate-none"
            >
              {item.caption}
            </span>
          )}
        </span>
      ))}
    </div>
  );
}
