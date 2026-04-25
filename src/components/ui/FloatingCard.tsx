"use client";

import { useMotionSafe } from "@/lib/motion";
import { cn } from "@/lib/cn";
import { motion } from "framer-motion";
import { GlassCard } from "./GlassCard";

type Props = React.PropsWithChildren<{
  className?: string;
  delay?: number;
}>;

export function FloatingCard({ className, children, delay = 0 }: Props) {
  const { reduce, duration, y } = useMotionSafe();
  if (reduce) {
    return <GlassCard className={className}>{children}</GlassCard>;
  }
  return (
    <motion.div
      className="will-change-transform"
      initial={{ opacity: 0, y: y * 0.5 }}
      whileInView={{ opacity: 1, y: 0 }}
      whileHover={reduce ? undefined : { y: -4, scale: 1.01 }}
      viewport={{ once: true, margin: "-5%" }}
      transition={{ duration, delay, ease: "easeOut" }}
    >
      <GlassCard className={className}>{children}</GlassCard>
    </motion.div>
  );
}
