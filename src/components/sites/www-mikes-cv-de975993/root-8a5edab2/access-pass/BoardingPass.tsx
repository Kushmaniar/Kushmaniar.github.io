"use client";

import { useThree, type ThreeEvent } from "@react-three/fiber";
import { useFrame } from "@react-three/fiber";
import { CuboidCollider, RigidBody, type RapierRigidBody } from "@react-three/rapier";
import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import {
  BackSide,
  DoubleSide,
  Euler,
  FrontSide,
  MathUtils,
  PlaneGeometry,
  Quaternion,
  Vector3,
} from "three";
import { CARD_W, PASS_SCENE, pxPerUnit } from "../config";
import type { CardContact, ReaderStatus } from "../types";
import { createCardDepthMaterial, createCardMaterial } from "./cardMaterials";
import {
  CARD_CLEAR_X,
  CARD_H,
  CARD_RADIUS,
  CARD_T,
  READER_TILT,
  READER_W,
  SLOT_CARD_Y,
  slotDepth,
} from "./geometry";
import { playSound } from "./sounds";
import { usePassTextures } from "./textures";

const { hoverY, slotY, slotTol, traverseSpan, respawnMs, fadeInS } = PASS_SCENE;

/** Bend spring (stiffness / damping) that flexes the card as it accelerates. */
const BEND_K = 120;
const BEND_C = 13;
/** Minimum gap between two collision thuds, and the speed one needs. */
const HIT_GAP_MS = 90;
const HIT_SPEED = 0.5;
/** Minimum gap between two "wrong swipe" beeps. */
const ERROR_GAP_MS = 600;

type Mode = "hover" | "drag" | "fall" | "hidden";

interface Bend {
  curve: number;
  curveV: number;
  slant: number;
  slantV: number;
  y: number;
  vy: number;
  x: number;
  vx: number;
}

export interface BoardingPassProps {
  status: ReaderStatus;
  /** Fired once when the card has been swiped fully through the slot. */
  onSwiped: () => void;
  /** Fired every drag frame with whether the card is in the slot row. */
  onZone: (inZone: boolean) => void;
  /** Fired when the card leaves the slot mid-swipe. */
  onError: () => void;
  /** Written every frame; read by the reader's contact shadow. */
  contact: RefObject<CardContact>;
}

export function BoardingPass({ status, onSwiped, onZone, onError, contact }: BoardingPassProps) {
  const body = useRef<RapierRigidBody>(null);
  const [mode, setMode] = useState<Mode>("hover");
  const [hovered, setHovered] = useState(false);

  const grab = useRef(new Vector3());
  const span = useRef<{ min: number; max: number } | null>(null);
  const roll = useRef(0);
  const tilt = useRef(0);
  const depth = useRef(0);
  const lastX = useRef(0);
  const lastY = useRef<number>(hoverY);
  const wasInSlot = useRef(false);
  const lastHitSound = useRef(0);
  const lastErrorAt = useRef(0);
  const swiped = useRef(false);
  const restTime = useRef(0);
  const opacity = useRef(1);
  const respawnTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const bend = useRef<Bend>({
    curve: 0,
    curveV: 0,
    slant: 0,
    slantV: 0,
    y: hoverY,
    vy: 0,
    x: 0,
    vx: 0,
  });

  const scratch = useMemo(() => new Vector3(), []);
  const dir = useMemo(() => new Vector3(), []);
  const quat = useMemo(() => new Quaternion(), []);
  const euler = useMemo(() => new Euler(), []);

  const size = useThree((s) => s.size);
  const ppu = pxPerUnit(size.width, size.height);
  const viewW = size.width / ppu;
  const viewH = size.height / ppu;

  const tex = usePassTextures();
  const geo = useMemo(() => new PlaneGeometry(CARD_W, CARD_H, 90, 18), []);
  const uniforms = useMemo(
    () => ({
      uCurve: { value: 0 },
      uSlant: { value: 0 },
      uHalfW: { value: CARD_W / 2 },
      uHalfH: { value: CARD_H / 2 },
      uRadius: { value: CARD_RADIUS },
    }),
    [],
  );

  const front = useMemo(
    () =>
      createCardMaterial(
        {
          map: tex.front,
          roughness: 1,
          metalness: 0,
          envMapIntensity: 0.18,
          side: FrontSide,
          shadowSide: DoubleSide,
        },
        uniforms,
      ),
    [tex.front, uniforms],
  );
  const back = useMemo(
    () =>
      createCardMaterial(
        { map: tex.back, roughness: 1, metalness: 0, envMapIntensity: 0.18, side: BackSide },
        uniforms,
      ),
    [tex.back, uniforms],
  );
  const depthMaterial = useMemo(() => createCardDepthMaterial(uniforms), [uniforms]);

  useEffect(() => {
    if (!hovered) return;
    document.body.style.cursor = mode === "drag" ? "grabbing" : "grab";
    return () => {
      document.body.style.cursor = "auto";
    };
  }, [hovered, mode]);

  useEffect(() => () => clearTimeout(respawnTimer.current), []);

  const setOpacity = (value: number) => {
    opacity.current = value;
    front.opacity = value;
    back.opacity = value;
  };

  /** Drop the card out of sight, then float it back above the reader. */
  const respawn = () => {
    restTime.current = 0;
    setOpacity(0);
    setMode("hidden");
    respawnTimer.current = setTimeout(() => {
      const rb = body.current;
      if (!rb) return;
      rb.setTranslation({ x: 0, y: hoverY, z: 0 }, true);
      rb.setRotation({ x: 0, y: 0, z: 0, w: 1 }, true);
      rb.setLinvel({ x: 0, y: 0, z: 0 }, true);
      rb.setAngvel({ x: 0, y: 0, z: 0 }, true);
      setMode("hover");
    }, respawnMs);
  };

  /** Keeps the card clear of the reader body unless it is entering the slot. */
  const clampToSlot = (x: number, y: number) => {
    let inSlot = false;
    if (Math.abs(x) < CARD_CLEAR_X && y < SLOT_CARD_Y) {
      if (lastY.current >= SLOT_CARD_Y - 0.12) {
        y = SLOT_CARD_Y;
        inSlot = true;
      } else {
        x = (x >= 0 ? 1 : -1) * Math.max(Math.abs(x), CARD_CLEAR_X);
      }
    }
    return { x, y, inSlot };
  };

  const inSlotRow = (y: number) => Math.abs(y - CARD_H / 2 - slotY) < slotTol;

  useFrame((state, delta) => {
    const rb = body.current;
    if (!rb) return;
    const p = rb.translation();

    // Feed the reader's contact shadow.
    contact.current.x = p.x;
    contact.current.lift = MathUtils.clamp((p.y - CARD_H / 2 - slotY) / 1.7, 0, 1);
    contact.current.fade = opacity.current;

    // Flex the card from its own acceleration.
    const b = bend.current;
    const dt = Math.min(delta, 0.05) || 0.016;
    const vy = (p.y - b.y) / dt;
    const ay = (vy - b.vy) / dt;
    b.y = p.y;
    b.vy = vy;
    const vx = (p.x - b.x) / dt;
    const ax = (vx - b.vx) / dt;
    b.x = p.x;
    b.vx = vx;

    const curveTarget = 0.16 + MathUtils.clamp(ay * 0.024, -0.6, 0.6);
    const slantTarget = MathUtils.clamp(-ax * 0.024, -0.5, 0.5);
    b.curveV += ((curveTarget - b.curve) * BEND_K - b.curveV * BEND_C) * dt;
    b.curve += b.curveV * dt;
    b.slantV += ((slantTarget - b.slant) * BEND_K - b.slantV * BEND_C) * dt;
    b.slant += b.slantV * dt;

    const fade = MathUtils.smoothstep(p.y, 0.25, 0.6);
    uniforms.uCurve.value = b.curve * fade;
    uniforms.uSlant.value = b.slant * fade;

    if (opacity.current < 1 && mode === "hover") {
      setOpacity(Math.min(1, opacity.current + delta / fadeInS));
    }

    if (mode === "hover") {
      const t = state.clock.elapsedTime;
      rb.setNextKinematicTranslation({
        x: Math.sin(t * 0.5) * 0.05,
        y: hoverY + Math.sin(t * 1.2) * 0.1,
        z: 0,
      });
      euler.set(Math.sin(t * 0.7) * 0.09, Math.sin(t * 0.4) * 0.06, Math.sin(t * 0.9) * 0.08);
      rb.setNextKinematicRotation(quat.setFromEuler(euler));
      return;
    }

    if (mode === "drag") {
      // Pointer ray onto the card's plane.
      scratch.set(state.pointer.x, state.pointer.y, 0.5).unproject(state.camera);
      dir.copy(scratch).sub(state.camera.position).normalize();
      scratch.add(dir.multiplyScalar(state.camera.position.length()));

      const c = Math.cos(roll.current);
      const s = Math.sin(roll.current);
      const raw = clampToSlot(
        scratch.x - (grab.current.x * c - grab.current.y * s),
        scratch.y - (grab.current.x * s + grab.current.y * c),
      );
      const { inSlot } = raw;
      const x = raw.x;
      const y = raw.y;
      lastY.current = y;

      const dx = x - lastX.current;
      lastX.current = x;

      let targetRoll: number;
      let sink = 0;
      if (inSlot) {
        const over = Math.abs(x) - READER_W / 2;
        if (over > 0) {
          targetRoll = -Math.sign(x) * Math.min(over * 0.9, 0.85);
          sink = over * 0.36;
        } else {
          targetRoll = 0;
        }
      } else {
        targetRoll =
          MathUtils.clamp(grab.current.x * 0.28, -0.35, 0.35) + MathUtils.clamp(-dx * 4, -0.3, 0.3);
      }

      if (inSlot && !wasInSlot.current) playSound("press");
      wasInSlot.current = inSlot;

      roll.current += (targetRoll - roll.current) * Math.min(1, delta * (inSlot ? 8 : 4.5));
      tilt.current += ((inSlot ? READER_TILT : 0) - tilt.current) * Math.min(1, delta * 10);
      depth.current += ((inSlot ? slotDepth(y) : 0) - depth.current) * Math.min(1, delta * 12);

      rb.setNextKinematicTranslation({ x, y: y - sink, z: depth.current });
      euler.set(tilt.current, 0, roll.current);
      rb.setNextKinematicRotation(quat.setFromEuler(euler));

      if (status !== "granted") {
        const zone = inSlotRow(y);
        onZone(zone);
        if (zone) {
          const reach = (span.current ??= { min: x, max: x });
          reach.min = Math.min(reach.min, x);
          reach.max = Math.max(reach.max, x);
          if (reach.max - reach.min > traverseSpan && !swiped.current) {
            swiped.current = true;
            onSwiped();
          }
        } else {
          const now = performance.now();
          if (span.current && !swiped.current && now - lastErrorAt.current > ERROR_GAP_MS) {
            lastErrorAt.current = now;
            playSound("error");
            onError();
          }
          span.current = null;
        }
      }
      return;
    }

    if (mode === "fall") {
      const floor = -viewH / 2 - CARD_W;
      const v = rb.linvel();
      const still = Math.abs(v.x) + Math.abs(v.y) + Math.abs(v.z) < 0.25;
      restTime.current = still ? restTime.current + delta : 0;
      const restingInSlot =
        Math.abs(p.x) < READER_W / 2 + 0.1 && Math.abs(p.y - CARD_H / 2 - slotY) < 0.35;
      if (p.y < floor || (restTime.current > 1.2 && !restingInSlot)) respawn();
    }
  });

  const onPointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    const rb = body.current;
    if (!rb) return;
    try {
      (e.target as Element | null)?.setPointerCapture(e.pointerId);
    } catch {
      // No capture: dragging still tracks the pointer.
    }
    clearTimeout(respawnTimer.current);
    const t = rb.translation();
    grab.current.copy(e.point).sub(scratch.set(t.x, t.y, t.z));
    lastX.current = t.x;
    lastY.current = t.y;
    span.current = inSlotRow(t.y) ? { min: t.x, max: t.x } : null;
    restTime.current = 0;
    setMode("drag");
  };

  const onPointerUp = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    const rb = body.current;
    if (!rb) return;
    try {
      (e.target as Element | null)?.releasePointerCapture(e.pointerId);
    } catch {
      // Capture already released.
    }

    let x: number;
    let y: number;
    if (e.pointer) {
      const c = Math.cos(roll.current);
      const s = Math.sin(roll.current);
      const settled = clampToSlot(
        (e.pointer.x * viewW) / 2 - (grab.current.x * c - grab.current.y * s),
        (e.pointer.y * viewH) / 2 - (grab.current.x * s + grab.current.y * c),
      );
      x = settled.x;
      y = settled.y;
      rb.setTranslation({ x, y, z: inSlotRow(y) ? slotDepth(y) : depth.current }, true);
    } else {
      const t = rb.translation();
      x = t.x;
      y = t.y;
    }

    const inZone = inSlotRow(y);
    if (
      !swiped.current &&
      span.current &&
      inZone &&
      Math.max(span.current.max, x) - Math.min(span.current.min, x) > traverseSpan
    ) {
      swiped.current = true;
      onSwiped();
    }
    span.current = null;
    onZone(false);
    setMode("fall");

    if (inZone) {
      // Left resting in the slot rather than tumbling away.
      rb.setLinvel({ x: 0, y: 0, z: 0 }, true);
      rb.setAngvel({ x: 0, y: 0, z: 0 }, true);
      euler.set(READER_TILT, 0, 0);
      rb.setRotation(quat.setFromEuler(euler), true);
      playSound("press");
    } else {
      rb.setAngvel({ x: 0.9, y: 0.5, z: (Math.random() - 0.5) * 1.4 }, true);
      rb.setLinvel({ x: -roll.current * 1.6, y: 0.3, z: 0 }, true);
    }
    wasInSlot.current = false;
  };

  const onCollisionEnter = () => {
    const rb = body.current;
    if (!rb) return;
    const now = performance.now();
    if (now - lastHitSound.current < HIT_GAP_MS || mode === "hidden") return;
    const v = rb.linvel();
    if (Math.hypot(v.x, v.y, v.z) < HIT_SPEED) return;
    lastHitSound.current = now;
    playSound("press");
  };

  return (
    <RigidBody
      ref={body}
      position={[0, hoverY, 0]}
      type={mode === "fall" || mode === "hidden" ? "dynamic" : "kinematicPosition"}
      colliders={false}
      ccd
      gravityScale={0.8}
      angularDamping={1.2}
      linearDamping={1.1}
      onCollisionEnter={onCollisionEnter}
    >
      <CuboidCollider
        args={[CARD_W / 2, CARD_H / 2, CARD_T / 2]}
        restitution={0.22}
        friction={0.35}
      />
      <group
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
      >
        <mesh
          geometry={geo}
          material={front}
          position={[0, 0, CARD_T / 2]}
          renderOrder={-2}
          castShadow={mode !== "hidden"}
          customDepthMaterial={depthMaterial}
        />
        <mesh geometry={geo} material={back} position={[0, 0, -CARD_T / 2]} renderOrder={-2} />
      </group>
    </RigidBody>
  );
}
