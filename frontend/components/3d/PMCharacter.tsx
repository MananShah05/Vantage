"use client";

import { forwardRef, useImperativeHandle, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { MotionValueLike } from "./types";
import {
  POSES,
  poseForProgress,
  characterPositionForProgress,
  type Pose,
} from "../../hooks/usePMPose";
import { STATION_PANEL_POS, ACCENT_HEX, BODY_HEX } from "./sceneConfig";

interface PMCharacterProps {
  scrollProgress: MotionValueLike;
}

const LERP = 0.06; // pose follow damping per frame

/**
 * Stylized low-poly portfolio-manager. Built from nested groups acting as a
 * lightweight skeleton (no GLTF rig). Walk is procedural (sine on hips/legs),
 * poses are bone-rotation lerps driven by scroll. A dashed pointer ray
 * extends from the right wrist to whichever station the active pose targets.
 */
const PMCharacter = forwardRef<THREE.Group, PMCharacterProps>(function PMCharacter(
  { scrollProgress },
  ref
) {
  const root = useRef<THREE.Group>(null);
  const torso = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const leftArm = useRef<THREE.Group>(null);
  const rightArm = useRef<THREE.Group>(null);
  const leftElbow = useRef<THREE.Group>(null);
  const rightElbow = useRef<THREE.Group>(null);
  const leftLeg = useRef<THREE.Group>(null);
  const rightLeg = useRef<THREE.Group>(null);
  const rightWrist = useRef<THREE.Object3D>(null);

  // Pointer ray built imperatively (avoids the <line> JSX/SVG type clash).
  const ray = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    geom.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array([0, 1.5, 0, 0, 2.5, 1]), 3)
    );
    const mat = new THREE.LineDashedMaterial({
      color: ACCENT_HEX,
      dashSize: 0.15,
      gapSize: 0.08,
      transparent: true,
      opacity: 0,
      toneMapped: false,
    });
    const line = new THREE.Line(geom, mat);
    line.computeLineDistances();
    line.visible = false;
    return line;
  }, []);

  // Scratch vectors reused every frame (no allocations in the loop).
  const wristWorld = useRef(new THREE.Vector3());
  const rootLocal = useRef(new THREE.Vector3());
  const targetLocal = useRef(new THREE.Vector3());

  useImperativeHandle(ref, () => root.current as THREE.Group);

  useFrame((state) => {
    const r = root.current;
    if (!r) return;

    const p = THREE.MathUtils.clamp(scrollProgress.get(), 0, 1);
    const pose: Pose = POSES[poseForProgress(p)];
    const time = state.clock.elapsedTime;

    // ── Materialize (Act I): scale 0 → 1 over first 6% ──────────────────────
    const targetScale = THREE.MathUtils.clamp(p / 0.06, 0, 1);
    r.scale.setScalar(r.scale.x + (targetScale - r.scale.x) * 0.1);

    // ── Position: walk between stations ─────────────────────────────────────
    const [px, py, pz] = characterPositionForProgress(p);
    r.position.x += (px - r.position.x) * 0.05;
    r.position.y += (py - r.position.y) * 0.05;
    r.position.z += (pz - r.position.z) * 0.05;

    // ── Facing ──────────────────────────────────────────────────────────────
    r.rotation.y += (pose.bodyYaw - r.rotation.y) * LERP;

    if (head.current) {
      head.current.rotation.y += (pose.headYaw - head.current.rotation.y) * LERP;
    }

    // ── Arms ─────────────────────────────────────────────────────────────────
    if (leftArm.current) {
      leftArm.current.rotation.z += (pose.leftShoulder - leftArm.current.rotation.z) * LERP;
    }
    if (rightArm.current) {
      rightArm.current.rotation.z += (pose.rightShoulder - rightArm.current.rotation.z) * LERP;
    }
    if (leftElbow.current) {
      leftElbow.current.rotation.x += (pose.leftElbow - leftElbow.current.rotation.x) * LERP;
    }
    if (rightElbow.current) {
      rightElbow.current.rotation.x += (pose.rightElbow - rightElbow.current.rotation.x) * LERP;
    }

    // ── Walk vs idle ──────────────────────────────────────────────────────────
    if (pose.walking) {
      const speed = 2.4;
      const swing = Math.sin(time * speed);
      if (leftLeg.current) leftLeg.current.rotation.x = swing * 0.28;
      if (rightLeg.current) rightLeg.current.rotation.x = -swing * 0.28;
      if (torso.current) torso.current.position.y = Math.abs(swing) * 0.03;
    } else {
      if (leftLeg.current) leftLeg.current.rotation.x += (0 - leftLeg.current.rotation.x) * 0.1;
      if (rightLeg.current) rightLeg.current.rotation.x += (0 - rightLeg.current.rotation.x) * 0.1;
      if (torso.current) torso.current.position.y = Math.sin(time * 0.8) * 0.012;
    }

    // ── Pointer ray ───────────────────────────────────────────────────────────
    if (rightWrist.current) {
      const rayMat = ray.material as THREE.LineDashedMaterial;
      if (pose.pointTarget) {
        ray.visible = true;
        rightWrist.current.getWorldPosition(wristWorld.current);
        const targetWorld = STATION_PANEL_POS[pose.pointTarget];

        // Convert both endpoints into the ray's (root) local space.
        rootLocal.current.copy(wristWorld.current);
        r.worldToLocal(rootLocal.current);
        targetLocal.current.copy(targetWorld);
        r.worldToLocal(targetLocal.current);

        const posAttr = ray.geometry.attributes.position as THREE.BufferAttribute;
        const arr = posAttr.array as Float32Array;
        arr[0] = rootLocal.current.x;
        arr[1] = rootLocal.current.y;
        arr[2] = rootLocal.current.z;
        arr[3] = targetLocal.current.x;
        arr[4] = targetLocal.current.y;
        arr[5] = targetLocal.current.z;
        posAttr.needsUpdate = true;
        ray.computeLineDistances();

        rayMat.opacity += (0.85 - rayMat.opacity) * 0.1;
      } else {
        rayMat.opacity += (0 - rayMat.opacity) * 0.15;
        if (rayMat.opacity < 0.02) ray.visible = false;
      }
    }
  });

  return (
    <group ref={root} position={[0, 0, 3]} scale={0}>
      {/* Legs (hip pivot at y≈0.9) */}
      <group ref={leftLeg} position={[-0.18, 0.9, 0]}>
        <mesh position={[0, -0.45, 0]} castShadow>
          <boxGeometry args={[0.22, 0.9, 0.22]} />
          <meshStandardMaterial color={BODY_HEX} roughness={0.7} metalness={0.25} />
        </mesh>
      </group>
      <group ref={rightLeg} position={[0.18, 0.9, 0]}>
        <mesh position={[0, -0.45, 0]} castShadow>
          <boxGeometry args={[0.22, 0.9, 0.22]} />
          <meshStandardMaterial color={BODY_HEX} roughness={0.7} metalness={0.25} />
        </mesh>
      </group>

      {/* Torso + upper body */}
      <group ref={torso} position={[0, 0.9, 0]}>
        {/* Body block — tapered look via slight scale */}
        <mesh position={[0, 0.55, 0]} castShadow>
          <boxGeometry args={[0.62, 1.1, 0.38]} />
          <meshStandardMaterial color={BODY_HEX} roughness={0.7} metalness={0.25} />
        </mesh>

        {/* Shoulder accent edge */}
        <mesh position={[0, 1.12, 0]}>
          <boxGeometry args={[0.66, 0.04, 0.42]} />
          <meshBasicMaterial color={ACCENT_HEX} toneMapped={false} />
        </mesh>

        {/* Head — flat-top hexagonal prism */}
        <group ref={head} position={[0, 1.45, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.26, 0.26, 0.42, 6]} />
            <meshStandardMaterial color={BODY_HEX} roughness={0.6} metalness={0.3} />
          </mesh>
          {/* Head rim glow */}
          <mesh position={[0, 0.23, 0]}>
            <cylinderGeometry args={[0.28, 0.28, 0.03, 6]} />
            <meshBasicMaterial color={ACCENT_HEX} toneMapped={false} />
          </mesh>
          <pointLight color={ACCENT_HEX} intensity={0.4} distance={2.5} />
        </group>

        {/* Left arm (shoulder pivot) */}
        <group ref={leftArm} position={[-0.42, 1.0, 0]}>
          <mesh position={[0, -0.32, 0]} castShadow>
            <boxGeometry args={[0.16, 0.64, 0.16]} />
            <meshStandardMaterial color={BODY_HEX} roughness={0.7} metalness={0.25} />
          </mesh>
          <mesh position={[0, -0.02, 0]}>
            <sphereGeometry args={[0.1, 8, 8]} />
            <meshBasicMaterial color={ACCENT_HEX} toneMapped={false} />
          </mesh>
          {/* Forearm (elbow pivot) */}
          <group ref={leftElbow} position={[0, -0.64, 0]}>
            <mesh position={[0, -0.28, 0]} castShadow>
              <boxGeometry args={[0.14, 0.56, 0.14]} />
              <meshStandardMaterial color={BODY_HEX} roughness={0.7} metalness={0.25} />
            </mesh>
            {/* Wedge "hand" */}
            <mesh position={[0, -0.6, 0]} castShadow>
              <coneGeometry args={[0.1, 0.22, 4]} />
              <meshStandardMaterial color={BODY_HEX} roughness={0.7} metalness={0.25} />
            </mesh>
          </group>
        </group>

        {/* Right arm (shoulder pivot) — carries the pointer wrist */}
        <group ref={rightArm} position={[0.42, 1.0, 0]}>
          <mesh position={[0, -0.32, 0]} castShadow>
            <boxGeometry args={[0.16, 0.64, 0.16]} />
            <meshStandardMaterial color={BODY_HEX} roughness={0.7} metalness={0.25} />
          </mesh>
          <mesh position={[0, -0.02, 0]}>
            <sphereGeometry args={[0.1, 8, 8]} />
            <meshBasicMaterial color={ACCENT_HEX} toneMapped={false} />
          </mesh>
          <group ref={rightElbow} position={[0, -0.64, 0]}>
            <mesh position={[0, -0.28, 0]} castShadow>
              <boxGeometry args={[0.14, 0.56, 0.14]} />
              <meshStandardMaterial color={BODY_HEX} roughness={0.7} metalness={0.25} />
            </mesh>
            <mesh position={[0, -0.6, 0]} castShadow>
              <coneGeometry args={[0.1, 0.22, 4]} />
              <meshStandardMaterial color={BODY_HEX} roughness={0.7} metalness={0.25} />
            </mesh>
            <object3D ref={rightWrist} position={[0, -0.66, 0]} />
          </group>
        </group>
      </group>

      {/* Pointer ray — dashed sage line, endpoints updated each frame */}
      <primitive object={ray} />
    </group>
  );
});

export default PMCharacter;
