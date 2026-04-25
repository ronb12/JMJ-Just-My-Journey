"use client";

import { OrderTrackingModal } from "@/components/orders/OrderTrackingModal";
import { GlassCard } from "@/components/ui/GlassCard";
import { LuxuryButton } from "@/components/ui/LuxuryButton";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type Row = {
  id: string;
  total_amount: string;
  payment_status: string;
  fulfillment_status: string;
  created_at?: string;
  easypost_tracking_code?: string | null;
  tracking_number?: string | null;
  tracking_url?: string | null;
};

export function CustomerOrdersClient({
  initial,
  initialOpenOrderId,
}: {
  initial: Row[];
  initialOpenOrderId?: string | null;
}) {
  const r = useRouter();
  const sp = useSearchParams();
  const [list, setList] = useState<Row[]>(initial);
  const [trackId, setTrackId] = useState<string | null>(null);
  const [trackOpen, setTrackOpen] = useState(false);
  const openedFromUrl = useRef(false);

  useEffect(() => {
    if (openedFromUrl.current) return;
    const o = sp.get("o") || initialOpenOrderId;
    if (o && list.some((x) => x.id === o)) {
      setTrackId(o);
      setTrackOpen(true);
      openedFromUrl.current = true;
    }
  }, [sp, list, initialOpenOrderId]);

  return (
    <div className="mt-4 space-y-3">
      <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow dark:border-white/10 dark:bg-slate-900">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="bg-sky-50/50 text-slate-600 dark:bg-slate-800/70 dark:text-slate-200">
            <tr>
              <th className="p-2">Order</th>
              <th className="p-2 text-right">Total</th>
              <th className="p-2">Payment</th>
              <th className="p-2">Fulfillment</th>
              <th className="p-2">Tracking</th>
              <th className="p-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {list.map((o) => {
              const canDelete = o.payment_status === "pending" && o.fulfillment_status === "unfulfilled";
              const t = o.easypost_tracking_code || o.tracking_number;
              return (
                <tr key={o.id} className="border-t border-sky-100/50 dark:border-white/10">
                  <td className="p-2 whitespace-nowrap">#{o.id.slice(0, 8)}</td>
                  <td className="p-2 text-right">${o.total_amount}</td>
                  <td className="p-2">{o.payment_status}</td>
                  <td className="p-2">{o.fulfillment_status}</td>
                  <td className="p-2">
                    {t || o.tracking_url ? (
                      <span className="font-mono text-xs text-slate-600 dark:text-slate-300">
                        {t ? t.slice(0, 12) + (t.length > 12 ? "…" : "") : "Link"}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>
                  <td className="p-2">
                    <div className="flex flex-wrap justify-end gap-1">
                      <LuxuryButton
                        type="button"
                        variant="ghost"
                        className="!px-3 !py-1.5 text-xs"
                        onClick={() => {
                          setTrackId(o.id);
                          setTrackOpen(true);
                        }}
                      >
                        Track
                      </LuxuryButton>
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
                            if (trackId === o.id) {
                              setTrackOpen(false);
                              setTrackId(null);
                            }
                          }}
                        >
                          Delete
                        </LuxuryButton>
                      ) : null}
                    </div>
                  </td>
                </tr>
              );
            })}
            {list.length === 0 ? (
              <tr>
                <td className="p-3 text-slate-500" colSpan={6}>
                  No orders yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <GlassCard className="!p-3 text-xs text-slate-600 dark:text-slate-300">
        Use <strong>Track</strong> to see items, status updates, and shipping details. Notifications for order updates
        appear in the bell menu.
        <br />
        Orders can only be deleted before payment and before fulfillment begins.
      </GlassCard>

      <OrderTrackingModal
        open={trackOpen}
        orderId={trackId}
        isAdmin={false}
        onClose={() => {
          setTrackOpen(false);
          setTrackId(null);
          if (sp.get("o")) {
            r.replace("/dashboard/orders", { scroll: false });
          }
        }}
      />
    </div>
  );
}
