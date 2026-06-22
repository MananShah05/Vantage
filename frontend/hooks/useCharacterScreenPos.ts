"use client";

import { useState, type RefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

export interface ScreenPos {
  x: number;
  y: number;
  visible: boolean;
}

/**
 * Projects a 3D object's world position (offset above its head) into 2D
 * screen coordinates so HTML narration bubbles can track the character.
 * Throttled to ~30fps to limit React re-renders (see perf checklist).
 */
export function useCharacterScreenPos(
  targetRef: RefObject<THREE.Object3D | null>,
  headOffset = 2.2
): ScreenPos {
  const { camera, size } = useThree();
  const [screenPos, setScreenPos] = useState<ScreenPos>({ x: 0, y: 0, visible: false });

  const world = new THREE.Vector3();
  let last = 0;

  useFrame((state) => {
    if (!targetRef.current) return;
    const now = state.clock.elapsedTime;
    if (now - last < 1 / 30) return; // throttle to 30fps
    last = now;

    targetRef.current.getWorldPosition(world);
    world.y += headOffset;
    const projected = world.clone().project(camera);

    setScreenPos({
      x: (projected.x * 0.5 + 0.5) * size.width,
      y: (-projected.y * 0.5 + 0.5) * size.height,
      visible: projected.z < 1,
    });
  });

  return screenPos;
}
