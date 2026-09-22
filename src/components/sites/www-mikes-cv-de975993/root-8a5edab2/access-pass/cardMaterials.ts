import * as THREE from "three";

// STUB — replaced by builder (see docs/research/.../components/PassKit.spec.md)

/** Uniforms shared by the card's front, back and depth materials. */
export interface CardUniforms {
  [uniform: string]: THREE.IUniform<number>;
  uCurve: THREE.IUniform<number>;
  uSlant: THREE.IUniform<number>;
  uHalfW: THREE.IUniform<number>;
  uHalfH: THREE.IUniform<number>;
  uRadius: THREE.IUniform<number>;
}

/** MeshStandardMaterial bent by uCurve/uSlant and masked to a rounded rect. */
export function createCardMaterial(
  params: THREE.MeshStandardMaterialParameters,
  _uniforms: CardUniforms,
): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ transparent: true, ...params });
}

/** Depth material matching the card's bend + rounded mask, for shadows. */
export function createCardDepthMaterial(_uniforms: CardUniforms): THREE.MeshDepthMaterial {
  return new THREE.MeshDepthMaterial();
}
