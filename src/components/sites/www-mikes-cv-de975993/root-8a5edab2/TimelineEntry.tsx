import { CaseCard } from "./CaseCard";
import { TimelineLogos } from "./TimelineLogos";
import type { TimelineEntryData } from "./types";

// "work" carries no tag — it's the default, unmarked category on this timeline.
const CATEGORY_LABEL: Record<string, string> = {
  education: "Education",
  project: "Project",
  award: "Award",
};

export function TimelineEntry({ entry }: { entry: TimelineEntryData }) {
  const categoryLabel = entry.category && CATEGORY_LABEL[entry.category];

  return (
    // `tl-entry` carries the staggered load reveal (see mikes-cv.css)
    <li className="tl-entry relative flex flex-col pl-(--entry-indent)">
      {entry.logos.length > 0 && <TimelineLogos logos={entry.logos} company={entry.company} />}
      <span className="relative flex flex-wrap items-center gap-x-[10px] gap-y-[2px]">
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
        {categoryLabel && (
          <span className="pt-[3px] font-folio-mono text-[11px] leading-[0.99] font-medium tracking-[0.9px] text-folio-mute uppercase">
            {categoryLabel}
          </span>
        )}
        {entry.current && (
          <span className="pt-[3px] font-folio-mono text-[12px] leading-[0.99] font-medium tracking-[0.96px] text-folio-blue uppercase">
            Current
          </span>
        )}
      </span>
      <div>
        {entry.role && (
          <p className="mb-[2px] text-[16px] leading-[1.6] font-medium tracking-[-0.12px] text-folio-body">
            {entry.role}
          </p>
        )}
        {entry.desc && (
          <p className="text-[16px] leading-[1.6] font-normal tracking-[-0.12px] text-folio-body opacity-80">
            {entry.desc}
          </p>
        )}
      </div>
      {entry.subRoles && entry.subRoles.length > 0 && (
        <div className="mt-[6px] flex flex-col gap-[14px]">
          {entry.subRoles.map((sub) => (
            <div key={sub.role}>
              <p className="mb-[1px] flex flex-wrap items-baseline gap-x-[8px] text-[14px] leading-[1.6] font-medium tracking-[-0.1px] text-folio-body">
                {sub.role}
                <span className="font-folio-mono text-[11px] font-medium tracking-[0.6px] text-folio-mute uppercase">
                  {sub.period}
                </span>
              </p>
              {sub.desc && (
                <p className="text-[14px] leading-[1.6] font-normal tracking-[-0.1px] text-folio-body opacity-80">
                  {sub.desc}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
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
