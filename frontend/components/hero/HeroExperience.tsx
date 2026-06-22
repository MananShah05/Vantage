"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useScrollProgress } from "../../hooks/useScrollProgress";
import { isMobileDevice, prefersReducedMotion } from "../../utils/device";
import HeroHtmlLayer from "./HeroHtmlLayer";
import HeroMobileVariant from "./HeroMobileVariant";

// R3F scene is client-only — never server-render the WebGL canvas.
const HeroCanvas = dynamic(() => import("./HeroCanvas"), { ssr: false });

export default function HeroExperience() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress, act1, act5 } = useScrollProgress(containerRef);

  // Decide render path after mount to avoid SSR / hydration mismatch.
  const [mode, setMode] = useState<"pending" | "desktop" | "mobile">("pending");

  useEffect(() => {
    const decide = () => {
      setMode(isMobileDevice() || prefersReducedMotion() ? "mobile" : "desktop");
    };
    decide();
    window.addEventListener("resize", decide);
    return () => window.removeEventListener("resize", decide);
  }, []);

  if (mode === "mobile") {
    return <HeroMobileVariant />;
  }

  // While pending, render the tall container so layout is stable; canvas mounts
  // once we confirm desktop.
  return (
    <div ref={containerRef} style={{ position: "relative", height: "500vh" }}>
      <div
        style={{
          position: "sticky",
          top: 0,
          height: "100vh",
          width: "100%",
          overflow: "hidden",
          background: "var(--bg-base)",
        }}
      >
        {mode === "desktop" && (
          <>
            <div style={{ position: "absolute", inset: 0 }}>
              <HeroCanvas scrollProgress={scrollYProgress} act1={act1} />
            </div>
            <HeroHtmlLayer scrollYProgress={scrollYProgress} act1={act1} act5={act5} />
          </>
        )}
      </div>
    </div>
  );
}
