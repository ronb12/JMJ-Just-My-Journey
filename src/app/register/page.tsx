"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { LuxuryButton } from "@/components/ui/LuxuryButton";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";

function Form() {
  const sp = useSearchParams();
  const r = useRouter();
  const cb = sp.get("callbackUrl") || "/dashboard";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postal, setPostal] = useState("");
  const [country, setCountry] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <GlassCard className="mx-auto max-w-md">
      <h1 className="font-serif text-3xl text-[#1E3A8A]">Create account</h1>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Join JMJ and start planning your self-care.</p>
      <form
        className="mt-4 space-y-3"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setErr(null);
          const res = await fetch("/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name,
              email,
              password,
              phone: phone || undefined,
              address_line1: line1.trim() || undefined,
              address_line2: line2.trim() || undefined,
              city: city.trim() || undefined,
              state: state.trim() || undefined,
              postal_code: postal.trim() || undefined,
              country: country.trim() || undefined,
            }),
          });
          if (!res.ok) {
            const j = (await res.json().catch(() => ({}))) as { error?: string };
            setErr(j.error || "Could not register");
            setBusy(false);
            return;
          }
          const s = await signIn("credentials", {
            email,
            password,
            redirect: false,
            callbackUrl: cb,
          });
          if (s?.error) {
            setErr("Account created. Please sign in.");
            setBusy(false);
            return;
          }
          r.push(s?.url || cb);
        }}
      >
        <div className="jmj-field-block">
          <label className="jmj-label">Name</label>
          <input
            className="jmj-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="name"
          />
        </div>
        <div className="jmj-field-block">
          <label className="jmj-label">Email</label>
          <input
            type="email"
            className="jmj-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>
        <div className="jmj-field-block">
          <label className="jmj-label">Phone (optional)</label>
          <input
            className="jmj-input"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoComplete="tel"
          />
        </div>
        <p className="pt-1 text-xs font-semibold uppercase tracking-widest text-slate-500">Address (optional)</p>
        <div className="jmj-field-block">
          <label className="jmj-label">Street line 1</label>
          <input
            className="jmj-input"
            value={line1}
            onChange={(e) => setLine1(e.target.value)}
            autoComplete="address-line1"
          />
        </div>
        <div className="jmj-field-block">
          <label className="jmj-label">Street line 2</label>
          <input
            className="jmj-input"
            value={line2}
            onChange={(e) => setLine2(e.target.value)}
            autoComplete="address-line2"
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="jmj-field-block">
            <label className="jmj-label">City</label>
            <input className="jmj-input" value={city} onChange={(e) => setCity(e.target.value)} autoComplete="address-level2" />
          </div>
          <div className="jmj-field-block">
            <label className="jmj-label">State / province</label>
            <input
              className="jmj-input"
              value={state}
              onChange={(e) => setState(e.target.value)}
              autoComplete="address-level1"
            />
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="jmj-field-block">
            <label className="jmj-label">Postal code</label>
            <input
              className="jmj-input"
              value={postal}
              onChange={(e) => setPostal(e.target.value)}
              autoComplete="postal-code"
            />
          </div>
          <div className="jmj-field-block">
            <label className="jmj-label">Country</label>
            <input
              className="jmj-input"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              autoComplete="country-name"
            />
          </div>
        </div>
        <div className="jmj-field-block">
          <label className="jmj-label">Password (8+ characters)</label>
          <input
            type="password"
            className="jmj-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
          />
        </div>
        {err ? <p className="text-sm text-rose-600">{err}</p> : null}
        <LuxuryButton type="submit" className="w-full" disabled={busy}>
          {busy ? "…" : "Create account"}
        </LuxuryButton>
      </form>
      <p className="mt-3 text-center text-sm text-slate-600 dark:text-slate-300">
        Already a member?{" "}
        <Link className="text-[#2563EB] underline" href={"/login?callbackUrl=" + encodeURIComponent(cb)}>
          Sign in
        </Link>
      </p>
    </GlassCard>
  );
}

export default function RegisterPage() {
  return (
    <div className="jmj-container py-12">
      <Suspense>
        <Form />
      </Suspense>
    </div>
  );
}
