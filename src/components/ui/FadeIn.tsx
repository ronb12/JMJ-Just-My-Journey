"use client";

import { useMotionSafe } from "@/lib/motion";
import { motion } from "framer-motion";

type Props = React.PropsWithChildren<{
  className?: string;
  delay?: number;
}>;

export function FadeIn({ className, children, delay = 0 }: Props) {
  const { reduce, duration, y } = useMotionSafe();
  if (reduce) {
    return <div className={className}>{children}</div>;
  }
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
