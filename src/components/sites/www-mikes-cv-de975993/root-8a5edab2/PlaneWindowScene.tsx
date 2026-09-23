"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { Cloud, Clouds } from "@react-three/drei";
import { asset } from "./config";

type Vec3 = [number, number, number];

/** Clamp per-frame delta so a backgrounded tab doesn't teleport everything. */
const MAX_DT = 1 / 30;

const CANVAS_STYLE = { position: "absolute", inset: 0 } as const;
const GL_OPTIONS = { antialias: true, powerPreference: "high-performance", alpha: true } as const;
const WATER_CAMERA = { position: [0, 0, 2] as Vec3, fov: 60 };
const SKY_CAMERA = { position: [0, 0, 3] as Vec3, fov: 70 };

/* ------------------------------------------------------------------ */
/* Water                                                               */
/* ------------------------------------------------------------------ */

const WATER_VERTEX = /* glsl */ `
varying vec2 vUv;
void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;

const WATER_FRAGMENT = /* glsl */ `
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
`;

const WATER_ROTATION: Vec3 = [-Math.PI * 0.42, 0, 0];
const WATER_POSITION: Vec3 = [0, -1.9, 0.8];

function Water() {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const time = useRef(0);

  const uniforms = useMemo(() => {
    const normals = new THREE.TextureLoader().load(asset("/waternormals.jpg"));
    normals.wrapS = THREE.RepeatWrapping;
    normals.wrapT = THREE.RepeatWrapping;
    return { uTime: { value: 0 }, uNormalMap: { value: normals } };
  }, []);

  useFrame((_, dt) => {
    time.current += Math.min(dt, MAX_DT);
    const material = materialRef.current;
    if (material) material.uniforms.uTime.value = time.current;
  });

  return (
    <mesh rotation={WATER_ROTATION} position={WATER_POSITION}>
      <planeGeometry args={[20, 20, 64, 64]} />
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={WATER_VERTEX}
        fragmentShader={WATER_FRAGMENT}
      />
    </mesh>
  );
}

/* ------------------------------------------------------------------ */
/* Sky: cirrus sheets + volumetric cloud banks                         */
/* ------------------------------------------------------------------ */

type CirrusLayer = { position: Vec3; size: [number, number]; opacity: number };

const CIRRUS_SPEED = 0.001;
const CIRRUS_RESET_X = 6;
const CIRRUS: readonly CirrusLayer[] = [
  { position: [0, 2, -24], size: [18, 1], opacity: 0.2 },
  { position: [-4, 2.1, -24], size: [18, 1], opacity: 0.6 },
  { position: [3, 1.5, -24], size: [18, 1], opacity: 0.2 },
  { position: [2, 1.3, -24], size: [18, 1], opacity: 0.4 },
  { position: [-5, 1.9, -24], size: [18, 1], opacity: 0.3 },
  { position: [-4, 1, -40], size: [40, 10], opacity: 1 },
];

function CirrusPlane({ layer, map }: { layer: CirrusLayer; map: THREE.Texture }) {
  const meshRef = useRef<THREE.Mesh>(null);

  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map,
        transparent: true,
        opacity: layer.opacity,
        depthWrite: false,
        blending: THREE.NormalBlending,
      }),
    [map, layer.opacity],
  );

  useFrame((_, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    mesh.position.x -= Math.min(delta, MAX_DT) * CIRRUS_SPEED;
    if (mesh.position.x < -CIRRUS_RESET_X) mesh.position.x = CIRRUS_RESET_X;
  });

  return (
    <mesh ref={meshRef} position={layer.position} material={material}>
      <planeGeometry args={layer.size} />
    </mesh>
  );
}

type CloudBankProps = {
  position: Vec3;
  speed: number;
  opacity: number;
  segments: number;
  bounds: Vec3;
  volume: number;
  seed: number;
  resetX: number;
  color: string;
  shadowColor: string;
};

// Far row (z -16) → mid row (z -9) → near row (z -2.5); nearer banks are
// larger, brighter and drift faster for parallax.
const CLOUD_BANKS: readonly CloudBankProps[] = [
  { position: [-1.5, -0.8, -16], speed: 0.04, opacity: 0.35, segments: 10, bounds: [1.5, 0.4, 0.4], volume: 0.4, seed: 1, resetX: 4, color: "#c8d8e8", shadowColor: "#4a6a8a" },
  { position: [0.5, -0.8, -16], speed: 0.03, opacity: 0.3, segments: 10, bounds: [1.8, 0.4, 0.4], volume: 0.4, seed: 2, resetX: 4, color: "#d0dce8", shadowColor: "#4a6a8a" },
  { position: [2.5, -0.8, -16], speed: 0.04, opacity: 0.32, segments: 10, bounds: [1.6, 0.4, 0.4], volume: 0.4, seed: 3, resetX: 4, color: "#c8d8e8", shadowColor: "#4a6a8a" },
  { position: [-3, -0.85, -16], speed: 0.03, opacity: 0.28, segments: 10, bounds: [1.4, 0.35, 0.35], volume: 0.35, seed: 10, resetX: 4, color: "#d0dce8", shadowColor: "#4a6a8a" },
  { position: [-1, -0.95, -9], speed: 0.08, opacity: 0.55, segments: 14, bounds: [2.2, 0.7, 0.7], volume: 0.7, seed: 4, resetX: 4, color: "#f0f4f8", shadowColor: "#8aa0b8" },
  { position: [1, -0.9, -9], speed: 0.07, opacity: 0.5, segments: 14, bounds: [2, 0.65, 0.65], volume: 0.65, seed: 5, resetX: 4, color: "#eef2f8", shadowColor: "#5a7898" },
  { position: [-3, -1, -9], speed: 0.09, opacity: 0.48, segments: 12, bounds: [1.8, 0.6, 0.6], volume: 0.6, seed: 6, resetX: 4, color: "#f0f4f8", shadowColor: "#5a7898" },
  { position: [3, -0.62, -9], speed: 0.08, opacity: 0.5, segments: 12, bounds: [2, 0.6, 0.6], volume: 0.6, seed: 11, resetX: 4, color: "#eef2f8", shadowColor: "#5a7898" },
  { position: [0, -1.3, -2.5], speed: 0.48, opacity: 0.7, segments: 18, bounds: [3, 1, 1], volume: 1, seed: 7, resetX: 5, color: "#ffffff", shadowColor: "#7a8fa8" },
  { position: [-2, -1.4, -2.5], speed: 0.52, opacity: 0.65, segments: 16, bounds: [2.8, 0.9, 0.9], volume: 0.9, seed: 8, resetX: 5, color: "#fffef8", shadowColor: "#7a8fa8" },
  { position: [2, -1.5, -2.5], speed: 0.44, opacity: 0.6, segments: 16, bounds: [2.5, 0.9, 0.9], volume: 0.9, seed: 9, resetX: 5, color: "#ffffff", shadowColor: "#7a8fa8" },
  { position: [-4, -1.2, -2.5], speed: 0.5, opacity: 0.62, segments: 16, bounds: [2.6, 0.85, 0.85], volume: 0.85, seed: 12, resetX: 5, color: "#fffef8", shadowColor: "#7a8fa8" },
];

function CloudBank({
  position,
  speed,
  opacity,
  segments,
  bounds,
  volume,
  seed,
  resetX,
  color,
  shadowColor,
}: CloudBankProps) {
  const groupRef = useRef<THREE.Group>(null);

  // Stable array identities — drei's Cloud re-lays out its puffs when `bounds` changes.
  const layout = useMemo(
    () => ({
      topPosition: [0, bounds[1] * 0.15, 0] as Vec3,
      shadowPosition: [0, -bounds[1] * 0.25, 0] as Vec3,
      shadowBounds: [bounds[0], bounds[1] * 0.5, bounds[2]] as Vec3,
    }),
    [bounds],
  );

  useFrame((_, dt) => {
    const group = groupRef.current;
    if (!group) return;
    group.position.x -= Math.min(dt, MAX_DT) * speed;
    if (group.position.x < -resetX) group.position.x = resetX;
  });

  return (
    <group ref={groupRef} position={position}>
      <Cloud
        opacity={opacity}
        color={color}
        segments={segments}
        bounds={bounds}
        volume={volume}
        seed={seed}
        position={layout.topPosition}
      />
      {/* Darker, flatter underside gives each bank its shaded belly. */}
      <Cloud
        opacity={opacity * 0.7}
        color={shadowColor}
        segments={Math.floor(segments * 0.7)}
        bounds={layout.shadowBounds}
        volume={volume * 0.6}
        seed={seed + 100}
        position={layout.shadowPosition}
      />
    </group>
  );
}

function Sky() {
  const cirrusMap = useMemo(() => {
    const texture = new THREE.TextureLoader().load(asset("/CirrusCloud.png"));
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }, []);

  return (
    <>
      <ambientLight intensity={3} color="#e8f4ff" />
      <directionalLight position={[5, 5, 5]} intensity={2} color="#fff8f0" />
      {CIRRUS.map((layer, i) => (
        <CirrusPlane key={i} layer={layer} map={cirrusMap} />
      ))}
      <Clouds texture={asset("/cloud.png")} limit={400}>
        {CLOUD_BANKS.map((bank) => (
          <CloudBank key={bank.seed} {...bank} />
        ))}
      </Clouds>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Scene                                                               */
/* ------------------------------------------------------------------ */

/**
 * The view out of the airplane window: a sea plane fading into haze, with
 * cirrus sheets and drifting cumulus banks on a transparent canvas above it.
 * The parent supplies the clip and the CSS sky gradient behind both canvases.
 */
export default function PlaneWindowScene({ paused }: { paused?: boolean }) {
  const frameloop = paused ? "demand" : "always";

  return (
    <>
      <Canvas style={CANVAS_STYLE} gl={GL_OPTIONS} camera={WATER_CAMERA} frameloop={frameloop} flat>
        <Water />
      </Canvas>
      <Canvas style={CANVAS_STYLE} gl={GL_OPTIONS} camera={SKY_CAMERA} frameloop={frameloop}>
        <Sky />
      </Canvas>
    </>
  );
}
