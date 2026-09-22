import { CaseCard } from "./CaseCard";
import { TimelineLogos } from "./TimelineLogos";
import type { TimelineEntryData } from "./types";

export function TimelineEntry({ entry }: { entry: TimelineEntryData }) {
  return (
    // `tl-entry` carries the staggered load reveal (see mikes-cv.css)
    <li className="tl-entry relative flex flex-col pl-(--entry-indent)">
      <TimelineLogos logos={entry.logos} company={entry.company} />
      <span className="relative flex items-center gap-[10px]">
        <span className="absolute top-1/2 left-[-70px] hidden w-[33px] -translate-y-1/2 text-center font-folio-mono font-medium uppercase min-[761px]:block">
          <span className="block text-[6px] leading-[7px] tracking-[0.9px] text-tl-route">
            {entry.route}
          </span>
          <span className="block text-[12px] leading-[14px] tracking-[1.05px] text-folio-mute">
            {entry.year}
          </span>
        </span>
        <span
          className={`tl-dot ${entry.current ? "tl-dot-now" : "tl-dot-past"}`}
          aria-hidden="true"
        />
        <a
          className="text-[16px] leading-[1.8] font-medium tracking-[-0.12px] text-folio-ink no-underline hover:underline hover:underline-offset-3"
          href={entry.href}
          target="_blank"
          rel="noreferrer noopener"
        >
          {entry.company}
        </a>
        {entry.current && (
          <span className="pt-[3px] font-folio-mono text-[12px] leading-[0.99] font-medium tracking-[0.96px] text-folio-blue uppercase">
            Current
          </span>
        )}
      </span>
      <div>
        <p className="mb-[2px] text-[16px] leading-[1.6] font-medium tracking-[-0.12px] text-folio-body">
          {entry.role}
        </p>
        <p className="text-[16px] leading-[1.6] font-normal tracking-[-0.12px] text-folio-body opacity-80">
          {entry.desc}
        </p>
      </div>
      {entry.cases.length > 0 && (
        <ul className="mt-[10px] flex list-none flex-col gap-[10px]">
          {entry.cases.map((study, i) => (
            <CaseCard key={`${study.title}-${i}`} study={study} />
          ))}
        </ul>
      )}
    </li>
  );
}
