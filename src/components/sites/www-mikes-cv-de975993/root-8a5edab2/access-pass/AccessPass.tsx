"use client";

import { Environment, Lightformer } from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { Physics } from "@react-three/rapier";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type Ref } from "react";
import { MathUtils, type RectAreaLight } from "three";
import { RectAreaLightUniformsLib } from "three/examples/jsm/lights/RectAreaLightUniformsLib.js";
import { PASS_BG, PASS_SCENE, pxPerUnit } from "../config";
import type { CardContact, ReaderStatus } from "../types";
import { BoardingPass } from "./BoardingPass";
import { CardReader } from "./CardReader";
import { READER_H } from "./geometry";
import { playSound } from "./sounds";

// Area lights need their LTC lookup tables before any standard material compiles.
RectAreaLightUniformsLib.init();

/** How long "Access granted" holds before the folio takes over. */
const GRANTED_HOLD_MS = 1000;
/** How long the reader shows ERROR before returning to READY. */
const ERROR_HOLD_MS = 1800;

/**
 * Fits the scene to the viewport at a clamped pixels-per-unit scale and
 * publishes where the reader's bottom edge lands (the hint sits under it).
 */
function CameraFit() {
  const get = useThree((s) => s.get);
  const size = useThree((s) => s.size);

  useLayoutEffect(() => {
    const { camera } = get();
    const ppu = pxPerUnit(size.width, size.height);
    const viewH = size.height / ppu;
    const camY = -25 / ppu;
    camera.position.set(0, camY, viewH / (2 * Math.tan(MathUtils.degToRad(12.5))));
    camera.updateProjectionMatrix();
    const readerBottom = PASS_SCENE.readerY - READER_H / 2;
    const px = size.height / 2 - (readerBottom - camY) * ppu;
    document.documentElement.style.setProperty("--reader-bottom-px", `${px}px`);
  }, [get, size]);

  return null;
}

function KeyLight() {
  const light = useRef<RectAreaLight>(null);
  useLayoutEffect(() => {
    light.current?.lookAt(0, -0.4, 0);
  }, []);
  return (
    <rectAreaLight
      ref={light}
      position={[0, 4.2, 3]}
      width={7}
      height={4}
      intensity={1.7}
      color="#fffdf7"
    />
  );
}

export interface AccessPassProps {
  ref?: Ref<HTMLDivElement>;
  onGranted: () => void;
  onSkip: () => void;
}

export default function AccessPass({ ref, onGranted, onSkip }: AccessPassProps) {
  const [status, setStatus] = useState<ReaderStatus>("idle");
  const contact = useRef<CardContact>({ x: 0, lift: 1, fade: 0 });
  const granted = useRef(false);
  const errorTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(errorTimer.current), []);

  const onSwiped = useCallback(() => {
    if (granted.current) return;
    granted.current = true;
    clearTimeout(errorTimer.current);
    setStatus("granted");
    playSound("sparkle");
    setTimeout(onGranted, GRANTED_HOLD_MS);
  }, [onGranted]);

  const onZone = useCallback((inZone: boolean) => {
    setStatus((s) => (s === "granted" ? s : inZone ? "near" : s === "error" ? s : "idle"));
  }, []);

  const onError = useCallback(() => {
    setStatus((s) => (s === "granted" ? s : "error"));
    clearTimeout(errorTimer.current);
    errorTimer.current = setTimeout(
      () => setStatus((s) => (s === "error" ? "idle" : s)),
      ERROR_HOLD_MS,
    );
  }, []);

  const isGranted = status === "granted";

  return (
    <div ref={ref} className="fixed inset-0 z-10 bg-[#faf5f5]">
      <div className="absolute inset-0 [&_canvas]:touch-none">
        <Canvas
          shadows="soft"
          dpr={[1, 1.5]}
          camera={{ position: [0, 0, 13], fov: 25 }}
          gl={{ alpha: true, antialias: false, powerPreference: "high-performance" }}
        >
          <CameraFit />
          <ambientLight intensity={0.72} />
          <directionalLight
            position={[4, 6, 6]}
            intensity={1.55}
            castShadow
            shadow-mapSize={[1024, 1024]}
            shadow-bias={-1e-4}
            shadow-normalBias={0.045}
            shadow-camera-near={0.5}
            shadow-camera-far={20}
            shadow-camera-left={-3.4}
            shadow-camera-right={3.4}
            shadow-camera-top={3.4}
            shadow-camera-bottom={-3.4}
          />
          <KeyLight />
          <Physics gravity={[0, -18, 0]} timeStep={1 / 60}>
            <BoardingPass
              status={status}
              onSwiped={onSwiped}
              onZone={onZone}
              onError={onError}
              contact={contact}
            />
            <CardReader status={status} contact={contact} />
          </Physics>
          <color attach="background" args={[PASS_BG]} />
          <EffectComposer multisampling={4}>
            <Bloom intensity={0.15} luminanceThreshold={1} luminanceSmoothing={0.05} mipmapBlur />
          </EffectComposer>
          <Environment resolution={128}>
            <group rotation={[-Math.PI / 3, 0, 1]}>
              <Lightformer intensity={1.4} position={[0, 3, 6]} scale={[8, 3, 1]} />
              <Lightformer
                intensity={1}
                position={[-6, 0, 4]}
                rotation={[0, Math.PI / 6, 0]}
                scale={[6, 3, 1]}
              />
              <Lightformer
                intensity={1}
                position={[6, 2, 4]}
                rotation={[0, -Math.PI / 6, 0]}
                scale={[6, 3, 1]}
              />
            </group>
          </Environment>
        </Canvas>
      </div>
      <p
        className={`pointer-events-none absolute top-[calc(var(--reader-bottom-px,50%)_+_40px)] left-1/2 -translate-x-1/2 text-center font-folio-sans text-[0.85rem] font-medium tracking-[-0.006em] whitespace-nowrap opacity-85 min-[481px]:text-[0.95rem] min-[769px]:text-[1.05rem] [@media(max-height:500px)]:top-[calc(var(--reader-bottom-px,50%)_+_14px)] [@media(max-height:500px)]:text-[0.85rem] ${
          isGranted
            ? "text-ink-hint"
            : "animate-[hint-shimmer_2.2s_linear_infinite] bg-[linear-gradient(90deg,var(--ink-hint)_0%,var(--ink-hint)_42%,var(--folio-ink)_50%,var(--ink-hint)_58%,var(--ink-hint)_100%)] bg-size-[250%_100%] bg-clip-text text-transparent"
        }`}
        aria-hidden="true"
      >
        {isGranted ? "Access granted" : "Swipe boarding pass to enter"}
      </p>
      <button
        type="button"
        className="absolute right-10 bottom-10 cursor-pointer border-none bg-none p-0 font-folio-sans text-[0.8rem] font-medium tracking-[-0.015em] whitespace-nowrap text-ink-faint no-underline hover:text-ink-faint-hover min-[481px]:text-[0.85rem] min-[769px]:text-[0.95rem]"
        onClick={onSkip}
      >
        Skip
      </button>
      <div
        className={`pointer-events-none absolute inset-0 bg-folio-bg transition-opacity duration-700 ease-[ease] ${
          isGranted ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
}
