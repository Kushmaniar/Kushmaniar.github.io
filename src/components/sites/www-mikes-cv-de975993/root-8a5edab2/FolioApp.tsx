"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { CABIN_DARK_KEY, PASS_UNLOCKED_KEY, canRenderWebGL } from "./config";
import { Folio } from "./Folio";
import { Splash } from "./Splash";

const AccessPass = dynamic(() => import("./access-pass/AccessPass"), { ssr: false });

/** How long the splash keeps fading after `onDone` before it unmounts. */
const SPLASH_EXIT_MS = 280;
const MEDIA_SELECTOR = "img, video, canvas, picture, svg";

type Phase = "splash" | "pass" | "site";

const noopSubscribe = () => () => {};

/** False on the server and during hydration, true afterwards. */
function useIsClient() {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

function isPassUnlocked() {
  try {
    return localStorage.getItem(PASS_UNLOCKED_KEY) === "1";
  } catch {
    return false;
  }
}

/** Blocks the long-press menu and native drag on imagery, like the original. */
function useMediaGuards() {
  useEffect(() => {
    const block = (e: Event) => {
      if (e.target instanceof Element && e.target.closest(MEDIA_SELECTOR)) e.preventDefault();
    };
    document.addEventListener("contextmenu", block);
    document.addEventListener("dragstart", block);
    return () => {
      document.removeEventListener("contextmenu", block);
      document.removeEventListener("dragstart", block);
    };
  }, []);
}

/**
 * Splash → gate (first visit, WebGL capable) → folio. Everything that depends
 * on the browser (storage, WebGL, theme) renders only after hydration; until
 * then the server-rendered splash covers the page.
 */
export function FolioApp() {
  const isClient = useIsClient();
  const [phase, setPhase] = useState<Phase>("splash");
  const [splashOn, setSplashOn] = useState(true);
  // Lazy initialisers only matter on the client: nothing reads these until isClient.
  const [showPass] = useState(() => typeof window !== "undefined" && !isPassUnlocked() && canRenderWebGL());
  const [webgl] = useState(() => typeof window !== "undefined" && canRenderWebGL());
  const mainRef = useRef<HTMLElement>(null);
  const passRef = useRef<HTMLDivElement>(null);
  const [targets] = useState(() => [mainRef, passRef]);
  const covered = phase !== "site";

  useMediaGuards();

  useEffect(() => {
    document.documentElement.classList.toggle("is-covered", covered);
    return () => document.documentElement.classList.remove("is-covered");
  }, [covered]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const enterSite = () => {
    try {
      localStorage.setItem(PASS_UNLOCKED_KEY, "1");
    } catch {}
    setPhase("site");
  };

  const returnToGate = () => {
    try {
      localStorage.removeItem(PASS_UNLOCKED_KEY);
      localStorage.removeItem(CABIN_DARK_KEY);
    } catch {}
    location.reload();
  };

  const onSplashDone = () => {
    setPhase(showPass ? "pass" : "site");
    setTimeout(() => setSplashOn(false), SPLASH_EXIT_MS);
  };

  return (
    <>
      {isClient && (
        <Folio ref={mainRef} booting={covered} onReset={webgl ? returnToGate : undefined} />
      )}
      {isClient && showPass && phase !== "site" && (
        <AccessPass ref={passRef} onGranted={enterSite} onSkip={enterSite} />
      )}
      {splashOn && <Splash targets={targets} ready={isClient} onDone={onSplashDone} />}
    </>
  );
}
