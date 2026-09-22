import { EMAIL_HREF, SOCIAL_LINKS } from "./config";

// Progressive blur: stacked backdrop blurs, each masked to a shorter band from the bottom.
const BLUR_LAYERS = [
  "backdrop-blur-[0.6px] [--pb-mask:linear-gradient(to_top,#000_0%,#000_92%,transparent_100%)]",
  "backdrop-blur-[1.5px] [--pb-mask:linear-gradient(to_top,#000_0%,#000_55%,transparent_80%)]",
  "backdrop-blur-[3px] [--pb-mask:linear-gradient(to_top,#000_0%,#000_35%,transparent_60%)]",
  "backdrop-blur-[6px] [--pb-mask:linear-gradient(to_top,#000_0%,#000_20%,transparent_42%)]",
  "backdrop-blur-[12px] [--pb-mask:linear-gradient(to_top,#000_0%,#000_8%,transparent_25%)]",
];

const BLUR_LAYER_BASE =
  "absolute inset-0 [-webkit-mask-image:var(--pb-mask)] [mask-image:var(--pb-mask)]";

const LINK_CLASS =
  "group/link inline-flex cursor-pointer items-center rounded-[999px] border-none bg-transparent px-[6px] py-[2px] font-folio-mono text-[10px] leading-[1.8] font-medium tracking-[1.1px] text-folio-mute uppercase no-underline transition-[color,background-color] duration-160 ease-folio-out hover:bg-surface-chip hover:text-ink-link-hover min-[621px]:px-[10px] min-[621px]:text-[12px] min-[621px]:tracking-[2.16px]";

const LABEL_CLASS =
  "inline-block transition-transform duration-160 ease-folio-out group-hover/link:scale-105";

export function FolioFooter({ onReset }: { onReset?: () => void }) {
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 bottom-0 z-4 h-[160px]"
      >
        {BLUR_LAYERS.map((layer) => (
          <div key={layer} className={`${BLUR_LAYER_BASE} ${layer}`} />
        ))}
        <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(var(--footer-tint-rgb),.9),rgba(var(--footer-tint-rgb),.55)_45%,rgba(var(--footer-tint-rgb),0))]" />
      </div>
      <footer className="fixed inset-x-0 bottom-0 z-5 pt-[44px] pb-[32px]">
        <div className="mx-auto flex w-[min(100%_-_3rem,560px)] justify-center">
          <nav className="flex flex-wrap items-center justify-center gap-[4px] min-[621px]:gap-[17px]">
            {onReset && (
              <button type="button" onClick={onReset} className={LINK_CLASS}>
                <span className={LABEL_CLASS}>Return to Gate</span>
              </button>
            )}
            {SOCIAL_LINKS.map(({ label, href }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noreferrer noopener"
                className={LINK_CLASS}
              >
                <span className={LABEL_CLASS}>{label}</span>
              </a>
            ))}
            <a href={EMAIL_HREF} className={LINK_CLASS}>
              <span className={LABEL_CLASS}>Email</span>
            </a>
          </nav>
        </div>
      </footer>
    </>
  );
}
