"use client";

import { LuxuryButton } from "@/components/ui/LuxuryButton";
import { useCallback, useEffect, useState } from "react";

type Row = {
  id: string;
  user_id: string;
  title: string | null;
  message: string | null;
  created_at: string;
};

function fmtDate(v: unknown): string {
  if (v instanceof Date) return v.toLocaleString();
  const s = String(v ?? "");
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? s : d.toLocaleString();
}

export function AdminNotificationsClient() {
  const [rows, setRows] = useState<Row[]>([]);

  const load = useCallback(() => {
    void fetch("/api/admin/notifications")
      .then((r) => r.json())
      .then((d) => setRows((d.notifications as Row[]) || []));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="mt-4 overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow dark:border-white/10 dark:bg-slate-900">
      <table className="w-full min-w-[920px] text-left text-sm">
        <thead className="bg-sky-50/50 text-slate-600 dark:bg-slate-800/70 dark:text-slate-200">
          <tr>
            <th className="p-2">Title</th>
            <th className="p-2">Message</th>
            <th className="p-2 whitespace-nowrap">Created</th>
            <th className="p-2 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((n) => (
            <tr key={n.id} className="border-t border-sky-100/50 dark:border-white/10">
              <td className="p-2 font-medium text-slate-800">{n.title || "—"}</td>
              <td className="p-2 text-slate-600">{n.message || "—"}</td>
              <td className="p-2 whitespace-nowrap text-xs text-slate-500">{fmtDate(n.created_at)}</td>
              <td className="p-2">
                <div className="flex justify-end">
                  <LuxuryButton
                    type="button"
                    variant="ghost"
                    className="!px-3 !py-1.5 text-xs"
                    onClick={async () => {
                      if (!confirm("Delete notification?")) return;
                      const res = await fetch("/api/admin/notifications?id=" + n.id, { method: "DELETE" });
                      if (!res.ok) {
                        const j = (await res.json().catch(() => ({}))) as { error?: string };
                        alert(j.error || "Could not delete");
                        return;
                      }
                      load();
                    }}
                  >
                    Delete
                  </LuxuryButton>
                </div>
              </td>
            </tr>
          ))}
          {rows.length === 0 ? (
            <tr>
              <td className="p-3 text-slate-500" colSpan={4}>
                No notifications.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}

