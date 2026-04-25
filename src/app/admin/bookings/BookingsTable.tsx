"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { useCallback, useState } from "react";

type Row = {
  id: string;
  user_name: string;
  service_name: string;
  email: string;
  appointment_date: string;
  status: string;
  payment_status: string;
};

const statuses = ["pending", "confirmed", "completed", "cancelled"] as const;

export function BookingsTable({ rows }: { rows: unknown[] }) {
  const [local, setLocal] = useState<Row[]>(
    (rows as Row[]).map((r) => ({ ...r }))
  );
  const save = useCallback(
    async (id: string, status: (typeof statuses)[number]) => {
      const res = await fetch("/api/appointments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) {
        setLocal((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)));
      }
    },
    []
  );
  return (
    <GlassCard className="mt-4 max-w-5xl overflow-x-auto p-0">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="bg-sky-50/50 text-slate-600">
          <tr>
            <th className="p-2">User</th>
            <th className="p-2">Service</th>
            <th className="p-2">Date</th>
            <th className="p-2">Status</th>
            <th className="p-2">Pay</th>
            <th className="p-2">Set status</th>
          </tr>
        </thead>
        <tbody>
          {local.map((r) => (
            <tr key={r.id} className="border-t border-sky-100/50">
              <td className="p-2">
                {r.user_name}
                <br />
                <span className="text-xs text-slate-500">{r.email}</span>
              </td>
              <td className="p-2">{r.service_name}</td>
              <td className="p-2 whitespace-nowrap">{r.appointment_date}</td>
              <td className="p-2">{r.status}</td>
              <td className="p-2">{r.payment_status}</td>
              <td className="p-2">
                <select
                  className="rounded-xl border border-white/40 bg-white/50 px-1 py-1"
                  value={r.status}
                  onChange={(e) => {
                    const v = e.target.value as (typeof statuses)[number];
                    if (statuses.includes(v)) {
                      void save(r.id, v);
                    }
                  }}
                >
                  {statuses.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </GlassCard>
  );
}
