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
    desc: "Studying deep learning, NLP and applied ML at Singapore's top engineering school; came here with two years of production AI work already on the board.",
    cases: [],
    category: "education",
  },
  {
    year: "2025",
    route: "—",
    logos: [],
    company: "Journal of Electrical Systems",
    href: "#",
    role: "Automated Feature Extraction from Version-Control Artifacts",
    desc: "NLP meets software engineering: trained language models to read 50,000+ commits and pull requests, then reconstruct what actually got shipped across 22 open-source repositories.",
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
    desc: "Owned the AI agent and data platform stack at a global alternative asset manager. LangGraph agents run front-line support triage; a natural-language interface replaced raw SQL for six analytics teams. All sitting on real-time change-data-capture over Snowflake.",
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
    desc: "Face-embedding and vector-search engine, built under hackathon clock pressure.",
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
    desc: "A recognition system for Alzheimer's patients that identifies who's at the door and flags unfamiliar visitors to caregivers. Siamese networks match faces; an LLM scores trust.",
    cases: [],
    category: "project",
    paperHref: "https://doi.org/10.1007/978-3-032-25490-0_38",
  },
  {
    // May – Aug 2023
    year: "2023",
    route: "SIN",
    logos: [],
    company: "Drilldown",
    href: "https://drilldown.online/",
    role: "AI/ML Engineer",
    desc: "Ran conversational AI and demand-forecasting for a restaurant-tech company. The kind of problem where a wrong prediction means a walk-in freezer full of wasted produce.",
    cases: [],
    category: "work",
  },
  {
    year: "2023",
    route: "—",
    logos: [],
    company: "Springer LNEE",
    href: "#",
    role: "PoseNet + DTW VR Scoring",
    desc: "Real-time body-pose scoring inside a Unity VR game. Dynamic time warping compares your movements against reference poses frame by frame, pinpointing where your form falls apart.",
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
    desc: "Trained a YOLOv3 detector to spot surgical instruments under operating-room lighting that breaks most vision models, then hardened it with reinforcement learning from expert surgeon feedback. Shipped on GCP.",
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
    desc: "RoBERTa-powered study tool that digests lecture material into summaries, quiz questions and flashcards on the fly.",
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
    desc: "Playing piano with nothing but a webcam and a printed keyboard. Pose estimation tracks your fingers and triggers chord synthesis with near-zero latency.",
    cases: [],
    category: "project",
    paperHref: "https://doi.org/10.1201/9781779643421-12",
  },
  {
    year: "2023",
    route: "BOM",
    logos: [],
    company: "Buyceps",
    href: "#",
    role: "Software Engineer Intern",
    desc: "Product search overhaul and interface rework for an e-commerce company's second launch phase, with A/B-tested deploys gating every release.",
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
    desc: "Client-facing frontend work at a brand-experience agency.",
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
    desc: "CNN-powered waste bin that sorts recyclables on its own.",
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
        desc: "Ran the events wing: a 24-hour flagship hackathon, HackNiche 1.0, ReQuest 1.0 and a Python bootcamp that pulled in 1,200+ participants total.",
      },
      {
        role: "Machine Learning Developer",
        period: "Sep 2021 – Aug 2022",
        desc: "Mentored eight developers while building CNNs for lane detection, X-ray diagnosis, pose estimation and drowsiness detection.",
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
    desc: "9.56/10 CGPA. Spent the extracurriculars leading DJ Synapse and DJ Sanghvi ACM.",
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
