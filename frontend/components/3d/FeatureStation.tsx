"use client";

import { useRef, type ReactNode } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import type { MotionValueLike } from "./types";
import { ACCENT_HEX } from "./sceneConfig";

interface FeatureStationProps {
  position: [number, number, number];
  /** [enter, exit] scroll fraction where the panel is visible */
  scrollRange: [number, number];
  /** [enter, exit] scroll fraction where the panel glows (active explain beat) */
  glowRange: [number, number];
  scrollProgress: MotionValueLike;
  children: ReactNode;
}

/**
 * A feature station: a glowing floor ring + a base plate + a floating HTML
 * data panel. Visibility and glow are toggled by scroll range using direct
 * DOM/material mutation in useFrame (no React re-renders on scroll).
 */
export default function FeatureStation({
  position,
  scrollRange,
  glowRange,
  scrollProgress,
  children,
}: FeatureStationProps) {
  const panelWrap = useRef<HTMLDivElement>(null);
  const ringMat = useRef<THREE.MeshBasicMaterial>(null);
  const baseMat = useRef<THREE.MeshStandardMaterial>(null);
  const wasVisible = useRef(false);
  const wasGlowing = useRef(false);

  useFrame(() => {
    const p = scrollProgress.get();
    const visible = p >= scrollRange[0] && p <= scrollRange[1];
    const glowing = p >= glowRange[0] && p <= glowRange[1];

    const wrap = panelWrap.current;
    if (wrap) {
      if (visible !== wasVisible.current) {
        wrap.classList.toggle("visible", visible);
        wasVisible.current = visible;
      }
      if (glowing !== wasGlowing.current) {
        wrap.classList.toggle("glow", glowing);
        wasGlowing.current = glowing;
      }
    }

    if (ringMat.current) {
      const target = visible ? (glowing ? 0.9 : 0.35) : 0;
      ringMat.current.opacity += (target - ringMat.current.opacity) * 0.1;
    }
    if (baseMat.current) {
      const target = visible ? 0.6 : 0;
      baseMat.current.opacity += (target - baseMat.current.opacity) * 0.1;
    }
  });

  return (
    <group position={position}>
      {/* Floor glow ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[0.9, 1.05, 48]} />
        <meshBasicMaterial
          ref={ringMat}
          color={ACCENT_HEX}
          transparent
          opacity={0}
          toneMapped={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Base plate */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[0.9, 48]} />
        <meshStandardMaterial
          ref={baseMat}
          color="#1c2230"
          transparent
          opacity={0}
          roughness={0.8}
          metalness={0.2}
        />
      </mesh>

      {/* Floating data panel */}
      <Html
        position={[0, 2.5, 0]}
        center
        transform
        distanceFactor={6}
        pointerEvents="none"
        zIndexRange={[5, 0]}
      >
        <div ref={panelWrap} className="station-panel">
          {children}
        </div>
      </Html>
    </group>
  );
}
