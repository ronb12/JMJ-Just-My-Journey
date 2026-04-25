"use client";

import { cn } from "@/lib/cn";
import { useMotionSafe } from "@/lib/motion";
import { motion } from "framer-motion";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

type Variant = "primary" | "ghost" | "teal";

type ButtonProps = Omit<
  ComponentPropsWithoutRef<"button">,
  "onAnimationStart" | "onAnimationEnd" | "onDrag" | "onDragStart" | "onDragEnd"
>;

type Props = {
  className?: string;
  children: ReactNode;
  variant?: Variant;
} & ButtonProps;

export function LuxuryButton({
  className,
  children,
  variant = "primary",
  type = "button",
  ...rest
}: Props) {
  const { reduce } = useMotionSafe();
  const base = cn(
    "inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3 text-sm font-medium tracking-tight",
    "shadow-md shadow-sky-900/10 transition-colors focus:outline-none focus:ring-2 focus:ring-[#60A5FA] focus:ring-offset-2 focus:ring-offset-white",
    variant === "primary" && "bg-[#2563EB] text-white hover:bg-[#1D4ED8]",
    variant === "teal" && "bg-[#14B8A6] text-white hover:bg-[#0D9488]",
    variant === "ghost" && "bg-white/60 text-[#1E3A8A] hover:bg-white/80",
    className
  );
  if (reduce) {
    return (
      <button className={base} type={type} {...rest}>
        {children}
      </button>
    );
  }
  return (
    <motion.button
      className={base}
      type={type}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.99 }}
      transition={{ duration: 0.2 }}
      {...rest}
    >
      {children}
    </motion.button>
  );
}
