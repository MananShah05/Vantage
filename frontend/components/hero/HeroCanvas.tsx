"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { MotionValue } from "framer-motion";

import SceneCamera from "../3d/SceneCamera";
import FloorGrid from "../3d/FloorGrid";
import DataParticleField from "../3d/DataParticleField";
import PMCharacter from "../3d/PMCharacter";
import FeatureStation from "../3d/FeatureStation";
import { STATION_POSITIONS, ACCENT_HEX } from "../3d/sceneConfig";
import { cappedDpr } from "../../utils/device";

import LivePanel from "../stations/LivePanel";
import PeriodsPanel from "../stations/PeriodsPanel";
import ChartPanel from "../stations/ChartPanel";

interface HeroCanvasProps {
  scrollProgress: MotionValue<number>;
  act1: MotionValue<number>;
}

/** Sage point light that ramps up as Act II begins. */
function StageLight({ scrollProgress }: { scrollProgress: MotionValue<number> }) {
  const ref = useRef<THREE.PointLight>(null);
  useFrame(() => {
    if (!ref.current) return;
    const p = scrollProgress.get();
    const target = p > 0.18 ? 1.2 : 0;
    ref.current.intensity += (target - ref.current.intensity) * 0.05;
  });
  return <pointLight ref={ref} position={[0, 3, 0]} color={ACCENT_HEX} intensity={0} distance={20} />;
}

export default function HeroCanvas({ scrollProgress, act1 }: HeroCanvasProps) {
  const characterRef = useRef<THREE.Group>(null);

  return (
    <Canvas
      dpr={cappedDpr()}
      gl={{ antialias: true, alpha: false }}
      camera={{ fov: 55, position: [0, 4, 12], near: 0.1, far: 200 }}
      onCreated={({ scene }) => {
        scene.background = new THREE.Color("#0a0c12");
      }}
    >
      <fog attach="fog" args={["#0a0c12", 16, 52]} />

      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 8, 4]} intensity={0.6} color="#fff4e6" />
      <StageLight scrollProgress={scrollProgress} />

      <SceneCamera scrollProgress={scrollProgress} />
      <FloorGrid reveal={act1} />
      <DataParticleField scrollProgress={scrollProgress} />

      <PMCharacter ref={characterRef} scrollProgress={scrollProgress} />

      <FeatureStation
        position={STATION_POSITIONS.live}
        scrollRange={[0.2, 0.46]}
        glowRange={[0.3, 0.42]}
        scrollProgress={scrollProgress}
      >
        <LivePanel />
      </FeatureStation>

      <FeatureStation
        position={STATION_POSITIONS.periods}
        scrollRange={[0.44, 0.7]}
        glowRange={[0.5, 0.64]}
        scrollProgress={scrollProgress}
      >
        <PeriodsPanel />
      </FeatureStation>

      <FeatureStation
        position={STATION_POSITIONS.chart}
        scrollRange={[0.62, 0.86]}
        glowRange={[0.72, 0.82]}
        scrollProgress={scrollProgress}
      >
        <ChartPanel />
      </FeatureStation>
    </Canvas>
  );
}
