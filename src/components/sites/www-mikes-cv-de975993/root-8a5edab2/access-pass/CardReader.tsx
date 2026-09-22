"use client";

import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { CuboidCollider, RigidBody } from "@react-three/rapier";
import { useMemo, useRef, type RefObject } from "react";
import type { ShaderMaterial } from "three";
import { CARD_W, PASS_SCENE } from "../config";
import type { CardContact, ReaderStatus } from "../types";
import { READER_H, READER_TILT, READER_W } from "./geometry";
import { useBrushedTexture, useGrainTexture, useLcdTextures } from "./textures";

// Slot lips and collider walls
const LIP = 0.045;
const FRONT_Z = 0.35;
const BACK_D = FRONT_Z - LIP;
const EDGE = 0.012;
const COL_D = FRONT_Z - EDGE;
const COL_Z = (EDGE + FRONT_Z) / 2;

// Slot cavity
const SLOT_W = 0.12;
const GAP = 0.03;
const SLOT_DEPTH = 2 * LIP + SLOT_W + 2 * GAP;
const SLOT_Z = -SLOT_W / 2;

// Front shell and trim panels
const BODY_Y = 0.01;
const FACE_D0 = 0.3;
const FACE_D = FACE_D0 - LIP;
const FACE_Z = (LIP + FACE_D0) / 2;
const PANEL_D = 0.1;
const PANEL_Z = FRONT_Z - PANEL_D / 2;
const HALF_IN = READER_W / 2 - 0.13;
const TOP = BODY_Y + READER_H / 2;
const TRIM_Z0 = 0.332;
const TRIM_D = 0.09;
const TRIM_Z = TRIM_Z0 - TRIM_D / 2;
const TRIM_TOP = TOP - 0.002;
const BAND_TOP = 0.345;
const BAND_BOT = 0.13;
const SIDE_TOP = 0.1;
const SIDE_IN = 0.78;
const SIDE_BOT = -0.4;

// Contact shadow strip along the top of the front lip
const SHADOW_Z0 = 0.05;
const SHADOW_D = 0.3;
const SHADOW_Z = SHADOW_Z0 + SHADOW_D / 2;
const SHADOW_W = READER_W - 0.04;

const VENT_COUNT = 12;
const SIDES = [-1, 1] as const;

const LED_COLOR: Record<ReaderStatus, string> = {
  granted: "#1e9e52",
  near: "#d9a013",
  error: "#e0483a",
  idle: "#b3aea1",
};

const SHADOW_VERT = /* glsl */ `
varying vec2 vP;
void main() {
  vP = position.xy;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const SHADOW_FRAG = /* glsl */ `
varying vec2 vP;
uniform float uX; uniform float uLift; uniform float uFade; uniform float uHalfW;
void main() {
  float blur = mix(0.05, 0.62, uLift);
  float dz = ${SHADOW_Z.toFixed(3)} - vP.y;
  float ax = 1.0 - smoothstep(uHalfW - blur, uHalfW + blur, abs(vP.x - uX));
  float az = exp(-dz / (blur * 0.55 + 0.05));
  float edge = 1.0 - smoothstep(${(SHADOW_W / 2 - 0.07).toFixed(3)}, ${(SHADOW_W / 2).toFixed(3)}, abs(vP.x));
  float a = ax * az * edge * mix(0.46, 0.07, uLift) * uFade;
  gl_FragColor = vec4(0.13, 0.115, 0.08, a);
}
`;

/** Soft shadow the boarding pass casts on the reader's top as it slides through. */
function ContactShadow({ contact }: { contact: RefObject<CardContact> }) {
  const material = useRef<ShaderMaterial>(null);
  const uniforms = useMemo(
    () => ({
      uX: { value: 0 },
      uLift: { value: 1 },
      uFade: { value: 0 },
      uHalfW: { value: CARD_W / 2 },
    }),
    [],
  );

  useFrame(() => {
    const m = material.current;
    if (!m) return;
    const { x, lift, fade } = contact.current;
    m.uniforms.uX.value = x;
    m.uniforms.uLift.value = lift;
    m.uniforms.uFade.value = fade;
  });

  return (
    <mesh position={[0, TOP + 0.004, SHADOW_Z]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={2}>
      <planeGeometry args={[SHADOW_W, SHADOW_D]} />
      <shaderMaterial
        ref={material}
        uniforms={uniforms}
        vertexShader={SHADOW_VERT}
        fragmentShader={SHADOW_FRAG}
        transparent
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  );
}

export function CardReader({
  status,
  contact,
}: {
  status: ReaderStatus;
  contact: RefObject<CardContact>;
}) {
  const grainLight = useGrainTexture("#e8ddc6", 900);
  const grainDark = useGrainTexture("#d7cbaf", 700);
  const brushed = useBrushedTexture(3.4, 0.68);
  const lcd = useLcdTextures();

  const trim = useMemo(
    () => ({
      map: grainLight,
      bumpMap: brushed,
      bumpScale: 0.5,
      roughnessMap: brushed,
      roughness: 1,
      metalness: 0.02,
      envMapIntensity: 0.45,
    }),
    [grainLight, brushed],
  );
  const shell = useMemo(
    () => ({
      map: grainDark,
      bumpMap: brushed,
      bumpScale: 0.4,
      roughnessMap: brushed,
      roughness: 1,
      metalness: 0.02,
      envMapIntensity: 0.45,
    }),
    [grainDark, brushed],
  );

  const led = LED_COLOR[status];
  const lit = status !== "idle";

  return (
    <RigidBody
      type="fixed"
      position={[0, PASS_SCENE.readerY, 0]}
      rotation={[READER_TILT, 0, 0]}
      colliders={false}
    >
      {/* Slot walls */}
      <CuboidCollider
        args={[READER_W / 2, READER_H / 2, COL_D / 2]}
        position={[0, BODY_Y, COL_Z]}
        restitution={0.15}
        friction={0.4}
      />
      <CuboidCollider
        args={[READER_W / 2, READER_H / 2, COL_D / 2]}
        position={[0, BODY_Y, -COL_Z]}
        restitution={0.15}
        friction={0.4}
      />

      <ContactShadow contact={contact} />

      {/* Front and back shells */}
      <RoundedBox
        args={[READER_W, READER_H, FACE_D]}
        radius={0.07}
        smoothness={6}
        position={[0, BODY_Y, FACE_Z]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial {...shell} />
      </RoundedBox>
      <RoundedBox
        args={[READER_W, READER_H, BACK_D]}
        radius={0.08}
        smoothness={6}
        position={[0, BODY_Y, -0.1975 - SLOT_W]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial {...shell} />
      </RoundedBox>

      {/* Top trim, front band and side panels */}
      <RoundedBox
        args={[HALF_IN * 2, TRIM_TOP - BAND_TOP, TRIM_D]}
        radius={0.02}
        smoothness={5}
        position={[0, (TRIM_TOP + BAND_TOP) / 2, TRIM_Z]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial {...trim} />
      </RoundedBox>
      <RoundedBox
        args={[HALF_IN * 2, BAND_TOP - BAND_BOT, PANEL_D]}
        radius={0.022}
        smoothness={5}
        position={[0, (BAND_TOP + BAND_BOT) / 2, PANEL_Z]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial {...trim} />
      </RoundedBox>
      {SIDES.map((w) => (
        <RoundedBox
          key={w}
          args={[HALF_IN - SIDE_IN, SIDE_TOP - SIDE_BOT, PANEL_D]}
          radius={0.022}
          smoothness={5}
          position={[(w * (HALF_IN + SIDE_IN)) / 2, (SIDE_TOP + SIDE_BOT) / 2, PANEL_Z]}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial {...trim} />
        </RoundedBox>
      ))}

      {/* Vents */}
      {SIDES.map((w) => (
        <group key={w}>
          {Array.from({ length: VENT_COUNT }, (_, k) => (
            <mesh key={k} position={[w * (0.72 + k * 0.056), TOP - 0.013, 0.195]}>
              <boxGeometry args={[0.018, 0.03, 0.185]} />
              <meshStandardMaterial color="#5b5341" roughness={0.9} />
            </mesh>
          ))}
          <mesh position={[w * HALF_IN, TOP - 0.006, 0.175]}>
            <boxGeometry args={[0.014, 0.02, 0.25]} />
            <meshStandardMaterial color="#8c8267" roughness={0.9} />
          </mesh>
        </group>
      ))}

      {/* Slot floor and dark interior */}
      <CuboidCollider
        args={[READER_W / 2, 0.3, 0.35]}
        position={[0, -0.15, 0]}
        restitution={0.05}
        friction={0.9}
      />
      <mesh position={[0, -0.15, SLOT_Z]}>
        <boxGeometry args={[READER_W - 0.06, 0.6, SLOT_DEPTH]} />
        <meshStandardMaterial color="#1c1b19" roughness={0.7} />
      </mesh>

      {/* LCD bezel and screen */}
      <RoundedBox args={[1.46, 0.44, 0.1]} radius={0.03} smoothness={4} position={[0, -0.14, 0.265]}>
        <meshStandardMaterial color="#232322" roughness={0.5} metalness={0.1} />
      </RoundedBox>
      <mesh position={[0, -0.14, 0.318]}>
        <planeGeometry args={[1.32, 0.33]} />
        <meshBasicMaterial map={lcd[status] ?? lcd.idle} toneMapped={false} />
      </mesh>

      {/* Status LED */}
      <group position={[1.35, -0.14, FRONT_Z]}>
        <mesh position={[0, 0, 0.002]}>
          <circleGeometry args={[0.066, 32]} />
          <meshStandardMaterial color="#141412" roughness={0.5} metalness={0.2} />
        </mesh>
        <mesh position={[0, 0, 0.018]}>
          <torusGeometry args={[0.052, 0.012, 12, 32]} />
          <meshStandardMaterial color="#4a4a46" roughness={0.35} metalness={0.65} />
        </mesh>
        <mesh position={[0, 0, 0.018]} scale={[1, 1, 0.32]}>
          <sphereGeometry args={[0.038, 24, 24]} />
          <meshPhysicalMaterial
            color={led}
            emissive={led}
            emissiveIntensity={lit ? 2.6 : 0.2}
            roughness={0.12}
            metalness={0}
            clearcoat={1}
            clearcoatRoughness={0.04}
            toneMapped={false}
          />
        </mesh>
        {lit && (
          <>
            <mesh position={[0, 0, 0.038]}>
              <circleGeometry args={[0.11, 28]} />
              <meshBasicMaterial
                color={led}
                transparent
                opacity={0.16}
                depthWrite={false}
                toneMapped={false}
              />
            </mesh>
            <pointLight color={led} intensity={0.5} distance={0.7} decay={2} position={[0, 0, 0.08]} />
          </>
        )}
      </group>
    </RigidBody>
  );
}
