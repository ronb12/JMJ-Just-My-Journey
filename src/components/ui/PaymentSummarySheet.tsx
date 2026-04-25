"use client";

import { DURATION, Y, useMotionSafe } from "@/lib/motion";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "./GlassCard";
import { LuxuryButton } from "./LuxuryButton";

type Line = { label: string; amount: string; sub?: string };
type Customer = { name: string; email: string; phone?: string | null };

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  lines: Line[];
  taxLine?: string;
  total: string;
  customer: Customer;
  busy?: boolean;
  onContinue: () => void;
};

export function PaymentSummarySheet({
  open,
  onClose,
  title,
  lines,
  taxLine = "Calculated at next step (placeholder)",
  total,
  customer,
  busy,
  onContinue,
}: Props) {
  const { reduce } = useMotionSafe();
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4"
          initial={reduce ? { opacity: 1 } : { opacity: 0 }}
          animate={reduce ? { opacity: 1 } : { opacity: 1 }}
          exit={reduce ? { opacity: 1 } : { opacity: 0 }}
          transition={reduce ? { duration: 0 } : { duration: DURATION.slow, ease: "easeOut" }}
        >
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden
          />
          <motion.div
            className="relative w-full max-w-md"
            initial={reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: Y }}
            animate={reduce ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: Y * 0.5 }}
            transition={reduce ? { duration: 0 } : { duration: DURATION.subtle, ease: "easeOut" }}
          >
            <GlassCard className="m-0 rounded-b-none border-white/50 bg-white/75 sm:rounded-3xl sm:m-0">
              <h2 className="font-serif text-2xl text-[#1E3A8A]">{title}</h2>
              <div className="mt-4 space-y-2 border-b border-sky-100/80 pb-3">
                {lines.map((l) => (
                  <div key={l.label} className="flex justify-between gap-2 text-sm">
                    <div>
                      <p className="text-slate-800">{l.label}</p>
                      {l.sub ? <p className="text-xs text-slate-500">{l.sub}</p> : null}
                    </div>
                    <span className="whitespace-nowrap text-slate-800">{l.amount}</span>
                  </div>
                ))}
                <div className="flex justify-between text-sm text-slate-500">
                  <span>Taxes</span>
                  <span>{taxLine}</span>
                </div>
              </div>
              <div className="mt-3 flex justify-between text-base font-medium text-[#1E3A8A]">
                <span>Total</span>
                <span>{total}</span>
              </div>
              <div className="mt-4 rounded-2xl bg-sky-50/80 p-3 text-sm text-slate-600">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Billed to
                </p>
                <p className="text-slate-800">{customer.name}</p>
                <p className="text-slate-600">{customer.email}</p>
                {customer.phone ? <p>{customer.phone}</p> : null}
              </div>
              <div className="mt-4 flex flex-col gap-2">
                <LuxuryButton type="button" disabled={busy} onClick={onContinue} className="w-full">
                  {busy ? "Preparing…" : "Continue to Secure Payment"}
                </LuxuryButton>
                <p className="text-center text-xs text-slate-500">Secure payment powered by Stripe</p>
              </div>
            </GlassCard>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
