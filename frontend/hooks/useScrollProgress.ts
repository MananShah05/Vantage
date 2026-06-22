"use client";

import { useScroll, useTransform, type MotionValue } from "framer-motion";
import type { RefObject } from "react";

export interface ScrollActs {
  scrollYProgress: MotionValue<number>;
  act1: MotionValue<number>;
  act2: MotionValue<number>;
  act3: MotionValue<number>;
  act4: MotionValue<number>;
  act5: MotionValue<number>;
}

/**
 * Maps the hero scroll container progress [0,1] into normalized per-act
 * progress values. Ranges mirror the animation timeline in the spec.
 */
export function useScrollProgress(containerRef: RefObject<HTMLElement | null>): ScrollActs {
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const act1 = useTransform(scrollYProgress, [0.0, 0.18], [0, 1]);
  const act2 = useTransform(scrollYProgress, [0.18, 0.42], [0, 1]);
  const act3 = useTransform(scrollYProgress, [0.42, 0.68], [0, 1]);
  const act4 = useTransform(scrollYProgress, [0.68, 0.8], [0, 1]);
  const act5 = useTransform(scrollYProgress, [0.8, 1.0], [0, 1]);

  return { scrollYProgress, act1, act2, act3, act4, act5 };
}
