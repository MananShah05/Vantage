"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { MotionValueLike } from "./types";

interface FloorGridProps {
  /** 0→1 materialization driver (Act I) */
  reveal: MotionValueLike;
}

/**
 * Infinite-feeling floor grid that fades toward the edges. Opacity is driven
 * by Act-I scroll progress so it "materializes" as the scene emerges.
 */
export default function FloorGrid({ reveal }: FloorGridProps) {
  const gridRef = useRef<THREE.GridHelper>(null);

  useFrame(() => {
    if (!gridRef.current) return;
    const mat = gridRef.current.material;
    const target = 0.4 * Math.min(1, reveal.get());
    if (Array.isArray(mat)) {
      mat.forEach((m) => {
        m.transparent = true;
        m.opacity += (target - m.opacity) * 0.08;
      });
    } else {
      mat.transparent = true;
      mat.opacity += (target - mat.opacity) * 0.08;
    }
  });

  return (
    <gridHelper
      ref={gridRef}
      args={[80, 80, "#2a3340", "#1c2430"]}
      position={[0, -0.01, 0]}
    />
  );
}
