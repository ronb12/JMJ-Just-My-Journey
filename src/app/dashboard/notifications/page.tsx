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
      <div className="mt-4 space-y-2">
        {list.map((n) => (
          <GlassCard key={n.id} className="!p-3">
            <p className="font-medium text-slate-800">{n.title}</p>
            <p className="text-sm text-slate-600">{n.message}</p>
            <p className="text-xs text-slate-400">{n.created_at}</p>
            <div className="mt-1 flex gap-1">
              {!n.is_read ? (
                <button
                  className="text-xs text-sky-700"
                  type="button"
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
                </button>
              ) : null}
              <button
                className="text-xs text-rose-600"
                type="button"
                onClick={async () => {
                  await fetch(`/api/notifications/${n.id}`, { method: "DELETE" });
                  load();
                }}
              >
                Remove
              </button>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
