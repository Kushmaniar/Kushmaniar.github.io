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

export const TIMELINE: TimelineEntryData[] = [
  {
    year: "2026",
    route: "BOM>SIN",
    logos: [],
    company: "Nanyang Technological University",
    href: "https://www.ntu.edu.sg/",
    current: true,
    role: "MSc Artificial Intelligence, College of Computing and Data Science",
    desc: "Graduate study in deep learning, NLP and applied ML — building on two years shipping agentic AI and data platforms in production.",
    cases: [],
    category: "education",
  },
  {
    // Placeholder: exact start/end dates to confirm.
    year: "2025",
    route: "SIN",
    logos: [],
    company: "Drilldown",
    href: "https://drilldown.online/",
    role: "AI/ML Engineer",
    desc: "Built an AI chatbot assistant and demand-forecasting ML regressions for a restaurant-tech platform — minimizing inventory wastage, optimizing staff deployment, and tuning the dine-in/delivery order mix for revenue.",
    cases: [],
    category: "work",
  },
  {
    year: "2025",
    route: "—",
    logos: [],
    company: "Journal of Electrical Systems",
    href: "#",
    role: "Automated Feature Extraction from Version-Control Artifacts",
    desc: "A BART/BERT/GPT-4 pipeline mining 50,000+ commits across 22 GitHub repositories, capturing 88% of features at 0.85–0.87 F1.",
    cases: [],
    category: "project",
    paperHref: "https://doi.org/10.52783/jes.7091",
  },
  {
    year: "2024",
    route: "BOM",
    logos: [],
    company: "Apollo Global Management",
    href: "https://www.apollo.com/",
    role: "Analyst — Data Platforms Engineering",
    desc: "Architected an Azure Event Hub CDC pipeline cataloging 1,200 Snowflake tables, and established a firm-wide LangGraph agent library — an L1 triage agent auto-resolving 83% of tickets and a Snowflake Cortex Analyst NL interface saving 60 hours a week across 6 teams.",
    cases: [],
    category: "work",
  },
  {
    year: "2024",
    route: "BOM",
    logos: [],
    company: "CodeShastra 9.0",
    href: "#",
    role: "2nd Runner-Up — CheckMate",
    desc: "Facial-embedding and vector-search platform built in a national collegiate hackathon.",
    cases: [],
    category: "award",
  },
  {
    year: "2024",
    route: "—",
    logos: [],
    company: "Springer SIST",
    href: "#",
    role: "Alzheimer's Guardian",
    desc: "Deep learning, NLP and an LLM combined for visitor recognition — a Siamese CNN reaching 98.2% precision, paired with a 0–100 trust score at MAE 4.88.",
    cases: [],
    category: "project",
    paperHref: "https://doi.org/10.1007/978-3-032-25490-0_38",
  },
  {
    year: "2023",
    route: "—",
    logos: [],
    company: "Springer LNEE",
    href: "#",
    role: "PoseNet + DTW VR Scoring",
    desc: "Integrated PoseNet with Dynamic Time Warping and cosine similarity in a Unity VR game, reaching 99.76% maximum scoring accuracy.",
    cases: [],
    category: "project",
    paperHref: "https://doi.org/10.1007/978-981-99-5974-7_56",
  },
  {
    year: "2023",
    route: "HYD",
    logos: [],
    company: "Techolution",
    href: "https://www.techolution.com/",
    role: "Artificial Intelligence Intern",
    desc: "Extended a custom YOLOv3 surgical-instrument detector with Reinforcement Learning with Expert Feedback, raising F1 by 1.9% and IoU from 0.79 to 0.88 in low light; shipped it end-to-end on a Dockerized GCP VM.",
    cases: [],
    category: "work",
  },
  {
    year: "2023",
    route: "BOM",
    logos: [],
    company: "S.P.I.T. Hackathon",
    href: "#",
    role: "1st Place — Genie.us",
    desc: "A RoBERTa-based platform generating summaries, MCQs and flashcards from study material.",
    cases: [],
    category: "award",
  },
  {
    year: "2023",
    route: "—",
    logos: [],
    company: "Apple Academic Press",
    href: "#",
    role: "Virtual Piano",
    desc: "A paper-based instrument using computer-vision pose estimation to synthesize 8 chords at 0.014s latency and 0.883 accuracy.",
    cases: [],
    category: "project",
  },
  {
    year: "2023",
    route: "BOM",
    logos: [],
    company: "Buyceps",
    href: "#",
    role: "Software Engineer Intern",
    desc: "Shipped product-search and UI/UX improvements for an e-commerce platform's Phase 2, managing CI/CD with A/B testing and SQA gates.",
    cases: [],
    category: "work",
  },
  {
    year: "2022",
    route: "BOM",
    logos: [],
    company: "Haspr — Brand Experience Agency",
    href: "#",
    role: "Frontend Developer",
    desc: "Frontend development for a brand-experience agency's client engagements.",
    cases: [],
    category: "work",
  },
  {
    year: "2022",
    route: "BOM",
    logos: [],
    company: "TCET Hackanova",
    href: "#",
    role: "1st Place, IoT Track — Smart Wastebin",
    desc: "Automated waste segregation via CNN classification.",
    cases: [],
    category: "award",
  },
  {
    year: "2021",
    route: "BOM",
    logos: [],
    company: "DJ Synapse — Machine Learning Committee",
    href: "#",
    role: "Machine Learning Committee",
    desc: "",
    cases: [],
    category: "work",
    subRoles: [
      {
        role: "Head of Events & PR",
        period: "Aug 2022 – Apr 2024",
        desc: "Co-led the events team, organizing a 24-hour flagship hackathon plus HackNiche 1.0, ReQuest 1.0 and a Python bootcamp engaging 1,200+ participants.",
      },
      {
        role: "Machine Learning Developer",
        period: "Sep 2021 – Aug 2022",
        desc: "Mentored 8 ML developers; built CNNs for lane detection, chest X-ray pneumonia detection, pose estimation and driver-drowsiness detection.",
      },
    ],
  },
  {
    year: "2021",
    route: "BOM",
    logos: [],
    company: "Dwarkadas J. Sanghvi College of Engineering",
    href: "#",
    role: "BTech Computer Engineering, Honors in Intelligent Computing",
    desc: "CGPA 9.56/10 — alongside coursework, mentored and led through DJ Synapse and DJ Sanghvi ACM.",
    cases: [],
    category: "education",
  },
];

// TODO: these are still Mike Barton's original photos — swap in Kush's own
// once supplied, this fan shouldn't ship with someone else's pictures/captions.
export const MEMORIES: Memory[] = [
  { src: asset("/folio/memories/m1.jpg"), caption: "Home sweet home" },
  { src: asset("/folio/memories/m2.jpg"), caption: "Happy place" },
  { src: asset("/folio/memories/m3.jpg"), caption: "I Miss Japan" },
  { src: asset("/folio/memories/m4.jpg"), caption: "NYC, ILY" },
  { src: asset("/folio/memories/m5.jpg"), caption: "Wannabe Rockstar" },
];

export const SOCIAL_LINKS: FooterLink[] = [
  { label: "GitHub", href: "https://github.com/Kushmaniar" },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/kush-maniar/" },
];

export const EMAIL_HREF = `mailto:kushmaniar.tech@gmail.com?subject=${encodeURIComponent("So, about your portfolio...")}`;
