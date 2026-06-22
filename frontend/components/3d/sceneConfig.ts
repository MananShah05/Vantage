import * as THREE from "three";

export type StationId = "live" | "periods" | "chart";

/** World positions of the floor group for each feature station. */
export const STATION_POSITIONS: Record<StationId, [number, number, number]> = {
  live: [-5, 0, 0],
  periods: [0, 0, -2],
  chart: [5, 0, 0],
};

/** Panel anchor (where the pointer ray aims / where the <Html> floats). */
export const STATION_PANEL_POS: Record<StationId, THREE.Vector3> = {
  live: new THREE.Vector3(-5, 2.5, 0),
  periods: new THREE.Vector3(0, 2.5, -2),
  chart: new THREE.Vector3(5, 2.5, 0),
};

/** Sage-emerald accent as a hex usable by three materials (~ oklch 0.73 0.17 165). */
export const ACCENT_HEX = "#3fd9a0";
export const BODY_HEX = "#373f4d";
