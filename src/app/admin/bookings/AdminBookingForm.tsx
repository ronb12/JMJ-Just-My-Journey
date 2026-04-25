"use client";

import { LuxuryButton } from "@/components/ui/LuxuryButton";
import { Modal } from "@/components/ui/Modal";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Customer = { id: string; name: string | null; email: string };
type Service = { id: string; name: string; price: string | null };
type Provider = { id: string; name: string | null };

const labelCls = "text-sm font-medium text-slate-700";
const inputCls = "mt-1 w-full rounded-2xl border border-white/40 bg-white/50 px-3 py-2 text-sm";

export function AdminBookingForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    void fetch("/api/admin/customers").then((r) => r.json()).then((d) => setCustomers(d.customers ?? []));
    void fetch("/api/services").then((r) => r.json()).then((d) => setServices(d.services ?? []));
    void fetch("/api/providers").then((r) => r.json()).then((d) => setProviders(d.providers ?? []));
  }, [open]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/admin/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: fd.get("userId"),
        serviceId: fd.get("serviceId"),
        providerId: fd.get("providerId") || null,
        appointmentDate: fd.get("appointmentDate"),
        appointmentTime: fd.get("appointmentTime"),
        paymentStatus: fd.get("paymentStatus"),
        notes: fd.get("notes") || null,
      }),
    });
    setBusy(false);
    if (res.ok) {
      setOpen(false);
      router.refresh();
    } else {
      const d = await res.json().catch(() => ({}));
      setError((d as { error?: string }).error ?? "Failed to create booking");
    }
  }

  return (
    <div className="mb-4">
      <LuxuryButton type="button" onClick={() => setOpen(true)}>
        + New Booking
      </LuxuryButton>
      <Modal
        open={open}
        title="Create booking"
        onClose={() => {
          setOpen(false);
          setError("");
        }}
      >
        <form className="max-w-xl space-y-3" onSubmit={handleSubmit}>
          <div>
            <label className={labelCls}>Customer</label>
            <select name="userId" required className={inputCls}>
              <option value="">Select customer…</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name ? `${c.name} (${c.email})` : c.email}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Service</label>
            <select name="serviceId" required className={inputCls}>
              <option value="">Select service…</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                  {s.price ? ` — $${s.price}` : ""}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Provider (optional)</label>
            <select name="providerId" className={inputCls}>
              <option value="">Any provider</option>
              {providers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Date</label>
              <input name="appointmentDate" type="date" required className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Time</label>
              <input name="appointmentTime" type="time" defaultValue="10:00" required className={inputCls} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Payment status</label>
            <select name="paymentStatus" className={inputCls}>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Notes (optional)</label>
            <textarea name="notes" rows={2} className={inputCls} placeholder="Allergies, preferences…" />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <LuxuryButton type="submit" disabled={busy}>
            {busy ? "Creating…" : "Create booking"}
          </LuxuryButton>
        </form>
      </Modal>
    </div>
  );
}
