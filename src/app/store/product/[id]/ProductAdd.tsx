"use client";

import { LuxuryButton } from "@/components/ui/LuxuryButton";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function ProductAdd({ productId }: { productId: string }) {
  const { status } = useSession();
  const r = useRouter();
  const [qty, setQty] = useState(1);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <div className="mt-6">
      <div className="flex items-center gap-2">
        <label className="text-sm">Qty</label>
        <input
          type="number"
          min={1}
          className="w-20 rounded-xl border border-white/40 bg-white/50 px-2 py-1"
          value={qty}
          onChange={(e) => setQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
        />
      </div>
      <div className="mt-3">
        <LuxuryButton
          type="button"
          disabled={busy}
          onClick={async () => {
            if (status === "unauthenticated") {
              r.push("/login?callbackUrl=" + encodeURIComponent("/store/product/" + productId));
              return;
            }
            setBusy(true);
            setMsg(null);
            const res = await fetch("/api/cart", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ productId, quantity: qty }),
            });
            setBusy(false);
            if (!res.ok) {
              const e = (await res.json().catch(() => ({}))) as { error?: string };
              setMsg(e.error || "Could not add");
              return;
            }
            setMsg("Added to your bag");
            r.refresh();
          }}
        >
          {busy ? "Adding…" : "Add to bag"}
        </LuxuryButton>
        {msg ? <p className="mt-2 text-sm text-[#14B8A6]">{msg}</p> : null}
      </div>
    </div>
  );
}
