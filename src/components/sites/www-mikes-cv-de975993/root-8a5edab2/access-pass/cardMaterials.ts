import * as THREE from "three";

/** Uniforms shared by the card's front, back and depth materials. */
export interface CardUniforms {
  [uniform: string]: THREE.IUniform<number>;
  uCurve: THREE.IUniform<number>;
  uSlant: THREE.IUniform<number>;
  uHalfW: THREE.IUniform<number>;
  uHalfH: THREE.IUniform<number>;
  uRadius: THREE.IUniform<number>;
}

// Bend: z(x) = halfW * (curve * (nx² - 1/3) + slant * nx), nx = x / halfW.
const VERTEX_HEADER = `#include <common>
uniform float uCurve; uniform float uSlant; uniform float uHalfW;
varying vec2 vCardXY;`;

const BEND = `vec3 transformed = vec3(position);
transformed.z += uHalfW * (uCurve * (_nx * _nx - 0.3333) + uSlant * _nx);`;

const FRAGMENT_HEADER = `#include <common>
uniform float uHalfW; uniform float uHalfH; uniform float uRadius;
varying vec2 vCardXY;`;

// Signed distance to the rounded card outline (negative inside).
const ROUNDED_SDF = `vec2 _q = abs(vCardXY) - (vec2(uHalfW, uHalfH) - uRadius);
float _d = length(max(_q, 0.0)) + min(max(_q.x, _q.y), 0.0) - uRadius;`;

/** MeshStandardMaterial bent by uCurve/uSlant and masked to a rounded rect. */
export function createCardMaterial(
  params: THREE.MeshStandardMaterialParameters,
  uniforms: CardUniforms,
): THREE.MeshStandardMaterial {
  const m = new THREE.MeshStandardMaterial({ transparent: true, ...params });
  m.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", VERTEX_HEADER)
      .replace(
        "#include <beginnormal_vertex>",
        `float _nx = position.x / uHalfW;
float _ddx = 2.0 * uCurve * _nx + uSlant;
vec3 objectNormal = normalize(vec3(-_ddx, 0.0, 1.0));`,
      )
      .replace("#include <begin_vertex>", `vCardXY = position.xy;\n${BEND}`);
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", FRAGMENT_HEADER)
      .replace(
        "#include <map_fragment>",
        `#include <map_fragment>
${ROUNDED_SDF}
float _aa = fwidth(_d);
float _mask = 1.0 - smoothstep(-_aa, _aa, _d);
if (_mask < 0.01) discard;
diffuseColor.a *= _mask;`,
      );
  };
  return m;
}

/** Depth material matching the card's bend + rounded mask, for shadows. */
export function createCardDepthMaterial(uniforms: CardUniforms): THREE.MeshDepthMaterial {
  const m = new THREE.MeshDepthMaterial({
    depthPacking: THREE.RGBADepthPacking,
    side: THREE.DoubleSide,
  });
  m.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", VERTEX_HEADER)
      .replace(
        "#include <begin_vertex>",
        `vCardXY = position.xy;\nfloat _nx = position.x / uHalfW;\n${BEND}`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", FRAGMENT_HEADER)
      .replace(
        "#include <clipping_planes_fragment>",
        `#include <clipping_planes_fragment>
${ROUNDED_SDF}
if (_d > 0.0) discard;`,
      );
  };
  return m;
}
