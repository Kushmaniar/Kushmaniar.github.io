"use client";

import type { RefObject } from "react";

export interface SplashProps {
  /** Roots whose <img>/<video> must finish loading before the splash leaves. */
  targets: RefObject<HTMLElement | null>[];
  /** False during SSR/hydration; preloading starts the first time it's true. */
  ready: boolean;
  onDone: () => void;
}

// STUB — replaced by builder (see docs/research/.../components/Splash.spec.md)
export function Splash(_props: SplashProps) {
  return null;
}
