"use client";

import { FloatingCard } from "@/components/ui/FloatingCard";
import { LuxuryButton } from "@/components/ui/LuxuryButton";
import { PaymentSummarySheet } from "@/components/ui/PaymentSummarySheet";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useCallback } from "react";

type P = {
  id: string;
  name: string;
  price: string | null;
  description?: string | null;
};

export function PackagesClient({ packages }: { packages: P[] }) {
  const { data: s, status } = useSession();
  const r = useRouter();
  const [busy, setBusy] = useState(false);
  const [sel, setSel] = useState<{
    id: string;
    name: string;
    price: string;
  } | null>(null);
  const [open, setOpen] = useState(false);

  const start = useCallback(
    async (p: P) => {
      if (status === "unauthenticated") {
        r.push("/login?callbackUrl=/packages");
        return;
      }
      setBusy(true);
      const res = await fetch("/api/purchases/package", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId: p.id }),
      });
      setBusy(false);
      if (!res.ok) {
        alert("Could not start purchase");
        return;
      }
      const d = (await res.json()) as { id: string; total_amount: string };
      setSel({ id: d.id, name: p.name, price: d.total_amount || String(p.price) });
      setOpen(true);
    },
    [r, status]
  );

  const pay = useCallback(async () => {
    if (!sel) return;
    setBusy(true);
    const res = await fetch("/api/stripe/create-package-checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ purchaseId: sel.id }),
    });
    setBusy(false);
    if (!res.ok) {
      alert("Stripe is not configured or request failed");
      return;
    }
    const d = (await res.json()) as { url: string | null };
    if (d.url) window.location.href = d.url;
  }, [sel]);

  return (
    <div className="mt-8 grid gap-4 md:grid-cols-2">
      {packages.map((p, i) => (
        <FloatingCard key={p.id} delay={i * 0.04}>
          <h2 className="font-serif text-2xl text-sky-900">{p.name}</h2>
          {p.description ? <p className="mt-2 text-slate-600">{p.description}</p> : null}
          <p className="mt-3 text-2xl text-[#2563EB]">
            {p.price != null ? `$${p.price}` : "—"}
          </p>
          <LuxuryButton
            className="mt-4"
            type="button"
            disabled={busy}
            onClick={() => void start(p)}
          >
            Purchase
          </LuxuryButton>
        </FloatingCard>
      ))}
      {s?.user && sel ? (
        <PaymentSummarySheet
          open={open}
          onClose={() => setOpen(false)}
          title="Package purchase"
          lines={[{ label: sel.name, amount: `$${sel.price}` }]}
          total={`$${sel.price}`}
          customer={{ name: s.user.name || "—", email: s.user.email || "—" }}
          busy={busy}
          onContinue={pay}
        />
      ) : null}
    </div>
  );
}
