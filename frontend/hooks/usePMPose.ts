"use client";

/**
 * Scroll → Portfolio-Manager pose state machine.
 *
 * Each pose defines target rotations (radians) for the character's bone
 * groups. The PMCharacter lerps current rotations toward these targets,
 * producing smooth transitions between scripted poses as the user scrolls.
 */

export type PoseName =
  | "idle"
  | "survey"
  | "walk-left"
  | "point-live"
  | "walk-center"
  | "point-periods"
  | "walk-right"
  | "point-chart"
  | "walk-forward"
  | "present";

export interface Pose {
  /** group rotation Y (facing direction) */
  bodyYaw: number;
  /** head rotation Y (look direction) */
  headYaw: number;
  leftShoulder: number; // rotation.z
  rightShoulder: number; // rotation.z
  leftElbow: number; // rotation.x
  rightElbow: number; // rotation.x
  /** which station the pointer ray targets, or null */
  pointTarget: "live" | "periods" | "chart" | null;
  walking: boolean;
}

const REST: Pose = {
  bodyYaw: 0,
  headYaw: 0,
  leftShoulder: 0.05,
  rightShoulder: -0.05,
  leftElbow: 0,
  rightElbow: 0,
  pointTarget: null,
  walking: false,
};

export const POSES: Record<PoseName, Pose> = {
  idle: { ...REST },
  survey: { ...REST, headYaw: 0.5 },
  "walk-left": { ...REST, bodyYaw: -0.9, walking: true },
  "point-live": {
    ...REST,
    bodyYaw: -0.7,
    headYaw: -0.3,
    leftShoulder: 1.1,
    leftElbow: -0.4,
    pointTarget: "live",
  },
  "walk-center": { ...REST, bodyYaw: 0, walking: true },
  "point-periods": {
    ...REST,
    headYaw: -0.1,
    rightShoulder: -1.1,
    rightElbow: 0.4,
    pointTarget: "periods",
  },
  "walk-right": { ...REST, bodyYaw: 0.9, walking: true },
  "point-chart": {
    ...REST,
    bodyYaw: 0.7,
    headYaw: 0.3,
    leftShoulder: 0.9,
    rightShoulder: -0.9,
    pointTarget: "chart",
  },
  "walk-forward": { ...REST, bodyYaw: 0, walking: true },
  present: {
    ...REST,
    bodyYaw: 0,
    leftShoulder: 0.8,
    rightShoulder: -0.8,
    leftElbow: -0.3,
    rightElbow: 0.3,
  },
};

/** Ordered [scrollEnd, pose] keyframes — the first whose threshold is >= p wins. */
const TIMELINE: Array<[number, PoseName]> = [
  [0.1, "idle"],
  [0.18, "survey"],
  [0.3, "walk-left"],
  [0.42, "point-live"],
  [0.5, "walk-center"],
  [0.62, "point-periods"],
  [0.72, "walk-right"],
  [0.8, "point-chart"],
  [0.9, "walk-forward"],
  [1.01, "present"],
];

export function poseForProgress(p: number): PoseName {
  for (const [threshold, name] of TIMELINE) {
    if (p <= threshold) return name;
  }
  return "present";
}

/**
 * World-space X position of the character along the scroll, so it walks
 * between stations. Interpolated linearly across walk segments.
 */
export function characterPositionForProgress(p: number): [number, number, number] {
  // [scroll, x, z] anchors
  const anchors: Array<[number, number, number]> = [
    [0.0, 0, 3],
    [0.18, 0, 2.5],
    [0.3, -3, 1],
    [0.42, -3, 1],
    [0.5, 0, 1],
    [0.62, 0, 1],
    [0.72, 3, 1],
    [0.8, 3, 1],
    [0.9, 0, 3],
    [1.0, 0, 4],
  ];

  for (let i = 0; i < anchors.length - 1; i++) {
    const [s0, x0, z0] = anchors[i];
    const [s1, x1, z1] = anchors[i + 1];
    if (p >= s0 && p <= s1) {
      const t = s1 === s0 ? 0 : (p - s0) / (s1 - s0);
      return [x0 + (x1 - x0) * t, 0, z0 + (z1 - z0) * t];
    }
  }
  const last = anchors[anchors.length - 1];
  return [last[1], 0, last[2]];
}
