import { useReducedMotion } from "framer-motion";

export const DURATION = { slow: 0.9, subtle: 1.1 };
export const Y = 16;

export function useMotionSafe() {
  const reduce = useReducedMotion();
  return { reduce: Boolean(reduce), duration: reduce ? 0 : DURATION.slow, y: reduce ? 0 : Y };
}
