"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { LuxuryButton } from "@/components/ui/LuxuryButton";
import { useCallback, useEffect, useState } from "react";

type N = {
  id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
};

function fmtDate(v: unknown): string {
  if (v instanceof Date) return v.toLocaleString();
  const s = String(v ?? "");
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? s : d.toLocaleString();
}

export default function NotificationsPage() {
  const [list, setList] = useState<N[]>([]);
  const load = useCallback(() => {
    void fetch("/api/notifications")
      .then((r) => r.json())
      .then((d) => setList((d.notifications as N[]) || []));
  }, []);
  useEffect(() => {
    load();
  }, [load]);
  return (
    <div>
      <h1 className="font-serif text-3xl text-[#1E3A8A]">Notifications</h1>
      <div className="mt-2">
        <LuxuryButton
          type="button"
          variant="ghost"
          className="!px-2 !py-1 text-xs"
          onClick={async () => {
            await fetch("/api/notifications/mark-all-read", { method: "POST" });
            load();
          }}
        >
          Mark all read
        </LuxuryButton>
      </div>
      <div className="mt-4 space-y-3">
        <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow">
          <table className="w-full min-w-[920px] text-left text-sm">
            <thead className="bg-sky-50/50 text-slate-600">
              <tr>
                <th className="p-2">Title</th>
                <th className="p-2">Message</th>
                <th className="p-2 whitespace-nowrap">Created</th>
                <th className="p-2">Read</th>
                <th className="p-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.map((n) => (
                <tr key={n.id} className="border-t border-sky-100/50">
                  <td className="p-2 font-medium text-slate-800">{n.title}</td>
                  <td className="p-2 whitespace-pre-wrap text-slate-800">{n.message}</td>
                  <td className="p-2 whitespace-nowrap text-xs text-slate-500">{fmtDate(n.created_at)}</td>
                  <td className="p-2">{n.is_read ? "yes" : "no"}</td>
                  <td className="p-2">
                    <div className="flex justify-end gap-2">
                      {!n.is_read ? (
                        <LuxuryButton
                          type="button"
                          variant="ghost"
                          className="!px-3 !py-1.5 text-xs"
                          onClick={async () => {
                            await fetch("/api/notifications/mark-read", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ id: n.id }),
                            });
                            load();
                          }}
                        >
                          Mark read
                        </LuxuryButton>
                      ) : null}
                      <LuxuryButton
                        type="button"
                        variant="ghost"
                        className="!px-3 !py-1.5 text-xs"
                        onClick={async () => {
                          await fetch(`/api/notifications/${n.id}`, { method: "DELETE" });
                          load();
                        }}
                      >
                        Delete
                      </LuxuryButton>
                    </div>
                  </td>
                </tr>
              ))}
              {list.length === 0 ? (
                <tr>
                  <td className="p-3 text-slate-500" colSpan={5}>
                    No notifications yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        {list.length > 0 ? (
          <GlassCard className="!p-3 text-xs text-slate-600">
            Notifications are personal to your account; you can mark read or delete them here.
          </GlassCard>
        ) : null}
      </div>
    </div>
  );
}
