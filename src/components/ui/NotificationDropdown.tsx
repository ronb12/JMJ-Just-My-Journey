"use client";

import { cn } from "@/lib/cn";
import { AnimatePresence, motion } from "framer-motion";
import { GlassCard } from "./GlassCard";
import { LuxuryButton } from "./LuxuryButton";
import { useRef } from "react";
import { useOnClickOutside } from "@/hooks/use-on-click-outside";

type N = { id: string; title: string; message: string; created_at: string; is_read: boolean; link_url: string | null };

type Props = {
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  items: N[];
  unread: number;
  onMarkAll: () => void;
  onMark: (id: string) => void;
  onDelete: (id: string) => void;
};

function safeDate(s: string) {
  try {
    return new Date(s).toLocaleString();
  } catch {
    return s;
  }
}

export function NotificationDropdown({
  open,
  onClose,
  onToggle,
  items,
  unread,
  onMarkAll,
  onMark,
  onDelete,
}: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  useOnClickOutside(ref, onClose);
  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={onToggle}
        className="relative rounded-2xl border border-slate-200 bg-white p-2 shadow-sm dark:border-white/10 dark:bg-slate-900"
        aria-label="Notifications"
      >
        <span className="text-lg">&#128276;</span>
        {unread > 0 ? (
          <span className="absolute -right-1 -top-1 min-h-[1.1rem] min-w-[1.1rem] rounded-full bg-[#14B8A6] px-1 text-center text-[10px] text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            className="absolute right-0 z-40 mt-2 w-96 max-w-[calc(100vw-1.5rem)]"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
            <GlassCard className="max-h-[80vh] overflow-y-auto p-0">
              <div className="flex items-center justify-between border-b border-sky-100/80 px-4 py-2 dark:border-white/10">
                <h3 className="font-serif text-sky-900 dark:text-slate-100">Notifications</h3>
                <LuxuryButton
                  type="button"
                  variant="ghost"
                  className="px-2 py-1 text-xs"
                  onClick={onMarkAll}
                >
                  Mark all
                </LuxuryButton>
              </div>
              {items.length === 0 ? (
                <p className="p-4 text-sm text-slate-500 dark:text-slate-300">You&apos;re all caught up.</p>
              ) : null}
              <ul className="divide-y divide-sky-100/50 dark:divide-white/10">
                {items.map((n) => (
                  <li
                    key={n.id}
                    className={cn(
                      "px-4 py-2 text-left text-sm",
                      !n.is_read && "bg-sky-50/60 dark:bg-white/5"
                    )}
                  >
                    <p className="font-medium text-slate-800 dark:text-slate-100">{n.title}</p>
                    <p className="mt-0.5 whitespace-pre-wrap text-slate-800 dark:text-slate-200">{n.message}</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{safeDate(n.created_at)}</p>
                    <div className="mt-1 flex gap-1">
                      {!n.is_read ? (
                        <button
                          className="text-xs text-sky-700 hover:underline"
                          type="button"
                          onClick={() => onMark(n.id)}
                        >
                          Mark read
                        </button>
                      ) : null}
                      <button
                        className="text-xs text-rose-700 hover:underline"
                        type="button"
                        onClick={() => onDelete(n.id)}
                      >
                        Remove
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
