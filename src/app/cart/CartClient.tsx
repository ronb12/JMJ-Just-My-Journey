"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { LuxuryButton } from "@/components/ui/LuxuryButton";
import { PaymentSummarySheet } from "@/components/ui/PaymentSummarySheet";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

type Item = {
  id: string;
  product_id: string;
  quantity: number;
  name: string;
  price: string;
  image_url: string | null;
  stock_quantity: number;
  is_active: boolean;
};

export function CartClient() {
  const { data: s, status } = useSession();
  const r = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [total, setTotal] = useState("0");
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [ship, setShip] = useState({
    name: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    zip: "",
    phone: "",
  });

  const load = useCallback(() => {
    if (status === "unauthenticated") return;
    void fetch("/api/cart")
      .then((x) => x.json())
      .then((d) => {
        setItems((d.items as Item[]) || []);
      });
  }, [status]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (status !== "authenticated") return;
    try {
      if (typeof sessionStorage !== "undefined" && sessionStorage.getItem("jmj_cart_view_logged")) return;
      void fetch("/api/analytics/event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "cart_view" }),
      });
      sessionStorage.setItem("jmj_cart_view_logged", "1");
    } catch {
      /* ignore */
    }
  }, [status]);

  const lineTotal = (i: Item) => (parseFloat(i.price) * i.quantity).toFixed(2);
  const sum = items
    .reduce((a, i) => a + parseFloat(i.price) * i.quantity, 0)
    .toFixed(2);

  const startCheckout = useCallback(async () => {
    if (status === "unauthenticated") {
      r.push("/login?callbackUrl=/cart");
      return;
    }
    if (!s?.user) return;
    if (!items.length) return;
    setBusy(true);
    const res = await fetch("/api/orders/prepare-checkout", { method: "POST" });
    setBusy(false);
    if (!res.ok) {
      const e = (await res.json().catch(() => ({}))) as { error?: string };
      alert(e.error || "Could not create order");
      return;
    }
    const d = (await res.json()) as { orderId: string; total: string };
    setOrderId(d.orderId);
    setTotal(d.total);
    setOpen(true);
  }, [items.length, r, s?.user, status]);

  const pay = useCallback(async () => {
    if (!orderId || !s?.user?.email) return;
    if (!ship.name || !ship.line1 || !ship.city || !ship.state || !ship.zip) {
      alert("Please fill shipping fields");
      return;
    }
    setBusy(true);
    const res = await fetch("/api/stripe/create-store-checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderId,
        shipping: {
          name: ship.name,
          email: s.user.email,
          phone: ship.phone || null,
          line1: ship.line1,
          line2: ship.line2 || null,
          city: ship.city,
          state: ship.state,
          zip: ship.zip,
        },
      }),
    });
    setBusy(false);
    if (!res.ok) {
      const e = (await res.json().catch(() => ({}))) as { error?: string };
      alert(e.error || "Could not start payment");
      return;
    }
    const d = (await res.json()) as { url: string | null };
    if (d.url) window.location.href = d.url;
  }, [orderId, s, ship]);

  if (status === "unauthenticated") {
    return (
      <GlassCard className="mt-6">
        <p className="text-slate-600">Log in to use your bag.</p>
        <Link className="mt-3 inline-block" href="/login?callbackUrl=/cart">
          <LuxuryButton type="button">Log in</LuxuryButton>
        </Link>
      </GlassCard>
    );
  }

  if (!items.length) {
    return (
      <GlassCard className="mt-6">
        <p className="text-slate-600">Your bag is empty.</p>
        <Link className="mt-3 inline-block" href="/store">
          <LuxuryButton type="button" variant="teal">
            Browse the store
          </LuxuryButton>
        </Link>
      </GlassCard>
    );
  }

  return (
    <div className="mt-6 space-y-4">
      {items.map((i) => (
        <GlassCard key={i.id} className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-sky-50/50">
            {i.image_url ? (
              <Image
                src={i.image_url}
                alt={i.name}
                fill
                className="object-cover"
                unoptimized={i.image_url.startsWith("/")}
              />
            ) : null}
          </div>
          <div className="flex-1">
            <p className="font-medium text-slate-800">{i.name}</p>
            <p className="text-sm text-slate-500">
              ${i.price} each &middot; max {i.stock_quantity}
            </p>
            <div className="mt-1 flex items-center gap-2">
              <input
                type="number"
                className="w-16 rounded-lg border border-white/40 bg-white/50 px-1"
                min={1}
                value={i.quantity}
                onChange={async (e) => {
                  const q = Math.max(1, parseInt(e.target.value, 10) || 1);
                  await fetch("/api/cart", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ itemId: i.id, quantity: q }),
                  });
                  load();
                }}
              />
              <button
                type="button"
                className="text-sm text-rose-600"
                onClick={async () => {
                  await fetch("/api/cart?itemId=" + i.id, { method: "DELETE" });
                  load();
                }}
              >
                Remove
              </button>
            </div>
          </div>
          <p className="text-lg text-[#2563EB]">${lineTotal(i)}</p>
        </GlassCard>
      ))}
      <div className="flex justify-between text-lg">
        <span>Subtotal</span>
        <span className="text-[#1E3A8A]">${sum}</span>
      </div>
      <div className="space-y-2">
        <h2 className="font-serif text-xl">Shipping (for your records)</h2>
        {(
          [
            ["name", "Full name"],
            ["line1", "Address line 1"],
            ["line2", "Line 2 (optional)"],
            ["city", "City"],
            ["state", "State"],
            ["zip", "ZIP"],
            ["phone", "Phone (optional)"],
          ] as const
        ).map(([k, lab]) => (
          <div key={k}>
            <label className="text-xs text-slate-500">{lab}</label>
            <input
              className="mt-1 w-full rounded-2xl border border-white/40 bg-white/50 px-3 py-2"
              value={ship[k as keyof typeof ship]}
              onChange={(e) => setShip((o) => ({ ...o, [k]: e.target.value }))}
            />
          </div>
        ))}
      </div>
      <LuxuryButton type="button" onClick={startCheckout}>
        Go to payment summary
      </LuxuryButton>
      {s?.user && open && orderId ? (
        <PaymentSummarySheet
          open={open}
          onClose={() => setOpen(false)}
          title="Store order"
          lines={items.map((i) => ({
            label: i.name,
            sub: `${i.quantity} × $${i.price}`,
            amount: `$${lineTotal(i)}`,
          }))}
          total={`$${total}`}
          customer={{
            name: ship.name || s.user.name || "—",
            email: s.user.email || "—",
            phone: ship.phone,
          }}
          busy={busy}
          onContinue={pay}
        />
      ) : null}
    </div>
  );
}
