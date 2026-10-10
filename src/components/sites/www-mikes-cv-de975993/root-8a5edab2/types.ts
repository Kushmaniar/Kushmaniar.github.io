export interface TimelineLogo {
  src: string;
  url?: string;
  name?: string;
  bg?: string;
}

export interface CaseStudyLink {
  title: string;
  desc: string;
  to: string;
  shots: string[];
}

/** Distinguishes work history from the other things that share the timeline rail. */
export type TimelineCategory = "work" | "education" | "project" | "award";

/** A second role held at the same company/org, folded under one timeline entry. */
export interface TimelineSubRole {
  role: string;
  period: string;
  desc?: string;
}

export interface TimelineEntryData {
  year: string;
  route: string;
  logos: TimelineLogo[];
  company: string;
  href: string;
  current?: boolean;
  role: string;
  desc: string;
  cases: CaseStudyLink[];
  /** Defaults to "work" when omitted. */
  category?: TimelineCategory;
  /** Additional roles at the same entry, newest first, rendered without their own dot. */
  subRoles?: TimelineSubRole[];
}

export interface Memory {
  src: string;
  caption?: string;
  turned?: boolean;
}

export interface FooterLink {
  label: string;
  href: string;
}

/** Card reader display / LED state on the gate. */
export type ReaderStatus = "idle" | "near" | "error" | "granted";

/** Shared, per-frame card position the reader's contact shadow follows. */
export interface CardContact {
  x: number;
  lift: number;
  fade: number;
}

/** Synth sound names played through WebAudio on the gate. */
export type SoundName =
  | "chime"
  | "sparkle"
  | "droplet"
  | "bloom"
  | "whisper"
  | "tick"
  | "press"
  | "release"
  | "toggle"
  | "success"
  | "error"
  | "page"
  | "loading"
  | "ready";
