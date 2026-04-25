"use client";

import { useMotionSafe } from "@/lib/motion";
import { cn } from "@/lib/cn";
import Image from "next/image";
import { motion } from "framer-motion";
import { GlassCard } from "./GlassCard";
import { LuxuryButton } from "./LuxuryButton";
import Link from "next/link";

type Props = {
  id: string;
  name: string;
  price: string;
  imageUrl?: string | null;
  category?: string | null;
  ctaLabel?: string;
  href?: string;
  className?: string;
  onAdd?: () => void;
};

export function ProductGlassCard({
  id,
  name,
  price,
  imageUrl,
  category,
  ctaLabel = "View",
  href,
  className,
  onAdd,
}: Props) {
  const { reduce, duration, y } = useMotionSafe();
  const content = (
    <GlassCard
      className={cn("group flex h-full flex-col p-0 overflow-hidden", className)}
      data-product-id={id}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-sky-50/80">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={name}
            fill
            className="object-cover transition duration-1000 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 33vw"
            unoptimized={imageUrl.startsWith("/")}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-slate-400">JMJ</div>
        )}
        {category ? (
          <span className="absolute left-3 top-3 rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-sky-800 backdrop-blur">
            {category}
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-serif text-lg text-[#1E3A8A]">{name}</h3>
        <p className="mt-1 text-2xl font-light text-[#2563EB]">
          {typeof price === "string" && price.startsWith("$") ? price : `$${price}`}
        </p>
        <div className="mt-4 flex gap-2">
          {href ? (
            <Link href={href} className="inline-flex flex-1">
              <LuxuryButton className="w-full" type="button">
                {ctaLabel}
              </LuxuryButton>
            </Link>
          ) : null}
          {onAdd ? (
            <LuxuryButton variant="teal" className="flex-1" type="button" onClick={onAdd}>
              Add to bag
            </LuxuryButton>
          ) : null}
        </div>
      </div>
    </GlassCard>
  );
  if (reduce) {
    return content;
  }
  return (
    <motion.div
      initial={{ opacity: 0, y: y * 0.3 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration, ease: "easeOut" }}
      whileHover={{ y: -4, scale: 1.01 }}
    >
      {content}
    </motion.div>
  );
}
