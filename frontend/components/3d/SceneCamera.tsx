"use client";

import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { MotionValueLike } from "./types";

interface SceneCameraProps {
  scrollProgress: MotionValueLike;
}

/**
 * Scroll-driven camera. Follows a Catmull-Rom spline of pre-choreographed
 * waypoints (one per beat in the timeline) and smoothly lerps toward the
 * point matching current scroll progress. Always looks at the active focus.
 */
export default function SceneCamera({ scrollProgress }: SceneCameraProps) {
  const { camera } = useThree();

  const pathRef = useRef(
    new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 4, 12), // Act I  — emergence
      new THREE.Vector3(-4, 3, 8), // Act II — walk to live
      new THREE.Vector3(-4, 2.8, 5), // Act II — explain live
      new THREE.Vector3(0, 3, 8), // Act III — periods
      new THREE.Vector3(5, 3, 8), // Act IV — walk to chart
      new THREE.Vector3(5, 2.8, 5), // Act IV — explain chart
      new THREE.Vector3(0, 5, 14), // Act V — wide establishing
      new THREE.Vector3(0, 2.2, 6), // Act V — execution / present
    ])
  );

  // Look-at targets matched to the same parametric range as the path.
  const lookPathRef = useRef(
    new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 1.5, 0),
      new THREE.Vector3(-4, 1.5, 0),
      new THREE.Vector3(-5, 2, 0),
      new THREE.Vector3(0, 2, -2),
      new THREE.Vector3(5, 2, 0),
      new THREE.Vector3(5, 2, 0),
      new THREE.Vector3(0, 1, -2),
      new THREE.Vector3(0, 1.6, 2),
    ])
  );

  const targetPos = useRef(new THREE.Vector3(0, 4, 12));
  const targetLook = useRef(new THREE.Vector3(0, 1.5, 0));
  const currentLook = useRef(new THREE.Vector3(0, 1.5, 0));

  useFrame(() => {
    const t = THREE.MathUtils.clamp(scrollProgress.get(), 0, 1);
    pathRef.current.getPointAt(t, targetPos.current);
    lookPathRef.current.getPointAt(t, targetLook.current);

    camera.position.lerp(targetPos.current, 0.05);
    currentLook.current.lerp(targetLook.current, 0.05);
    camera.lookAt(currentLook.current);
  });

  return null;
}
