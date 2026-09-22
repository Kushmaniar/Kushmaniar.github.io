"use client";

import { useRef, type Ref } from "react";
import { MEMORIES, TIMELINE } from "./config";
import { FlightPath } from "./FlightPath";
import { FolioFooter } from "./FolioFooter";
import { FolioSticky } from "./FolioSticky";
import { Memories } from "./Memories";
import { PlaneWindow } from "./PlaneWindow";
import { TimelineEntry } from "./TimelineEntry";

function PlaneIcon() {
  return (
    <svg
      className="plan-plane mx-auto mt-[10px] block h-[15px] w-[16px]"
      viewBox="0 0 16 15"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M8 0c.73 0 1.32 1.05 1.32 2.35v2.2l6.13 3.54c.25.14.4.4.4.69v1.1a.44.44 0 0 1-.56.42L9.32 8.5v3.06l1.9 1.33c.15.11.24.28.24.47v.79a.44.44 0 0 1-.56.42L8 13.79l-2.9.78a.44.44 0 0 1-.56-.42v-.79c0-.19.09-.36.24-.47l1.9-1.33V8.5L.71 10.3a.44.44 0 0 1-.56-.42v-1.1c0-.29.15-.55.4-.69l6.13-3.54v-2.2C6.68 1.05 7.27 0 8 0Z"
        fill="currentColor"
      />
    </svg>
  );
}

export interface FolioProps {
  ref?: Ref<HTMLElement>;
  /** True while the splash or gate covers the page: pauses reveals and scenes. */
  booting: boolean;
  /** "Return to Gate" handler; omitted when the gate can't run (no WebGL). */
  onReset?: () => void;
}

export function Folio({ ref, booting, onReset }: FolioProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const tailRef = useRef<HTMLDivElement>(null);

  return (
    <main
      ref={ref}
      className={`folio flex min-h-svh flex-col bg-folio-bg font-folio-sans text-ink${booting ? " booting" : ""}`}
      aria-hidden={booting || undefined}
      inert={booting}
    >
      <FolioSticky booting={booting} />
      <div className="mx-auto flex w-[min(100%_-_3rem,var(--folio-col-w))] flex-[1_0_auto] flex-col items-center gap-10 pt-[3vh] pb-[168px] min-[621px]:gap-12 min-[621px]:pt-7 min-[1220px]:pt-20">
        <div className="folio-window reveal relative z-[6] [--reveal-delay:0ms]">
          <PlaneWindow paused={booting} />
        </div>
        <div className="reveal -mt-[34px] w-full max-w-[460px] text-center [--reveal-delay:60ms] [--reveal-opacity:0.8] min-[1220px]:-mt-[28px]">
          <p className="text-[16px] leading-[1.8] font-medium tracking-[-0.12px] text-folio-ink">
            Software Designer &amp; Creative Technologist
          </p>
          <p className="text-[16px] leading-[1.6] font-normal tracking-[-0.12px] text-folio-body opacity-80">
            Pushing pixels for 8 years with an engineering mindset,{" "}
            <br className="max-[620px]:hidden" />
            obsessing over the details and the why behind great products.
          </p>
        </div>
        <div
          ref={trackRef}
          className="relative mt-[97px] flex w-full flex-col gap-[44px] [--entry-indent:32px] [--plan-centre:1] [--rail-x:3.5px] min-[761px]:mt-0 min-[761px]:gap-9 min-[761px]:[--entry-indent:0px] min-[761px]:[--plan-centre:0] min-[761px]:[--rail-x:-21.5px]"
        >
          <div
            className="reveal absolute top-[-115px] left-[calc(50%_-_24px)] w-12 text-center text-folio-blue min-[761px]:top-[-106px] min-[761px]:left-[-3px]"
            aria-hidden="true"
          >
            <span className="block font-folio-mono text-[6px] leading-[6px] font-medium tracking-[0.76px] uppercase">
              Flight plan
            </span>
            <PlaneIcon />
          </div>
          <FlightPath trackRef={trackRef} tailRef={tailRef} />
          <ol className="flex w-full list-none flex-col gap-12 min-[761px]:gap-9">
            {TIMELINE.map((entry, i) => (
              <TimelineEntry key={`${entry.company}-${i}`} entry={entry} />
            ))}
          </ol>
          <div className="reveal relative flex flex-wrap items-center gap-6 pl-(--entry-indent)">
            <div ref={tailRef} className="min-w-[min(100%,260px)] flex-[1_1_260px]">
              <p className="text-[16px] leading-[1.6] font-medium tracking-[-0.12px] text-folio-body">
                Thank you for flying. See you again soon.
              </p>
              <p className="text-[14px] leading-[1.6] font-normal tracking-[-0.12px] text-folio-body opacity-80">
                Here are a few memories between takeoff and landing.
              </p>
            </div>
            <Memories items={MEMORIES} />
          </div>
        </div>
      </div>
      <FolioFooter onReset={onReset} />
    </main>
  );
}
