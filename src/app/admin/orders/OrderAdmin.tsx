"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { useState } from "react";

const fulfill = [
  "unfulfilled",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
] as const;

type Row = {
  id: string;
  user_name: string;
  email: string;
  total_amount: string;
  payment_status: string;
  fulfillment_status: string;
};

export function OrderAdmin({ rows }: { rows: unknown[] }) {
  const [list, setList] = useState<Row[]>(rows as Row[]);
  return (
    <div className="mt-4 space-y-2">
      {list.map((o) => (
        <GlassCard key={o.id} className="!p-3 text-sm">
          <p>
            {o.user_name} &lt;{o.email}&gt;
          </p>
          <p>
            Order #{o.id.slice(0, 8)} | ${o.total_amount} | pay: {o.payment_status}
          </p>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-slate-500">Fulfillment:</span>
            <select
              className="rounded-lg border border-white/40 bg-white/50 px-1 py-1"
              value={o.fulfillment_status}
              onChange={async (e) => {
                const v = e.target.value;
                const res = await fetch("/api/orders/" + o.id, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ fulfillment_status: v }),
                });
                if (res.ok) {
                  setList((prev) =>
                    prev.map((p) => (p.id === o.id ? { ...p, fulfillment_status: v } : p))
                  );
                }
              }}
            >
              {fulfill.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>
        </GlassCard>
      ))}
    </div>
  );
}
