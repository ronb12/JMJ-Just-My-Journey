"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { LuxuryButton } from "@/components/ui/LuxuryButton";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useState, Suspense } from "react";

function Form() {
  const sp = useSearchParams();
  const r = useRouter();
  const cb = sp.get("callbackUrl") || "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <GlassCard className="mx-auto max-w-md">
      <h1 className="font-serif text-3xl text-[#1E3A8A]">Welcome back</h1>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Sign in to continue your journey.</p>
      <form
        className="mt-4 space-y-3"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setErr(null);
          const res = await signIn("credentials", {
            email,
            password,
            redirect: false,
            callbackUrl: cb,
          });
          setBusy(false);
          if (res?.error) {
            setErr("Invalid email or password. Ensure the database is configured and the user exists.");
            return;
          }
          r.push(res?.url || cb);
        }}
      >
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
          <label className="jmj-label">Password</label>
          <input
            type="password"
            className="jmj-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </div>
        {err ? <p className="text-sm text-rose-600">{err}</p> : null}
        <LuxuryButton type="submit" className="w-full" disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </LuxuryButton>
      </form>
      <p className="mt-3 text-center text-sm text-slate-600 dark:text-slate-300">
        New here?{" "}
        <Link className="text-[#2563EB] underline" href={"/register?callbackUrl=" + encodeURIComponent(cb)}>
          Create an account
        </Link>
      </p>
    </GlassCard>
  );
}

export default function LoginPage() {
  return (
    <div className="jmj-container py-12">
      <Suspense>
        <Form />
      </Suspense>
    </div>
  );
}
