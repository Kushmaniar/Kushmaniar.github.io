import { CABIN_DARK_KEY, asset } from "./config";

// Cabin light theme: the window shade drives a full-screen veil while it moves,
// then flips <html data-theme> once it comes to rest at either end.

let isDark = typeof document !== "undefined" && document.documentElement.dataset.theme === "dark";
let veil: HTMLDivElement | null = null;
let recolourTimer: ReturnType<typeof setTimeout> | undefined;
let sound: HTMLAudioElement | null = null;
let soundEnabled = true;

/**
 * The light/dark flip sounds like a switch being thrown. A local asset, not
 * from the target site, which used a shade-slide sample here.
 */
const SWITCH_SOUND = "/flip-switch.mp3";

function ensureVeil() {
  if (!veil) {
    veil = document.createElement("div");
    veil.setAttribute("aria-hidden", "true");
    veil.style.cssText = "position:fixed;inset:0;z-index:4;pointer-events:none;opacity:0";
  }
  if (!veil.isConnected) document.body.appendChild(veil);
  return veil;
}

function getSound() {
  if (!soundEnabled) return null;
  if (!sound) {
    const audio = new Audio(asset(SWITCH_SOUND));
    audio.preload = "auto";
    audio.volume = 0.3;
    audio.addEventListener("error", () => {
      soundEnabled = false;
      sound = null;
    });
    sound = audio;
  }
  return sound;
}

function playSound() {
  try {
    const audio = getSound();
    if (!audio) return;
    audio.currentTime = 0;
    audio.play()?.catch(() => {});
  } catch {
    // Autoplay or decoding refused; the theme still switches silently.
  }
}

function veilColour(dark: boolean) {
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(dark ? "--veil-dark" : "--veil-light")
    .trim();
  return value || (dark ? "#191817" : "#faf5f5");
}

function apply(dark: boolean) {
  const html = document.documentElement;
  // Restart the colour-transition window on every flip.
  html.classList.remove("is-recolouring");
  void html.offsetWidth;
  html.classList.add("is-recolouring");
  clearTimeout(recolourTimer);
  recolourTimer = setTimeout(() => html.classList.remove("is-recolouring"), 580);

  if (dark) html.dataset.theme = "dark";
  else delete html.dataset.theme;
  try {
    if (dark) localStorage.setItem(CABIN_DARK_KEY, "1");
    else localStorage.removeItem(CABIN_DARK_KEY);
  } catch {
    // Storage blocked: the theme just won't persist.
  }

  const v = ensureVeil();
  v.style.transition = "opacity 300ms var(--ease-out, ease-out)";
  v.style.opacity = "0";
  setTimeout(() => {
    v.style.transition = "";
  }, 340);
}

function commit(dark: boolean) {
  if (dark === isDark) return;
  isDark = dark;
  playSound();
  setTimeout(() => {
    if (isDark === dark) apply(dark);
  }, 60);
}

/** useShadeSpring onChange: paints the veil mid-travel, commits the theme at rest. */
export function onShadeChange(shade: number, settled: boolean): void {
  const v = ensureVeil();
  if (settled) {
    if (shade >= 0.999) return commit(true);
    if (shade <= 0.001) return commit(false);
  }
  // Warm the sound up while the shade is moving so the commit plays promptly.
  getSound();
  v.style.transition = "";
  v.style.backgroundColor = veilColour(!isDark);
  v.style.opacity = String(isDark ? 1 - shade : shade);
}
