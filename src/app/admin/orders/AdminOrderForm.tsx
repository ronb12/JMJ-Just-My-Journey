"use client";

import { LuxuryButton } from "@/components/ui/LuxuryButton";
import { Modal } from "@/components/ui/Modal";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Customer = { id: string; name: string | null; email: string };
type Product = { id: string; name: string; price: string | null; is_active?: boolean };
type ItemDraft = { productId: string; name: string; quantity: string; unitPrice: string };

export function AdminOrderForm() {
  const r = useRouter();
  const [open, setOpen] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [items, setItems] = useState<ItemDraft[]>([
    { productId: "", name: "", quantity: "1", unitPrice: "0.00" },
  ]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    void fetch("/api/admin/customers")
      .then((res) => res.json())
      .then((d) => setCustomers((d.customers as Customer[]) || []))
      .catch(() => setCustomers([]));

    void fetch("/api/products")
      .then((res) => res.json())
      .then((d) => setProducts((d.products as Product[]) || []))
      .catch(() => setProducts([]));
  }, [open]);

  const total = items.reduce((sum, it) => {
    const q = parseInt(it.quantity || "0", 10) || 0;
    const p = parseFloat(it.unitPrice || "0") || 0;
    return sum + q * p;
  }, 0);

  return (
    <div className="mb-4">
      <LuxuryButton type="button" onClick={() => setOpen(true)}>
        + New manual order
      </LuxuryButton>
      <Modal
        open={open}
        title="Create manual order"
        onClose={() => {
          setOpen(false);
          setError("");
        }}
      >
        <form
          className="max-w-xl space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            setError("");
            setBusy(true);
            const fd = new FormData(e.currentTarget);
            const res = await fetch("/api/admin/orders", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userId: fd.get("userId"),
                paymentStatus: fd.get("paymentStatus"),
                fulfillmentStatus: fd.get("fulfillmentStatus"),
                items: items
                  .filter((it) => (parseInt(it.quantity || "0", 10) || 0) > 0 && (it.name || "").trim())
                  .map((it) => ({
                    productId: it.productId ? it.productId : null,
                    name: it.name.trim(),
                    quantity: parseInt(it.quantity || "0", 10) || 1,
                    unitPrice: parseFloat(it.unitPrice || "0") || 0,
                  })),
              }),
            });
            setBusy(false);
            if (!res.ok) {
              const j = (await res.json().catch(() => ({}))) as { error?: string };
              setError(j.error || "Could not create order");
              return;
            }
            (e.currentTarget as HTMLFormElement).reset();
            setItems([{ productId: "", name: "", quantity: "1", unitPrice: "0.00" }]);
            setOpen(false);
            r.refresh();
          }}
        >
          <div className="jmj-field-block">
            <label className="jmj-label">Customer</label>
            <select name="userId" required className="jmj-select">
              <option value="">Select customer…</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name ? `${c.name} (${c.email})` : c.email}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-slate-950">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-slate-800 dark:text-slate-100">Line items</p>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Total: <span className="font-semibold">${total.toFixed(2)}</span>
              </p>
            </div>
            <div className="mt-3 space-y-3">
              {items.map((it, idx) => (
                <div key={idx} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-slate-900 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="jmj-label">Product (optional)</label>
                    <select
                      className="jmj-select"
                      value={it.productId}
                      onChange={(e) => {
                        const pid = e.target.value;
                        const p = products.find((pp) => pp.id === pid) || null;
                        setItems((prev) =>
                          prev.map((row, i) =>
                            i === idx
                              ? {
                                  ...row,
                                  productId: pid,
                                  name: p?.name || row.name,
                                  unitPrice: p?.price ? String(p.price) : row.unitPrice,
                                }
                              : row
                          )
                        );
                      }}
                    >
                      <option value="">Custom item…</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} {p.price ? `($${p.price})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="jmj-label">Item name</label>
                    <input
                      className="jmj-input"
                      value={it.name}
                      onChange={(e) =>
                        setItems((prev) => prev.map((row, i) => (i === idx ? { ...row, name: e.target.value } : row)))
                      }
                      placeholder="Example: Lavender Body Oil"
                      required
                    />
                  </div>
                  <div>
                    <label className="jmj-label">Qty</label>
                    <input
                      className="jmj-input"
                      value={it.quantity}
                      onChange={(e) =>
                        setItems((prev) =>
                          prev.map((row, i) => (i === idx ? { ...row, quantity: e.target.value } : row))
                        )
                      }
                      inputMode="numeric"
                      placeholder="1"
                      required
                    />
                  </div>
                  <div>
                    <label className="jmj-label">Unit price</label>
                    <input
                      className="jmj-input"
                      value={it.unitPrice}
                      onChange={(e) =>
                        setItems((prev) =>
                          prev.map((row, i) => (i === idx ? { ...row, unitPrice: e.target.value } : row))
                        )
                      }
                      inputMode="decimal"
                      placeholder="0.00"
                      required
                    />
                  </div>
                  <div className="sm:col-span-2 flex justify-end">
                    <LuxuryButton
                      type="button"
                      variant="ghost"
                      className="!px-3 !py-1.5 text-xs"
                      onClick={() => setItems((prev) => prev.filter((_, i) => i !== idx))}
                      disabled={items.length === 1}
                    >
                      Remove
                    </LuxuryButton>
                  </div>
                </div>
              ))}
              <LuxuryButton
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => setItems((prev) => [...prev, { productId: "", name: "", quantity: "1", unitPrice: "0.00" }])}
              >
                + Add item
              </LuxuryButton>
              <p className="jmj-help">
                Tip: selecting a product will auto-fill name and price, but you can still edit them.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="jmj-field-block">
              <label className="jmj-label">Payment status</label>
              <select name="paymentStatus" className="jmj-select" defaultValue="pending">
                <option value="pending">pending</option>
                <option value="paid">paid</option>
                <option value="failed">failed</option>
                <option value="cancelled">cancelled</option>
              </select>
            </div>
            <div className="jmj-field-block">
              <label className="jmj-label">Fulfillment</label>
              <select name="fulfillmentStatus" className="jmj-select" defaultValue="unfulfilled">
                <option value="unfulfilled">unfulfilled</option>
                <option value="processing">processing</option>
                <option value="shipped">shipped</option>
                <option value="delivered">delivered</option>
                <option value="cancelled">cancelled</option>
              </select>
            </div>
          </div>

          {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}

          <div className="flex justify-end">
            <LuxuryButton type="submit" disabled={busy}>
              {busy ? "Creating…" : "Create order"}
            </LuxuryButton>
          </div>
        </form>
      </Modal>
    </div>
  );
}

