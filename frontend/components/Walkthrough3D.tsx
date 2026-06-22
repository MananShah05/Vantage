"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Center } from "@react-three/drei";
import * as THREE from "three";

function Scene({ activeStep }: { activeStep: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const meshRefs = useRef<(THREE.Mesh | null)[]>([]);

  // Tickers/data points representation
  const itemsCount = 7;

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (!groupRef.current) return;

    // Slow overall rotation
    groupRef.current.rotation.y = time * 0.15;

    for (let index = 0; index < itemsCount; index++) {
      const mesh = meshRefs.current[index];
      if (!mesh) continue;

      let targetPos = new THREE.Vector3();
      let targetScale = new THREE.Vector3(1, 1, 1);
      let targetColor = new THREE.Color("oklch(72% 0.18 68)"); // Amber accent default

      if (activeStep === 0) {
        // Step 0: Ingestion - 7 spheres orbiting in 3D space
        const angle = (index / itemsCount) * Math.PI * 2;
        const radius = 1.8 + Math.sin(time * 2 + index) * 0.15;
        targetPos.set(
          Math.cos(angle) * radius,
          Math.sin(time + index) * 0.4,
          Math.sin(angle) * radius
        );
        targetScale.setScalar(0.25);
        // Varying colors representing different indices
        targetColor.set(index % 2 === 0 ? "oklch(72% 0.18 68)" : "oklch(55% 0.08 240)");
      } else if (activeStep === 1) {
        // Step 1: Computation - 6 boxes forming a tight rotating double helix or cluster
        // Hide the 7th item by scaling to 0
        if (index === 6) {
          targetScale.setScalar(0);
        } else {
          const angle = (index / 6) * Math.PI * 2;
          const height = Math.sin(time * 3 + index) * 0.4;
          targetPos.set(
            Math.cos(angle + time) * 0.8,
            height,
            Math.sin(angle + time) * 0.8
          );
          targetScale.set(0.3, 0.3, 0.3);
          
          // Color pulses representing calculation
          const pulse = (Math.sin(time * 5 + index) + 1) / 2;
          const startColor = new THREE.Color(0xd97706); // Amber
          const endColor = new THREE.Color(0xf59e0b); // Light Amber
          targetColor.copy(startColor).lerp(endColor, pulse);
        }
      } else if (activeStep === 2) {
        // Step 2: Presenting - 3D Bar chart layout
        const spacing = 0.55;
        const startX = -((itemsCount - 1) * spacing) / 2;
        const x = startX + index * spacing;

        const heights = [1.4, 0.9, -0.6, 0.8, 1.1, -0.4, 0.2]; // representative returns
        const h = heights[index];

        targetPos.set(x, h / 2, 0);
        targetScale.set(0.25, Math.abs(h), 0.25);

        if (h >= 0) {
          targetColor.set(0x22c55e); // positive green
        } else {
          targetColor.set(0xef4444); // negative red
        }
      } else {
        // Step 3: Visualization - Flowing torus or wave
        const angle = (index / itemsCount) * Math.PI * 2;
        const radius = 1.3;
        const offset = Math.sin(time * 4 + index * 2) * 0.12;
        targetPos.set(
          Math.cos(angle) * (radius + offset),
          Math.sin(time * 2 + index) * 0.15,
          Math.sin(angle) * (radius + offset)
        );
        targetScale.setScalar(0.35);
        targetColor.setHSL((index / itemsCount + time * 0.08) % 1.0, 0.7, 0.5);
      }

      // Interpolate mesh properties smoothly
      mesh.position.lerp(targetPos, 0.1);
      mesh.scale.lerp(targetScale, 0.1);

      // Interpolate material color
      if (mesh.material && 'color' in mesh.material) {
        (mesh.material as THREE.MeshStandardMaterial).color.lerp(targetColor, 0.1);
      }
    }
  });

  return (
    <group ref={groupRef}>
      {Array.from({ length: itemsCount }).map((_, i) => (
        <mesh
          key={i}
          ref={(el) => { meshRefs.current[i] = el; }}
          position={[0, 0, 0]}
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial roughness={0.1} metalness={0.8} />
        </mesh>
      ))}
    </group>
  );
}

export default function Walkthrough3D({ activeStep }: { activeStep: number }) {
  return (
    <div className="w-full h-full absolute inset-0">
      <Canvas camera={{ position: [0, 0, 4.5], fov: 50 }}>
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} />
        <pointLight position={[-5, -5, -5]} intensity={0.3} color="blue" />
        <Center>
          <Scene activeStep={activeStep} />
        </Center>
      </Canvas>
    </div>
  );
}
