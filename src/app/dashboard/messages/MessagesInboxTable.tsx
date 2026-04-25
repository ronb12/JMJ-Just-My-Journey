"use client";

import { LuxuryButton } from "@/components/ui/LuxuryButton";
import { cn } from "@/lib/cn";

type Conv = { id: string; subject: string; updated_at: string; unread?: number };

function fmtDate(s: string) {
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? s : d.toLocaleString();
}

export function MessagesInboxTable({
  convs,
  activeId,
  onOpen,
  onDelete,
  className,
}: {
  convs: Conv[];
  activeId: string | null;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-900/80",
        className
      )}
    >
      <table className="w-full min-w-[520px] text-left text-sm">
        <thead className="bg-sky-50/50 text-slate-600 dark:bg-slate-800/70 dark:text-slate-200">
          <tr>
            <th className="p-2">Subject</th>
            <th className="p-2 whitespace-nowrap">Updated</th>
            <th className="p-2 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {convs.map((c) => (
            <tr
              key={c.id}
              className={cn(
                "border-t border-sky-100/50 dark:border-white/10",
                activeId === c.id && "bg-sky-50/60 dark:bg-white/5"
              )}
            >
              <td className="p-2">
                <button type="button" className="w-full text-left" onClick={() => onOpen(c.id)}>
                  <div className="flex items-center gap-2">
                    <span className="truncate font-medium text-slate-800 hover:underline dark:text-slate-100">
                      {c.subject}
                    </span>
                    {(c.unread ?? 0) > 0 ? (
                      <span className="rounded-full bg-[#2563EB] px-2 py-0.5 text-[10px] font-semibold text-white">
                        {c.unread}
                      </span>
                    ) : null}
                  </div>
                </button>
              </td>
              <td className="p-2 whitespace-nowrap text-xs text-slate-500">{fmtDate(c.updated_at)}</td>
              <td className="p-2">
                <div className="flex justify-end gap-2">
                  <LuxuryButton
                    type="button"
                    variant="ghost"
                    className="!px-3 !py-1.5 text-xs"
                    onClick={() => onOpen(c.id)}
                  >
                    Open
                  </LuxuryButton>
                  <LuxuryButton
                    type="button"
                    variant="ghost"
                    className="!px-3 !py-1.5 text-xs"
                    onClick={() => onDelete(c.id)}
                  >
                    Delete
                  </LuxuryButton>
                </div>
              </td>
            </tr>
          ))}
          {convs.length === 0 ? (
            <tr>
              <td className="p-3 text-slate-500" colSpan={3}>
                No conversations yet.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}

