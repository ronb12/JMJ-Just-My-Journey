"use client";

import { cn } from "@/lib/cn";
import { useEffect } from "react";

export function Modal({
  open,
  title,
  onClose,
  children,
  className,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <button
        type="button"
        aria-label="Close modal"
        className="absolute inset-0 cursor-default bg-slate-950/55"
        onClick={onClose}
      />
      <div
        className={cn(
          "relative w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-5 text-slate-900 shadow-2xl",
          className
        )}
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="min-w-0 truncate font-serif text-xl text-[#1E3A8A]">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700 hover:bg-slate-50"
          >
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

