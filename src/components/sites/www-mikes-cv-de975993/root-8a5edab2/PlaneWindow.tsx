"use client";

import { Suspense, lazy, useState, type CSSProperties, type SyntheticEvent } from "react";
import { onShadeChange } from "./cabinTheme";
import { asset, canRenderWebGL } from "./config";
import { useShadeSpring } from "./useShadeSpring";

const PlaneWindowScene = lazy(() => import("./PlaneWindowScene"));

// Source art is 600×900, drawn at 1/3 (200×300).
interface Rect {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

const OPEN: Rect = { top: 132, bottom: 716, left: 79, right: 520 };
const OPEN_R = 170;
const SKY: Rect = { top: 179, bottom: 653, left: 118, right: 481 };
const SKY_R = 150;
/** Share of the art's height the shutter slides through. */
const SHADE_FRAC = (723 - 210) / 900;
/** Pixels of drag that take the shade from open to closed. */
const TRAVEL = 300 * SHADE_FRAC;

const insetClip = (r: Rect, radius: number, g: number) =>
  `inset(${((r.top - g) / 900) * 100}% ${((600 - r.right - g) / 600) * 100}% ${((900 - r.bottom - g) / 900) * 100}% ${((r.left - g) / 600) * 100}% round ${(radius + g) / 3}px)`;

const clip = (path: string): CSSProperties => ({ clipPath: path, WebkitClipPath: path });

const SKY_CLIP = clip(insetClip(SKY, SKY_R, 2));
const SHUTTER_CLIP = clip(insetClip(OPEN, OPEN_R, 6));
const HIT_CLIP = clip(insetClip(OPEN, OPEN_R, 0));

const SHUTTER_BOX: CSSProperties = {
  left: `${OPEN.left / 3}px`,
  top: `${OPEN.top / 3}px`,
  width: `${(OPEN.right - OPEN.left) / 3}px`,
  height: `${(OPEN.bottom - OPEN.top) / 3}px`,
  borderRadius: `${OPEN_R / 3}px`,
};

const BACK_SRC = asset("/window-back.webp");
const SHUTTER_SRC = asset("/window-shutter.webp");
const FRONT_SRC = asset("/window-front.webp");
const CLOUD_SRC = asset("/cloud.png");

const readInitialShade = () => (document.documentElement.dataset.theme === "dark" ? 1 : 0);

const preventDefault = (e: SyntheticEvent) => e.preventDefault();

function Layer({
  src,
  dim,
  shade,
  transform,
}: {
  src: string;
  dim: number;
  shade: number;
  transform?: string;
}) {
  return (
    <img
      src={src}
      alt=""
      aria-hidden="true"
      draggable={false}
      className="pointer-events-none absolute inset-0 h-full w-full max-w-none object-cover"
      style={{ filter: `brightness(${1 - shade * dim})`, transform }}
    />
  );
}

/** CSS-only sky used without WebGL and while the 3D scene loads. */
function StaticClouds() {
  const cloud = "pointer-events-none absolute h-auto max-w-none";
  return (
    <>
      <img src={CLOUD_SRC} alt="" aria-hidden="true" draggable={false} className={`${cloud} top-[34%] left-[-30%] w-[105%] opacity-70`} />
      <img src={CLOUD_SRC} alt="" aria-hidden="true" draggable={false} className={`${cloud} top-[30%] left-[30%] w-full opacity-60`} />
      <img src={CLOUD_SRC} alt="" aria-hidden="true" draggable={false} className={`${cloud} top-[46%] left-[-15%] w-[135%] opacity-95`} />
      <div className="absolute inset-[64%_0_0_0] bg-[linear-gradient(to_bottom,rgba(255,255,255,0)_0%,#FFFFFF_70%)]" />
    </>
  );
}

export function PlaneWindow({ paused }: { paused: boolean }) {
  const [webgl] = useState(canRenderWebGL);
  const { shade, dragging, handlers } = useShadeSpring({
    travel: TRAVEL,
    initial: readInitialShade,
    onChange: onShadeChange,
  });

  const closed = shade > 0.5;
  const label = closed ? "Open the window shade" : "Close the window shade";
  const shutterMask = `url(${SHUTTER_SRC})`;
  const maskPosition = `${-OPEN.left / 3}px ${-OPEN.top / 3 - (1 - shade) * TRAVEL}px`;
  const frontMask = `url(${FRONT_SRC})`;

  return (
    <div
      className="relative isolate mx-auto h-[300px] w-[200px] select-none [-webkit-touch-callout:none]"
      onContextMenu={preventDefault}
      onDragStart={preventDefault}
    >
      <div
        className="absolute inset-0 bg-[linear-gradient(to_bottom,#5CADF4_0%,#94CCFB_33%,#C8E6FB_45%,#FFFFFF_50%)]"
        style={SKY_CLIP}
      >
        {webgl ? (
          <Suspense fallback={<StaticClouds />}>
            <PlaneWindowScene paused={paused || shade > 0.92} />
          </Suspense>
        ) : (
          <StaticClouds />
        )}
      </div>

      <Layer src={BACK_SRC} dim={0.86} shade={shade} />

      <div className="pointer-events-none absolute inset-0" style={SHUTTER_CLIP}>
        <Layer
          src={SHUTTER_SRC}
          dim={0.82}
          shade={shade}
          transform={`translate3d(0, ${-(1 - shade) * SHADE_FRAC * 100}%, 0)`}
        />
        {/* Inner shadow cut to the shutter's silhouette, tracking its travel. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute mask-size-[200px_300px] mask-no-repeat shadow-[inset_0_0_11px_rgba(28,25,22,0.42),inset_0_0_3px_rgba(28,25,22,0.30)]"
          style={{
            ...SHUTTER_BOX,
            maskImage: shutterMask,
            WebkitMaskImage: shutterMask,
            maskPosition,
            WebkitMaskPosition: maskPosition,
          }}
        />
      </div>

      <Layer src={FRONT_SRC} dim={0.8} shade={shade} />

      {/* Cool grey cast over the frame as the cabin darkens. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,#6a6e78_0%,#878b95_38%,#a2a7ae_100%)] mix-blend-multiply mask-cover mask-no-repeat"
        style={{ maskImage: frontMask, WebkitMaskImage: frontMask, opacity: shade * 0.55 }}
      />

      <button
        type="button"
        {...handlers}
        aria-pressed={closed}
        title={label}
        className={`absolute inset-0 touch-none border-0 bg-none p-0 [-webkit-tap-highlight-color:transparent] ${dragging ? "cursor-grabbing" : "cursor-grab"}`}
        style={HIT_CLIP}
      >
        <span className="sr-only">{label}</span>
      </button>
    </div>
  );
}
