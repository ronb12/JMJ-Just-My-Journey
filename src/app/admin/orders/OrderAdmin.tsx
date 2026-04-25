"use client";

import { OrderTrackingModal } from "@/components/orders/OrderTrackingModal";
import { GlassCard } from "@/components/ui/GlassCard";
import { LuxuryButton } from "@/components/ui/LuxuryButton";
import { Modal } from "@/components/ui/Modal";
import { useRouter } from "next/navigation";
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
  shipping_name?: string | null;
  shipping_email?: string | null;
  shipping_phone?: string | null;
  shipping_address_line1?: string | null;
  shipping_address_line2?: string | null;
  shipping_city?: string | null;
  shipping_state?: string | null;
  shipping_zip?: string | null;
  easypost_label_url?: string | null;
  easypost_tracking_code?: string | null;
  tracking_carrier?: string | null;
  tracking_number?: string | null;
  tracking_url?: string | null;
};

export function OrderAdmin({ rows }: { rows: unknown[] }) {
  const r = useRouter();
  const [list, setList] = useState<Row[]>(rows as Row[]);
  const [adminTrackId, setAdminTrackId] = useState<string | null>(null);
  const [adminTrackOpen, setAdminTrackOpen] = useState(false);
  const [shipOpen, setShipOpen] = useState(false);
  const [shipOrder, setShipOrder] = useState<Row | null>(null);
  const [busy, setBusy] = useState(false);
  const [rates, setRates] = useState<
    { id: string; carrier: string; service: string; rate: string; currency: string; delivery_days: number | null }[]
  >([]);
  const [shipmentId, setShipmentId] = useState<string | null>(null);
  const [err, setErr] = useState("");

  return (
    <div className="mt-4 space-y-2">
      {list.length === 0 ? (
        <GlassCard className="text-sm text-slate-600 dark:text-slate-200">
          No orders yet. Use “New manual order” to create one, or place a store order to see it here.
        </GlassCard>
      ) : null}
      {list.map((o) => (
        <GlassCard key={o.id} className="!p-3 text-sm">
          <p>
            {o.user_name} &lt;{o.email}&gt;
          </p>
          <p>
            Order #{o.id.slice(0, 8)} | ${o.total_amount} | pay: {o.payment_status}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <LuxuryButton
              type="button"
              variant="ghost"
              className="!px-3 !py-1.5 text-xs"
              onClick={() => {
                setAdminTrackId(o.id);
                setAdminTrackOpen(true);
              }}
            >
              Tracking
            </LuxuryButton>
            {o.easypost_label_url ? (
              <>
                <a
                  className="text-xs font-medium text-[#2563EB] hover:underline"
                  href={o.easypost_label_url}
                  target="_blank"
                  rel="noreferrer"
                >
                  Print label
                </a>
                {o.easypost_tracking_code ? (
                  <span className="text-xs text-slate-500">Tracking: {o.easypost_tracking_code}</span>
                ) : null}
              </>
            ) : (
              <LuxuryButton
                type="button"
                variant="ghost"
                className="!px-3 !py-1.5 text-xs"
                onClick={() => {
                  setShipOrder(o);
                  setShipOpen(true);
                  setRates([]);
                  setShipmentId(null);
                  setErr("");
                }}
              >
                Create label
              </LuxuryButton>
            )}
          </div>
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

      <OrderTrackingModal
        open={adminTrackOpen}
        orderId={adminTrackId}
        isAdmin
        onClose={() => {
          setAdminTrackOpen(false);
          setAdminTrackId(null);
        }}
        onUpdated={() => {
          r.refresh();
        }}
      />

      <Modal
        open={shipOpen && Boolean(shipOrder)}
        title="Create shipping label (EasyPost)"
        onClose={() => {
          setShipOpen(false);
          setShipOrder(null);
          setRates([]);
          setShipmentId(null);
          setErr("");
          setBusy(false);
        }}
      >
        {shipOrder ? (
          <div className="space-y-3 text-sm">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-slate-950">
              <p className="font-medium text-slate-800 dark:text-slate-100">Order #{shipOrder.id.slice(0, 8)}</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Ship to:{" "}
                {shipOrder.shipping_name && shipOrder.shipping_address_line1
                  ? `${shipOrder.shipping_name}, ${shipOrder.shipping_address_line1}, ${shipOrder.shipping_city}, ${shipOrder.shipping_state} ${shipOrder.shipping_zip}`
                  : "Missing shipping address"}
              </p>
            </div>

            <form
              className="jmj-field-block space-y-3"
              onSubmit={async (e) => {
                e.preventDefault();
                if (!shipOrder) return;
                setErr("");
                setBusy(true);
                const fd = new FormData(e.currentTarget);
                const res = await fetch("/api/admin/shipping/easypost?action=rates", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    orderId: shipOrder.id,
                    parcel: {
                      weightOz: fd.get("weightOz"),
                      lengthIn: fd.get("lengthIn") || undefined,
                      widthIn: fd.get("widthIn") || undefined,
                      heightIn: fd.get("heightIn") || undefined,
                    },
                  }),
                });
                setBusy(false);
                if (!res.ok) {
                  const j = (await res.json().catch(() => ({}))) as { error?: string };
                  setErr(j.error || "Could not get rates");
                  return;
                }
                const j = (await res.json().catch(() => ({}))) as {
                  shipmentId?: string;
                  rates?: {
                    id: string;
                    carrier: string;
                    service: string;
                    rate: string;
                    currency: string;
                    delivery_days: number | null;
                  }[];
                };
                setShipmentId(j.shipmentId || null);
                setRates(j.rates || []);
              }}
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="jmj-label">Weight (oz)</label>
                  <input name="weightOz" className="jmj-input" placeholder="16" required inputMode="decimal" />
                </div>
                <div>
                  <label className="jmj-label">Length (in)</label>
                  <input name="lengthIn" className="jmj-input" placeholder="10" inputMode="decimal" />
                </div>
                <div>
                  <label className="jmj-label">Width (in)</label>
                  <input name="widthIn" className="jmj-input" placeholder="6" inputMode="decimal" />
                </div>
                <div>
                  <label className="jmj-label">Height (in)</label>
                  <input name="heightIn" className="jmj-input" placeholder="4" inputMode="decimal" />
                </div>
              </div>
              <div className="flex justify-end">
                <LuxuryButton type="submit" disabled={busy}>
                  {busy ? "Loading…" : "Get rates"}
                </LuxuryButton>
              </div>
            </form>

            {rates.length ? (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Rates</p>
                <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900">
                  <table className="w-full min-w-[520px] text-left text-sm">
                    <thead className="bg-sky-50/50 text-slate-600 dark:bg-slate-800/70 dark:text-slate-200">
                      <tr>
                        <th className="p-2">Carrier</th>
                        <th className="p-2">Service</th>
                        <th className="p-2 whitespace-nowrap">ETA</th>
                        <th className="p-2 whitespace-nowrap">Price</th>
                        <th className="p-2 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rates.map((r) => (
                        <tr key={r.id} className="border-t border-sky-100/50 dark:border-white/10">
                          <td className="p-2">{r.carrier}</td>
                          <td className="p-2">{r.service}</td>
                          <td className="p-2 text-xs text-slate-500">
                            {r.delivery_days ? `${r.delivery_days} days` : "—"}
                          </td>
                          <td className="p-2 whitespace-nowrap">
                            {r.currency} {r.rate}
                          </td>
                          <td className="p-2">
                            <div className="flex justify-end">
                              <LuxuryButton
                                type="button"
                                className="!px-3 !py-1.5 text-xs"
                                disabled={busy || !shipmentId}
                                onClick={async () => {
                                  if (!shipOrder || !shipmentId) return;
                                  setErr("");
                                  setBusy(true);
                                  const res = await fetch("/api/admin/shipping/easypost?action=buy", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({
                                      orderId: shipOrder.id,
                                      shipmentId,
                                      rateId: r.id,
                                    }),
                                  });
                                  setBusy(false);
                                  if (!res.ok) {
                                    const j = (await res.json().catch(() => ({}))) as { error?: string };
                                    setErr(j.error || "Could not buy label");
                                    return;
                                  }
                                  const j = (await res.json().catch(() => ({}))) as {
                                    labelUrl?: string;
                                    trackingCode?: string | null;
                                  };
                                  setList((prev) =>
                                    prev.map((p) =>
                                      p.id === shipOrder.id
                                        ? {
                                            ...p,
                                            easypost_label_url: j.labelUrl || null,
                                            easypost_tracking_code: j.trackingCode || null,
                                          }
                                        : p
                                    )
                                  );
                                  if (j.labelUrl) window.open(j.labelUrl, "_blank", "noopener,noreferrer");
                                  setShipOpen(false);
                                  setShipOrder(null);
                                  setRates([]);
                                  setShipmentId(null);
                                }}
                              >
                                {busy ? "Buying…" : "Buy & print"}
                              </LuxuryButton>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}

            {err ? <p className="text-sm text-red-600 dark:text-red-400">{err}</p> : null}
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Configure <code>EASYPOST_API_KEY</code> and ship-from in{" "}
              <strong>Admin → Settings → EasyPost &amp; shipping</strong>, or set the same in your host env (e.g. Vercel).
            </p>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
