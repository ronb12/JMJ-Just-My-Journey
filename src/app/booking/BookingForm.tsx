"use client";

import { PaymentSummarySheet } from "@/components/ui/PaymentSummarySheet";
import { BookingStepCard } from "@/components/ui/BookingStepCard";
import { LuxuryButton } from "@/components/ui/LuxuryButton";
import { useSession } from "next-auth/react";
import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type S = { id: string; name: string; price: string | null; description: string | null; duration_minutes: number | null };
type P = { id: string; name: string | null };

export function BookingForm({ services, providers }: { services: S[]; providers: P[] }) {
  const { data: s, status } = useSession();
  const r = useRouter();
  const [serviceId, setServiceId] = useState(services[0]?.id || "");
  const [providerId, setProviderId] = useState<string | "">(providers[0]?.id || "");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("10:00");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [appt, setAppt] = useState<{
    id: string;
    price: string;
    serviceName: string;
  } | null>(null);

  const service = useMemo(
    () => services.find((x) => x.id === serviceId),
    [services, serviceId]
  );

  const onConfirm = useCallback(async () => {
    if (status === "unauthenticated") {
      r.push("/login?callbackUrl=/booking");
      return;
    }
    if (!serviceId || !date || !time) return;
    setBusy(true);
    const res = await fetch("/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        serviceId,
        providerId: providerId || null,
        appointmentDate: date,
        appointmentTime: time,
        notes: notes || null,
      }),
    });
    setBusy(false);
    if (!res.ok) {
      const e = await res.json().catch(() => ({}));
      alert((e as { error?: string }).error || "Could not create booking");
      return;
    }
    const d = (await res.json()) as { appointment: { id: string; total_amount: string } };
    setAppt({
      id: d.appointment.id,
      price: d.appointment.total_amount,
      serviceName: service?.name || "Service",
    });
    setSheet(true);
  }, [date, time, serviceId, providerId, notes, r, service, status]);

  const pay = useCallback(async () => {
    if (!appt) return;
    setBusy(true);
    const res = await fetch("/api/stripe/create-booking-checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ appointmentId: appt.id }),
    });
    setBusy(false);
    if (!res.ok) {
      const e = await res.json().catch(() => ({}));
      alert((e as { error?: string }).error || "Stripe not configured or payment failed to start");
      return;
    }
    const d = (await res.json()) as { url: string | null };
    if (d.url) {
      window.location.href = d.url;
    }
  }, [appt]);

  return (
    <div className="mt-8 max-w-2xl space-y-4">
      <BookingStepCard step={1} title="Service" active>
        <label className="mt-1 block text-sm text-slate-600">Service</label>
        <select
          className="mt-1 w-full rounded-2xl border border-white/40 bg-white/50 px-3 py-2 backdrop-blur"
          value={serviceId}
          onChange={(e) => setServiceId(e.target.value)}
        >
          {services.map((x) => (
            <option key={x.id} value={x.id}>
              {x.name} {x.price != null ? `— $${x.price}` : ""}
            </option>
          ))}
        </select>
      </BookingStepCard>
      <BookingStepCard step={2} title="Provider" done={Boolean(providerId || providers.length === 0)}>
        <label className="mt-1 block text-sm text-slate-600">Provider (optional)</label>
        <select
          className="mt-1 w-full rounded-2xl border border-white/40 bg-white/50 px-3 py-2"
          value={providerId}
          onChange={(e) => setProviderId(e.target.value)}
        >
          <option value="">No preference</option>
          {providers.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </BookingStepCard>
      <BookingStepCard
        step={3}
        title="Date & time"
        done={Boolean(date && time)}
        active
      >
        <div className="grid gap-2 sm:grid-cols-2">
          <div>
            <label className="text-sm text-slate-600">Date</label>
            <input
              type="date"
              className="mt-1 w-full rounded-2xl border border-white/40 bg-white/50 px-3 py-2"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm text-slate-600">Time</label>
            <input
              type="time"
              className="mt-1 w-full rounded-2xl border border-white/40 bg-white/50 px-3 py-2"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>
        </div>
      </BookingStepCard>
      <BookingStepCard step={4} title="Notes">
        <textarea
          className="mt-1 w-full rounded-2xl border border-white/40 bg-white/50 px-3 py-2"
          rows={3}
          placeholder="Allergies, preferences, goals…"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </BookingStepCard>
      <div className="pt-2">
        <LuxuryButton type="button" disabled={busy} onClick={onConfirm}>
          {status === "unauthenticated" ? "Log in to continue" : "Review & pay"}
        </LuxuryButton>
      </div>
      {s?.user && appt ? (
        <PaymentSummarySheet
          open={sheet}
          onClose={() => setSheet(false)}
          title="Your booking"
          lines={[
            { label: appt.serviceName, sub: "Spa service", amount: `$${appt.price}` },
          ]}
          total={`$${appt.price}`}
          customer={{ name: s.user.name || "—", email: s.user.email || "—" }}
          busy={busy}
          onContinue={pay}
        />
      ) : null}
    </div>
  );
}
