import { cn } from "@/lib/utils";
import type { CaseStudyLink } from "./types";

// Rest pose + hover fan for the three stacked screenshots (left, middle, right).
const SHOT_CLASSES = [
  "z-1 h-[34.1px] w-[25.7px] [--r:-9.94deg] [--x:-13.7px] [--y:-0.8px] group-hover/case:[--r:-15deg] group-hover/case:[--x:-18px] group-hover/case:[--y:-3px]",
  "z-3 h-[46.3px] w-[35px] [--r:0deg] [--x:-1.6px] [--y:-0.7px] group-hover/case:[--s:1.03] group-hover/case:[--y:-3px]",
  "z-2 h-[39.7px] w-[30px] [--r:7.21deg] [--x:11.3px] [--y:0.5px] group-hover/case:[--r:12deg] group-hover/case:[--x:15.5px] group-hover/case:[--y:-2px]",
] as const;

export function CaseCard({ study }: { study: CaseStudyLink }) {
  return (
    <li>
      <a
        className="group/case relative flex items-center gap-[7px] rounded-[16px] bg-transparent px-[8px] py-[2px] no-underline transition-[background-color] duration-260 ease-folio-out hover:bg-surface-hover min-[621px]:px-[15px]"
        href={study.to}
      >
        <span className="tl-dot tl-dot-case" aria-hidden="true" />
        <span className="relative h-[63px] w-[66px] shrink-0" aria-hidden="true">
          {SHOT_CLASSES.map((shotClass, i) => (
            <span
              key={i}
              className={cn(
                "absolute top-1/2 left-1/2 overflow-hidden rounded-[2.5px] border-[1.5px] border-keyline shadow-[0_0.85px_5px_rgba(var(--shadow-rgb),.1),0_0.43px_1.3px_rgba(var(--shadow-rgb),.06)] [transform:translate(-50%,-50%)_translate(var(--x),var(--y))_rotate(var(--r))_scale(var(--s,1))] transition-transform duration-380 ease-avatar-in motion-reduce:transition-none",
                shotClass,
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className="block h-full w-full object-cover"
                src={study.shots[i]}
                alt=""
                draggable={false}
              />
            </span>
          ))}
        </span>
        <span className="flex min-w-0 flex-[1_0_0] flex-col justify-center">
          <span className="text-[14px] leading-[17.5px] font-medium text-ink-title">
            {study.title}
          </span>
          <span className="text-[13px] leading-[21.13px] font-medium text-ink-desc">
            {study.desc}
          </span>
        </span>
      </a>
    </li>
  );
}
