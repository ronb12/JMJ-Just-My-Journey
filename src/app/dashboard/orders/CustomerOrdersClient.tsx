"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { LuxuryButton } from "@/components/ui/LuxuryButton";
import { useState } from "react";

type Row = {
  id: string;
  total_amount: string;
  payment_status: string;
  fulfillment_status: string;
  created_at?: string;
};

export function CustomerOrdersClient({ initial }: { initial: Row[] }) {
  const [list, setList] = useState<Row[]>(initial);
  return (
    <div className="mt-4 space-y-3">
      <div className="overflow-x-auto rounded-3xl border border-white/30 bg-white/30 shadow">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="bg-sky-50/50 text-slate-600">
            <tr>
              <th className="p-2">Order</th>
              <th className="p-2 text-right">Total</th>
              <th className="p-2">Payment</th>
              <th className="p-2">Fulfillment</th>
              <th className="p-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {list.map((o) => {
              const canDelete = o.payment_status === "pending" && o.fulfillment_status === "unfulfilled";
              return (
                <tr key={o.id} className="border-t border-sky-100/50">
                  <td className="p-2 whitespace-nowrap">#{o.id.slice(0, 8)}</td>
                  <td className="p-2 text-right">${o.total_amount}</td>
                  <td className="p-2">{o.payment_status}</td>
                  <td className="p-2">{o.fulfillment_status}</td>
                  <td className="p-2">
                    <div className="flex justify-end">
                      {canDelete ? (
                        <LuxuryButton
                          type="button"
                          variant="ghost"
                          className="!px-3 !py-1.5 text-xs"
                          onClick={async () => {
                            if (!confirm("Delete this order?")) return;
                            const res = await fetch("/api/orders/" + o.id, { method: "DELETE" });
                            if (!res.ok) {
                              const j = (await res.json().catch(() => ({}))) as { error?: string };
                              alert(j.error || "Could not delete");
                              return;
                            }
                            setList((prev) => prev.filter((x) => x.id !== o.id));
                          }}
                        >
                          Delete
                        </LuxuryButton>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {list.length === 0 ? (
              <tr>
                <td className="p-3 text-slate-500" colSpan={5}>
                  No orders yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <GlassCard className="!p-3 text-xs text-slate-600">
        Orders can only be deleted before payment and before fulfillment begins.
      </GlassCard>
    </div>
  );
}

