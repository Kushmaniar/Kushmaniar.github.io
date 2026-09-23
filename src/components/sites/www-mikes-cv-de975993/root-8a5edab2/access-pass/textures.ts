import { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { asset } from "../config";
import type { ReaderStatus } from "../types";

/** Canvas font used on the reader's LCD. */
export const LCD_FONT = '400 62px "MB LCD", "MB Mono", ui-monospace, monospace';

const TAU = Math.PI * 2;

function createCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function makeGrain(color: string, specks: number): THREE.CanvasTexture {
  const size = 256;
  const canvas = createCanvas(size, size);
  const g = canvas.getContext("2d");
  if (g) {
    g.fillStyle = color;
    g.fillRect(0, 0, size, size);

    // Soft warm blotches.
    for (let i = 0; i < 16; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const r = Math.random() * 70 + 45;
      const grad = g.createRadialGradient(x, y, 0, x, y, r);
      grad.addColorStop(0, `rgba(172, 140, 74, ${Math.random() * 0.035 + 0.012})`);
      grad.addColorStop(1, "rgba(172, 140, 74, 0)");
      g.fillStyle = grad;
      g.beginPath();
      g.arc(x, y, r, 0, TAU);
      g.fill();
    }

    // Fine specks.
    for (let i = 0; i < specks; i++) {
      g.fillStyle = `rgba(100, 90, 64, ${Math.random() * 0.1 + 0.035})`;
      g.beginPath();
      g.arc(Math.random() * size, Math.random() * size, Math.random() * 1.1 + 0.3, 0, TAU);
      g.fill();
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Offsets that repeat each stroke across the wrap seams. */
const WRAP_OFFSETS: ReadonlyArray<readonly [number, number]> = [
  [0, 0],
  [-512, 0],
  [0, -512],
];

function makeBrushed(repeatX: number, repeatY: number): THREE.CanvasTexture {
  const size = 512;
  const canvas = createCanvas(size, size);
  const g = canvas.getContext("2d");
  if (g) {
    g.fillStyle = "rgb(199,199,199)";
    g.fillRect(0, 0, size, size);

    // Low-contrast grey noise, upscaled for a softer grain.
    const noiseCanvas = createCanvas(256, 256);
    const ng = noiseCanvas.getContext("2d");
    if (ng) {
      const img = ng.createImageData(256, 256);
      const px = img.data;
      for (let i = 0; i < px.length; i += 4) {
        const grey = 199 + (Math.random() - 0.5) * 20;
        px[i] = grey;
        px[i + 1] = grey;
        px[i + 2] = grey;
        px[i + 3] = 255;
      }
      ng.putImageData(img, 0, 0);
      g.globalAlpha = 0.4;
      g.drawImage(noiseCanvas, 0, 0, size, size);
      g.globalAlpha = 1;
    }

    g.lineCap = "round";
    const stroke = (len: number, spread: number, width: number, alpha: number) => {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const a = (Math.random() - 0.5) * spread;
      const dx = Math.cos(a) * len;
      const dy = Math.sin(a) * len;
      g.lineWidth = width;
      g.strokeStyle = `rgba(${Math.random() < 0.55 ? "255,255,255" : "90,90,90"}, ${alpha})`;
      for (const [ox, oy] of WRAP_OFFSETS) {
        g.beginPath();
        g.moveTo(x + ox, y + oy);
        g.lineTo(x + dx + ox, y + dy + oy);
        g.stroke();
      }
    };

    for (let i = 0; i < 420; i++) {
      stroke(14 + Math.random() * 90, 0.5, 0.9 + Math.random() * 0.9, Math.random() * 0.34 + 0.14);
    }
    for (let i = 0; i < 46; i++) {
      stroke(120 + Math.random() * 320, 0.22, 1.2, Math.random() * 0.2 + 0.08);
    }
    for (let i = 0; i < 16; i++) {
      stroke(5 + Math.random() * 20, 2.4, 2.2, Math.random() * 0.3 + 0.25);
    }
  }
  // Data texture (bump/roughness): leave colorSpace linear.
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.anisotropy = 8;
  return tex;
}

interface Lcd {
  tex: THREE.CanvasTexture;
  draw: () => void;
}

function makeLcd(text: string, color: string): Lcd {
  const canvas = createCanvas(512, 128);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;

  const draw = () => {
    const g = canvas.getContext("2d");
    if (!g) return;
    // save/restore so the glow settings don't leak into the next redraw's background.
    g.save();
    g.clearRect(0, 0, 512, 128);
    g.fillStyle = "#0d0f0d";
    g.fillRect(0, 0, 512, 128);
    g.fillStyle = "rgba(255,255,255,0.025)";
    for (let y = 0; y < 128; y += 4) g.fillRect(0, y, 512, 1);
    g.font = LCD_FONT;
    g.letterSpacing = "8px";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.shadowColor = color;
    g.shadowBlur = 16;
    g.fillStyle = color;
    g.fillText(text, 262, 70);
    g.restore();
    tex.needsUpdate = true;
  };

  draw();
  return { tex, draw };
}

function makeLcdSet(): Record<ReaderStatus, Lcd> {
  return {
    idle: makeLcd("READY", "#7d857c"),
    near: makeLcd("READING", "#d9a013"),
    error: makeLcd("ERROR", "#e0483a"),
    granted: makeLcd("SUCCESS", "#35c56d"),
  };
}

function makePassTextures(): { front: THREE.Texture; back: THREE.Texture } {
  const load = (url: string, mirror: boolean) => {
    const tex = new THREE.TextureLoader().load(url);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 16;
    if (mirror) {
      tex.wrapS = THREE.RepeatWrapping;
      tex.repeat.x = -1;
    }
    return tex;
  };
  return {
    front: load(asset("/folio/boarding-pass.png"), false),
    back: load(asset("/folio/boarding-pass-back.png"), true),
  };
}

/** Warm plastic albedo with blotches and specks (256², sRGB). */
export function useGrainTexture(color: string, specks: number): THREE.CanvasTexture {
  return useMemo(() => makeGrain(color, specks), [color, specks]);
}

/** Brushed-scratch bump/roughness map (512², repeating). */
export function useBrushedTexture(repeatX: number, repeatY: number): THREE.CanvasTexture {
  return useMemo(() => makeBrushed(repeatX, repeatY), [repeatX, repeatY]);
}

/** One LCD texture per reader status: READY / READING / ERROR / SUCCESS. */
export function useLcdTextures(): Record<ReaderStatus, THREE.CanvasTexture> {
  const [{ lcds, textures }] = useState(() => {
    const set = makeLcdSet();
    const byStatus: Record<ReaderStatus, THREE.CanvasTexture> = {
      idle: set.idle.tex,
      near: set.near.tex,
      error: set.error.tex,
      granted: set.granted.tex,
    };
    return { lcds: set, textures: byStatus };
  });

  // Redraw once the LCD webfont is available (first draw may use a fallback).
  useEffect(() => {
    if (!document.fonts) return;
    let alive = true;
    document.fonts
      .load(LCD_FONT)
      .catch(() => {})
      .then(() => document.fonts.ready)
      .then(() => {
        if (!alive) return;
        lcds.idle.draw();
        lcds.near.draw();
        lcds.error.draw();
        lcds.granted.draw();
      });
    return () => {
      alive = false;
    };
  }, [lcds]);

  return textures;
}

/** Boarding pass front/back artwork (back mirrored horizontally). */
export function usePassTextures(): { front: THREE.Texture; back: THREE.Texture } {
  return useMemo(() => makePassTextures(), []);
}
