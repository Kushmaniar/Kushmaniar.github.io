# PlaneWindowScene Specification

## Overview
- **Target file:** `src/components/sites/www-mikes-cv-de975993/root-8a5edab2/PlaneWindowScene.tsx` (stub: `export default function PlaneWindowScene({ paused }: { paused?: boolean })` — DEFAULT export, it's lazy-loaded)
- **Screenshot:** `docs/design-references/www-mikes-cv-de975993/root-8a5edab2/folio-desktop-1440-viewport.png` — blue sky fading to white haze, soft drifting clouds low in the window, sea visible through the haze.
- **Interaction model:** time-driven (continuous animation), paused → `frameloop="demand"`.
- Libraries (installed): `three@0.186`, `@react-three/fiber@9` (`Canvas`, `useFrame`), `@react-three/drei@10` (`Clouds`, `Cloud`).

## Structure
Fragment with TWO stacked canvases (both `style={{ position: "absolute", inset: 0 }}`, `gl={{ antialias: true, powerPreference: "high-performance", alpha: true }}`, `frameloop={paused ? "demand" : "always"}`):
1. Water canvas: `camera={{ position: [0, 0, 2], fov: 60 }}`, `flat` → `<Water/>`
2. Sky canvas: `camera={{ position: [0, 0, 3], fov: 70 }}` (not flat) → `<Sky/>`
The parent clips/positions them (sky gradient is the CSS background behind both, canvases are transparent).

## Water
- Texture: `new THREE.TextureLoader().load(asset("/waternormals.jpg"))`, wrapS = wrapT = RepeatWrapping (module-level singleton is fine; create lazily on first use).
- mesh rotation [-Math.PI * 0.42, 0, 0], position [0, -1.9, 0.8]; `<planeGeometry args={[20, 20, 64, 64]} />`; `<shaderMaterial>` with uniforms `{ uTime: { value: 0 }, uNormalMap: { value: tex } }` (create once with useMemo).
- useFrame((_, dt) => { time += Math.min(dt, 1/30); material.uniforms.uTime.value = time })
- vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`
- fragmentShader (verbatim):
```glsl
uniform float uTime;
uniform sampler2D uNormalMap;
varying vec2 vUv;
void main() {
  vec2 uv = vUv * 120.0;
  vec2 uv1 = uv * 0.8 + vec2(uTime * 0.02, uTime * 0.01);
  vec2 uv2 = uv * 0.5 - vec2(uTime * 0.015, uTime * 0.008);
  vec3 n1 = texture2D(uNormalMap, uv1).rgb * 2.0 - 1.0;
  vec3 n2 = texture2D(uNormalMap, uv2).rgb * 2.0 - 1.0;
  float waves = (n1.r + n2.r) * 0.5;
  vec3 deepBlue  = vec3(0.00, 0.25, 0.60);
  vec3 midBlue   = vec3(0.05, 0.40, 0.75);
  vec3 lightBlue = vec3(0.20, 0.60, 0.90);
  vec3 colour = mix(deepBlue, midBlue, waves * 0.7);
  colour = mix(colour, lightBlue, waves * waves * 0.3);
  float glint = pow(waves, 8.0) * 0.2;
  colour += vec3(0.8, 0.9, 1.0) * glint;
  float horizonFade = smoothstep(0.0, 0.6, vUv.y);
  vec3 hazeColour = vec3(0.96, 0.98, 1.00);
  colour = mix(colour, hazeColour, horizonFade * 0.98);
  gl_FragColor = vec4(colour, 1.0);
}
```

## Sky
- `<ambientLight intensity={3} color="#e8f4ff" />`, `<directionalLight position={[5, 5, 5]} intensity={2} color="#fff8f0" />`
- **Cirrus layer:** texture `asset("/CirrusCloud.png")` (TextureLoader, colorSpace SRGBColorSpace). Six planes, each its own `MeshBasicMaterial({ map, transparent: true, opacity, depthWrite: false, blending: THREE.NormalBlending })`:
  | x | y | z | w | h | opacity |
  |---|---|---|---|---|---|
  | 0 | 2 | -24 | 18 | 1 | .2 |
  | -4 | 2.1 | -24 | 18 | 1 | .6 |
  | 3 | 1.5 | -24 | 18 | 1 | .2 |
  | 2 | 1.3 | -24 | 18 | 1 | .4 |
  | -5 | 1.9 | -24 | 18 | 1 | .3 |
  | -4 | 1 | -40 | 40 | 10 | 1 |
  All speed .001: useFrame → `dt = min(delta, 1/30)`; `mesh.position.x -= dt * speed`; if `x < -6` → `x = 6`.
- **Cloud banks:** `<Clouds texture={asset("/cloud.png")} limit={400}>` containing 12 `CloudBank`s. CloudBank({position, speed, opacity, segments, bounds, volume, seed, resetX, color, shadowColor}) = group at `position`; useFrame: `x -= min(dt, 1/30) * speed`; if `x < -resetX` → `x = resetX`. Children:
  - `<Cloud opacity={opacity} color={color} segments={segments} bounds={bounds} volume={volume} seed={seed} position={[0, bounds[1] * 0.15, 0]} />`
  - `<Cloud opacity={opacity * 0.7} color={shadowColor} segments={Math.floor(segments * 0.7)} bounds={[bounds[0], bounds[1] * 0.5, bounds[2]]} volume={volume * 0.6} seed={seed + 100} position={[0, -bounds[1] * 0.25, 0]} />`
  | position | speed | opacity | seg | bounds | volume | seed | resetX | color | shadowColor |
  |---|---|---|---|---|---|---|---|---|---|
  | [-1.5,-.8,-16] | .04 | .35 | 10 | [1.5,.4,.4] | .4 | 1 | 4 | #c8d8e8 | #4a6a8a |
  | [.5,-.8,-16] | .03 | .3 | 10 | [1.8,.4,.4] | .4 | 2 | 4 | #d0dce8 | #4a6a8a |
  | [2.5,-.8,-16] | .04 | .32 | 10 | [1.6,.4,.4] | .4 | 3 | 4 | #c8d8e8 | #4a6a8a |
  | [-3,-.85,-16] | .03 | .28 | 10 | [1.4,.35,.35] | .35 | 10 | 4 | #d0dce8 | #4a6a8a |
  | [-1,-.95,-9] | .08 | .55 | 14 | [2.2,.7,.7] | .7 | 4 | 4 | #f0f4f8 | #8aa0b8 |
  | [1,-.9,-9] | .07 | .5 | 14 | [2,.65,.65] | .65 | 5 | 4 | #eef2f8 | #5a7898 |
  | [-3,-1,-9] | .09 | .48 | 12 | [1.8,.6,.6] | .6 | 6 | 4 | #f0f4f8 | #5a7898 |
  | [3,-.62,-9] | .08 | .5 | 12 | [2,.6,.6] | .6 | 11 | 4 | #eef2f8 | #5a7898 |
  | [0,-1.3,-2.5] | .48 | .7 | 18 | [3,1,1] | 1 | 7 | 5 | #ffffff | #7a8fa8 |
  | [-2,-1.4,-2.5] | .52 | .65 | 16 | [2.8,.9,.9] | .9 | 8 | 5 | #fffef8 | #7a8fa8 |
  | [2,-1.5,-2.5] | .44 | .6 | 16 | [2.5,.9,.9] | .9 | 9 | 5 | #ffffff | #7a8fa8 |
  | [-4,-1.2,-2.5] | .5 | .62 | 16 | [2.6,.85,.85] | .85 | 12 | 5 | #fffef8 | #7a8fa8 |
- Drei `Cloud` defaults already match the original (fade 10, growth 4, concentrate "inside", MeshLambertMaterial).
- Mutating `mesh.position` inside useFrame via refs is the intended pattern (satisfies lint because it's in a callback).

## States & Behaviors
- paused (shade closed > .92 or page booting) → frameloop "demand" (freezes).

## Assets
- `asset("/waternormals.jpg")`, `asset("/CirrusCloud.png")`, `asset("/cloud.png")`

## Responsive
- Fills its 200×300 parent at all widths.
