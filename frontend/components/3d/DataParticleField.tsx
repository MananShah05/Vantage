"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { MotionValueLike } from "./types";

const PARTICLE_COUNT = 800;

interface DataParticleFieldProps {
  scrollProgress: MotionValueLike;
}

/**
 * Act-I particle field. 800 points drift inward toward scene center as the
 * scroll progresses (0.05 → 0.17), shifting colour from dim white to sage,
 * then fade out once the stations take over. Uses a single BufferGeometry
 * with in-place attribute updates (no per-frame allocations).
 */
export default function DataParticleField({ scrollProgress }: DataParticleFieldProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const matRef = useRef<THREE.PointsMaterial>(null);

  const { positions, colors } = useMemo(() => {
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const colors = new Float32Array(PARTICLE_COUNT * 3);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const x = (Math.random() - 0.5) * 30;
      const y = Math.random() * 6;
      const z = (Math.random() - 0.5) * 30;
      positions[i * 3 + 0] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
      colors[i * 3 + 0] = 0.9;
      colors[i * 3 + 1] = 0.9;
      colors[i * 3 + 2] = 0.9;
    }
    return { positions, colors };
  }, []);

  useFrame((_, delta) => {
    const points = pointsRef.current;
    if (!points) return;

    const progress = scrollProgress.get();
    const converge = THREE.MathUtils.clamp((progress - 0.05) / 0.12, 0, 1);

    const posAttr = points.geometry.attributes.position as THREE.BufferAttribute;
    const colAttr = points.geometry.attributes.color as THREE.BufferAttribute;
    const pos = posAttr.array as Float32Array;
    const col = colAttr.array as Float32Array;

    const step = Math.min(delta, 0.05);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const ix = i * 3;
      pos[ix + 0] += (0 - pos[ix + 0]) * converge * step * 0.8;
      pos[ix + 1] += (1 - pos[ix + 1]) * converge * step * 0.6;
      pos[ix + 2] += (0 - pos[ix + 2]) * converge * step * 0.8;
      col[ix + 0] = THREE.MathUtils.lerp(0.9, 0.2, converge);
      col[ix + 1] = 0.9;
      col[ix + 2] = THREE.MathUtils.lerp(0.9, 0.62, converge);
    }
    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;

    // Fade the whole field out once stations appear.
    if (matRef.current) {
      const targetOpacity = progress > 0.2 ? Math.max(0, 1 - (progress - 0.2) / 0.1) : 1;
      matRef.current.opacity += (targetOpacity - matRef.current.opacity) * 0.1;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        ref={matRef}
        size={0.03}
        vertexColors
        transparent
        opacity={1}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}
