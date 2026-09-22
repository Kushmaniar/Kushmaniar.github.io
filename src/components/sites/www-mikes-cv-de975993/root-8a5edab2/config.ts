import type { FooterLink, Memory, TimelineEntryData } from "./types";

/** Public path of this page's downloaded assets. */
export const ASSET_BASE = "/sites/www-mikes-cv-de975993/root-8a5edab2";

/** Resolve an original site path ("/cloud.png") to its local public URL. */
export const asset = (path: string) => `${ASSET_BASE}${path}`;

export const PASS_UNLOCKED_KEY = "mikescv-pass-unlocked";
export const CABIN_DARK_KEY = "mikescv-cabin-dark";

/** Gate background (always the light veil, whatever the cabin theme). */
export const PASS_BG = "#faf5f5";

/** Gate scene tuning, in world units. */
export const PASS_SCENE = {
  hoverY: 0.9,
  readerY: -1.2,
  slotY: -1.05,
  slotTol: 0.15,
  traverseSpan: 2.6,
  respawnMs: 50,
  fadeInS: 0.45,
} as const;

/** Boarding pass width in world units. */
export const CARD_W = 3.2;

const MAX_PX_PER_UNIT = 132;
const MIN_PX_PER_UNIT = 55;
const FIT_W = (PASS_SCENE.traverseSpan / 2 + CARD_W / 2) * 2 + 0.2;
const FIT_H = 6.6;

/** Pixels per world unit for the gate camera, clamped to [55, 132]. */
export function pxPerUnit(width: number, height: number) {
  const n = Math.min(width / FIT_W, height / FIT_H);
  return Math.max(MIN_PX_PER_UNIT, Math.min(MAX_PX_PER_UNIT, n));
}

export function prefersReducedMotion() {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

const SOFTWARE_RENDERER = /swiftshader|llvmpipe|softwarepipe|basic render|generic renderer/i;

function hasHardwareWebGL() {
  try {
    const canvas = document.createElement("canvas");
    const gl = (canvas.getContext("webgl2") ||
      canvas.getContext("webgl") ||
      canvas.getContext("experimental-webgl")) as WebGLRenderingContext | null;
    if (!gl) return false;
    const info = gl.getExtension("WEBGL_debug_renderer_info");
    if (info) {
      const renderer = String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL) || "");
      if (SOFTWARE_RENDERER.test(renderer)) return false;
    }
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return true;
  } catch {
    return false;
  }
}

function isLowEndDevice() {
  const cores = navigator.hardwareConcurrency;
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  return !cores || !memory ? false : cores <= 2 && memory <= 2;
}

let webglCapable: boolean | undefined;

/** Whether the 3D scenes (gate + window sky) should run. Cached. */
export function canRenderWebGL() {
  if (webglCapable !== undefined) return webglCapable;
  if (typeof window === "undefined" || typeof document === "undefined") return false;
  webglCapable = !prefersReducedMotion() && !isLowEndDevice() && hasHardwareWebGL();
  return webglCapable;
}

const shots = (name: string) =>
  ["left", "middle", "right"].map((side) => asset(`/folio/shots/${name}-${side}.png`));

export const TIMELINE: TimelineEntryData[] = [
  {
    year: "2025",
    route: "NYC>MAN",
    logos: [
      { src: asset("/folio/logo-studio.png"), url: "https://buildwithstudio.com/" },
      { src: asset("/folio/logo-fahlo.png"), url: "https://myfahlo.com/", name: "Fahlo" },
    ],
    company: "Studio",
    href: "https://buildwithstudio.com/",
    current: true,
    role: "Lead Product Designer",
    desc: "New York based product agency. Led several end-to-end client product and branding engagements across mobile and web, shipping to millions of users.",
    cases: [
      {
        title: "Fahlo™",
        desc: "Animal tracking products driving conservation efforts worldwide",
        to: "/fahlo",
        shots: shots("fahlo"),
      },
    ],
  },
  {
    year: "2024",
    route: "DEN>MAN",
    logos: [
      { src: asset("/folio/logo-matter-dark.png"), url: "https://matter.xyz/", name: "Matter" },
      { src: asset("/folio/logo-matter-blue.png"), url: "https://matter.xyz/app", name: "Matter app" },
    ],
    company: "Matter Neuroscience",
    href: "https://matter.xyz/",
    role: "Senior Product Designer",
    desc: "Colorado biotech start-up investing in longevity through frontline neuroscience. Played a critical role in helping shape Matter's visual language and user experience 0-1.",
    cases: [
      {
        title: "Matter",
        desc: "Tracking neurotransmitter activity through a biomarker for happiness",
        to: "/matter",
        shots: shots("matter-ios"),
      },
    ],
  },
  {
    year: "2022",
    route: "LON",
    logos: [{ src: asset("/folio/logo-contact.png"), url: "https://contact.xyz/" }],
    company: "Contact",
    href: "https://contact.xyz/",
    role: "Senior Product Designer",
    desc: "London based marketplace start-up. Led design and a bold rebrand for a vertical shift in a fast-moving creative gig industry.",
    cases: [
      {
        title: "Contact",
        desc: "A B2B SaaS platform for booking, managing and paying creative talent",
        to: "/contact",
        shots: shots("contact"),
      },
    ],
  },
  {
    year: "2019",
    route: "LON",
    logos: [
      { src: asset("/folio/logo-fueled.png"), url: "https://fueled.com/" },
      { src: asset("/folio/logo-immi.png"), url: "https://immi.io", name: "Immi" },
      { src: asset("/folio/logo-sakara.png"), url: "https://www.sakara.com/", name: "Sakara" },
      { src: asset("/folio/logo-webex.png"), url: "https://www.webex.com/", name: "Webex" },
    ],
    company: "Fueled",
    href: "https://fueled.com/",
    role: "Product Designer",
    desc: "New-York based digital agency for startup and enterprise clients. I learned the ropes, honed my craft, and shipped my first products.",
    cases: [
      {
        title: "Webex for iPad",
        desc: "Unifying antiquated software into a single seamless native experience",
        to: "/webex",
        shots: shots("webex"),
      },
      {
        title: "Sakara",
        desc: "A blueprint for high end meal subscription management",
        to: "/sakara",
        shots: shots("sakara"),
      },
      {
        title: "Immi",
        desc: "A world class, family friendly AR animation studio in your pocket",
        to: "/immi",
        shots: shots("immi"),
      },
    ],
  },
];

export const MEMORIES: Memory[] = [
  { src: asset("/folio/memories/m1.jpg"), caption: "Home sweet home" },
  { src: asset("/folio/memories/m2.jpg"), caption: "Happy place" },
  { src: asset("/folio/memories/m3.jpg"), caption: "I Miss Japan" },
  { src: asset("/folio/memories/m4.jpg"), caption: "NYC, ILY" },
  { src: asset("/folio/memories/m5.jpg"), caption: "Wannabe Rockstar" },
];

export const SOCIAL_LINKS: FooterLink[] = [
  { label: "X", href: "https://x.com/mjbarton_" },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/mikejbarton/" },
];

export const EMAIL_HREF = `mailto:hello@mikes.cv?subject=${encodeURIComponent("So, about your portfolio...")}`;
