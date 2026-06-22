/**
 * Shared types for the R3F hero scene.
 *
 * MotionValue objects from framer-motion are plain objects, so they can be
 * passed across the React-DOM → R3F reconciler boundary as props and read
 * inside useFrame via `.get()` without triggering React re-renders.
 */
export interface MotionValueLike {
  get(): number;
}
