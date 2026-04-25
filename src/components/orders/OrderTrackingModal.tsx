"use client";

import { LuxuryButton } from "@/components/ui/LuxuryButton";
import { Modal } from "@/components/ui/Modal";
import { useCallback, useEffect, useState } from "react";

type Item = { id: string; product_name: string | null; quantity: number; line_total: string | null };
type Event = {
  id: string;
  message: string;
  source: string;
  created_at: string;
  fulfillment_status: string | null;
};
type Order = {
  id: string;
  total_amount: string;
  payment_status: string;
  fulfillment_status: string;
  created_at: string;
  updated_at?: string;
  shipping_name?: string | null;
  shipping_address_line1?: string | null;
  shipping_city?: string | null;
  shipping_state?: string | null;
  shipping_zip?: string | null;
  easypost_tracking_code?: string | null;
  easypost_label_url?: string | null;
  tracking_carrier?: string | null;
  tracking_number?: string | null;
  tracking_url?: string | null;
};

function fmtTime(s: string) {
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? s : d.toLocaleString();
}

export function OrderTrackingModal({
  open,
  orderId,
  isAdmin,
  onClose,
  onUpdated,
}: {
  open: boolean;
  orderId: string | null;
  isAdmin: boolean;
  onClose: () => void;
  onUpdated?: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [err, setErr] = useState("");

  const [carrier, setCarrier] = useState("");
  const [trk, setTrk] = useState("");
  const [url, setUrl] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!orderId) return;
    setLoading(true);
    setErr("");
    const res = await fetch(`/api/orders/${orderId}`);
    setLoading(false);
    if (!res.ok) {
      setErr("Could not load order");
      return;
    }
    const d = (await res.json()) as { order: Order; items: Item[]; events?: Event[] };
    setOrder(d.order);
    setItems(d.items || []);
    setEvents(d.events || []);
    setCarrier(d.order.tracking_carrier || "");
    setTrk(d.order.tracking_number || "");
    setUrl(d.order.tracking_url || "");
    setNote("");
  }, [orderId]);

  useEffect(() => {
    if (open && orderId) void load();
    if (!open) {
      setOrder(null);
      setItems([]);
      setEvents([]);
      setErr("");
    }
  }, [open, orderId, load]);

  const displayTracking = order?.easypost_tracking_code || order?.tracking_number || "";
  const trackLink = order?.tracking_url?.trim() || null;

  return (
    <Modal
      open={open && Boolean(orderId)}
      title={order ? `Order #${order.id.slice(0, 8)}` : "Order tracking"}
      onClose={onClose}
      className="max-w-2xl"
    >
      {loading ? <p className="text-sm text-slate-600 dark:text-slate-300">Loading…</p> : null}
      {err ? <p className="text-sm text-red-600 dark:text-red-400">{err}</p> : null}
      {order && !loading ? (
        <div className="space-y-4 text-sm">
          <div className="jmj-field-block">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Summary</p>
            <p className="mt-1 text-slate-800 dark:text-slate-100">
              Total <span className="font-medium">${order.total_amount}</span> · Payment{" "}
              <span className="font-medium">{order.payment_status}</span> · Fulfillment{" "}
              <span className="font-medium">{order.fulfillment_status}</span>
            </p>
            {order.shipping_name || order.shipping_address_line1 ? (
              <p className="mt-2 text-xs text-slate-500">
                Ship to:{" "}
                {[order.shipping_name, order.shipping_address_line1, order.shipping_city, order.shipping_state, order.shipping_zip]
                  .filter(Boolean)
                  .join(", ")}
              </p>
            ) : null}
          </div>

          {items.length > 0 ? (
            <div>
              <p className="jmj-label">Items</p>
              <div className="mt-1 overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900">
                <table className="w-full min-w-[320px] text-left text-xs">
                  <thead className="bg-sky-50/50 text-slate-600 dark:bg-slate-800/70 dark:text-slate-200">
                    <tr>
                      <th className="p-2">Product</th>
                      <th className="p-2">Qty</th>
                      <th className="p-2 text-right">Line</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((it) => (
                      <tr key={it.id} className="border-t border-sky-100/50 dark:border-white/10">
                        <td className="p-2">{it.product_name || "—"}</td>
                        <td className="p-2">{it.quantity}</td>
                        <td className="p-2 text-right">${it.line_total ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}

          <div className="jmj-field-block">
            <p className="jmj-label">Tracking</p>
            {displayTracking ? (
              <p className="mt-1 font-mono text-sm text-slate-900 dark:text-slate-100">{displayTracking}</p>
            ) : (
              <p className="jmj-help !mt-1">No tracking number yet.</p>
            )}
            {order.easypost_label_url && isAdmin ? (
              <a
                className="mt-2 inline-block text-xs font-medium text-[#2563EB] hover:underline"
                href={order.easypost_label_url}
                target="_blank"
                rel="noreferrer"
              >
                Open shipping label
              </a>
            ) : null}
            {trackLink ? (
              <div className="mt-2">
                <a
                  className="text-xs font-medium text-[#2563EB] hover:underline"
                  href={trackLink}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open carrier tracking page
                </a>
              </div>
            ) : null}
          </div>

          <div>
            <p className="jmj-label">Activity</p>
            {events.length === 0 ? (
              <p className="jmj-help !mt-1">No updates yet. You’ll see notes here as your order moves.</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {events.map((e) => (
                  <li
                    key={e.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-950/60"
                  >
                    <p className="text-xs text-slate-500 dark:text-slate-400">{fmtTime(e.created_at)}</p>
                    <p className="text-slate-800 dark:text-slate-100">{e.message}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {isAdmin ? (
            <div className="space-y-3 border-t border-slate-200 pt-3 dark:border-white/10">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Update tracking</p>
              <div className="jmj-field-block">
                <label className="jmj-label">Carrier (e.g. USPS, UPS)</label>
                <input className="jmj-input" value={carrier} onChange={(e) => setCarrier(e.target.value)} />
              </div>
              <div className="jmj-field-block">
                <label className="jmj-label">Tracking # (manual — separate from EasyPost auto)</label>
                <input className="jmj-input font-mono text-xs" value={trk} onChange={(e) => setTrk(e.target.value)} />
              </div>
              <div className="jmj-field-block">
                <label className="jmj-label">Public tracking URL (optional)</label>
                <input
                  className="jmj-input"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://…"
                />
                <p className="jmj-help">Customers get a &quot;Track package&quot; link from this field.</p>
              </div>
              <div className="jmj-field-block">
                <label className="jmj-label">Message to customer (optional)</label>
                <textarea
                  className="jmj-textarea"
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Short update shown in their timeline and notification…"
                />
              </div>
              <div className="flex justify-end">
                <LuxuryButton
                  type="button"
                  disabled={saving}
                  onClick={async () => {
                    if (!orderId) return;
                    setSaving(true);
                    const res = await fetch(`/api/orders/${orderId}`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        tracking_carrier: carrier.trim() || null,
                        tracking_number: trk.trim() || null,
                        tracking_url: url.trim() || null,
                        customer_message: note.trim() || null,
                      }),
                    });
                    setSaving(false);
                    if (!res.ok) {
                      const j = (await res.json().catch(() => ({}))) as { error?: string };
                      alert(j.error || "Could not save");
                      return;
                    }
                    setNote("");
                    void load();
                    onUpdated?.();
                  }}
                >
                  {saving ? "Saving…" : "Save tracking & notify customer"}
                </LuxuryButton>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </Modal>
  );
}
