import * as THREE from "three";
import type { ReaderStatus } from "../types";

// STUB — replaced by builder (see docs/research/.../components/PassKit.spec.md)

/** Canvas font used on the reader's LCD. */
export const LCD_FONT = '400 62px "MB LCD", "MB Mono", ui-monospace, monospace';

/** Warm plastic albedo with blotches and specks (256², sRGB). */
export function useGrainTexture(_color: string, _specks: number): THREE.CanvasTexture {
  return new THREE.CanvasTexture(document.createElement("canvas"));
}

/** Brushed-scratch bump/roughness map (512², repeating). */
export function useBrushedTexture(_repeatX: number, _repeatY: number): THREE.CanvasTexture {
  return new THREE.CanvasTexture(document.createElement("canvas"));
}

/** One LCD texture per reader status: READY / READING / ERROR / SUCCESS. */
export function useLcdTextures(): Record<ReaderStatus, THREE.CanvasTexture> {
  const t = new THREE.CanvasTexture(document.createElement("canvas"));
  return { idle: t, near: t, error: t, granted: t };
}

/** Boarding pass front/back artwork (back mirrored horizontally). */
export function usePassTextures(): { front: THREE.Texture; back: THREE.Texture } {
  const t = new THREE.Texture();
  return { front: t, back: t };
}
