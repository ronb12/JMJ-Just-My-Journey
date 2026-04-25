"use client";

import { FloatingCard } from "@/components/ui/FloatingCard";
import { LuxuryButton } from "@/components/ui/LuxuryButton";
import { PaymentSummarySheet } from "@/components/ui/PaymentSummarySheet";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

type M = {
  id: string;
  name: string;
  monthly_price: string | null;
  description?: string | null;
  benefits?: string | null;
};

export function MembershipsClient({ memberships }: { memberships: M[] }) {
  const { data: s, status } = useSession();
  const r = useRouter();
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const [sel, setSel] = useState<{ id: string; name: string; price: string } | null>(null);

  const start = useCallback(
    async (m: M) => {
      if (status === "unauthenticated") {
        r.push("/login?callbackUrl=/memberships");
        return;
      }
      setBusy(true);
      const res = await fetch("/api/purchases/membership", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ membershipId: m.id }),
      });
      setBusy(false);
      if (!res.ok) {
        alert("Could not start");
        return;
      }
      const d = (await res.json()) as { id: string; total_amount: string };
      setSel({
        id: d.id,
        name: m.name,
        price: d.total_amount || String(m.monthly_price),
      });
      setOpen(true);
    },
    [r, status]
  );

  const pay = useCallback(async () => {
    if (!sel) return;
    setBusy(true);
    const res = await fetch("/api/stripe/create-membership-checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ purchaseId: sel.id }),
    });
    setBusy(false);
    if (!res.ok) {
      alert("Stripe is not configured or could not start subscription");
      return;
    }
    const d = (await res.json()) as { url: string | null };
    if (d.url) window.location.href = d.url;
  }, [sel]);

  return (
    <div className="mt-8 grid gap-4 md:grid-cols-2">
      {memberships.map((m, i) => (
        <FloatingCard key={m.id} delay={i * 0.04}>
          <h2 className="font-serif text-2xl text-sky-900">{m.name}</h2>
          {m.description ? <p className="mt-2 text-slate-600">{m.description}</p> : null}
          {m.benefits ? <p className="mt-2 text-sm text-slate-500">{m.benefits}</p> : null}
          <p className="mt-3 text-2xl text-[#2563EB]">
            {m.monthly_price != null ? `$${m.monthly_price}/mo` : "—"}
          </p>
          <LuxuryButton
            className="mt-4"
            type="button"
            disabled={busy}
            onClick={() => void start(m)}
          >
            Subscribe
          </LuxuryButton>
        </FloatingCard>
      ))}
      {s?.user && sel ? (
        <PaymentSummarySheet
          open={open}
          onClose={() => setOpen(false)}
          title="Membership"
          lines={[{ label: sel.name, sub: "Billed monthly via Stripe", amount: `$${sel.price}/mo` }]}
          total={`$${sel.price}/mo`}
          customer={{ name: s.user.name || "—", email: s.user.email || "—" }}
          busy={busy}
          onContinue={pay}
        />
      ) : null}
    </div>
  );
}
