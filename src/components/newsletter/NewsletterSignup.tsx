"use client";

import { LuxuryButton } from "@/components/ui/LuxuryButton";
import { NewsletterAppIcon } from "@/components/newsletter/NewsletterBrandedPreview";
import { useState } from "react";

type Source = "footer" | "contact" | "account" | "other";

export function NewsletterSignup({
  source = "other",
  className = "",
  compact = false,
  defaultEmail = "",
}: {
  source?: Source;
  className?: string;
  compact?: boolean;
  /** Prefill (e.g. account email) — user can still edit before subscribing */
  defaultEmail?: string;
}) {
  const [email, setEmail] = useState(() => defaultEmail.trim());
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    const res = await fetch("/api/newsletter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, source }),
    });
    setBusy(false);
    if (res.ok) {
      setDone(true);
      setEmail("");
    } else {
      const d = (await res.json().catch(() => ({}))) as { error?: string };
      setErr(d.error || "Could not subscribe. Please try again.");
    }
  }

  if (done) {
    return (
      <p className={"text-sm text-[#14B8A6] " + className} role="status">
        You are on the list. Thank you.
      </p>
    );
  }

  if (compact) {
    return (
      <form className={className} onSubmit={submit}>
        <div className="mb-2 flex items-center gap-2">
          <NewsletterAppIcon size={28} className="rounded-lg shadow-sm" />
          <span className="text-sm font-semibold text-[#1E3A8A] dark:text-sky-200">Email updates</span>
        </div>
        <label className="jmj-label sr-only" htmlFor={`jmj-newsletter-${source}-compact`}>
          Email for updates
        </label>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
          <input
            id={`jmj-newsletter-${source}-compact`}
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="jmj-input min-w-0 flex-1"
            placeholder="you@example.com"
            autoComplete="email"
            disabled={busy}
          />
          <LuxuryButton type="submit" className="shrink-0" disabled={busy}>
            {busy ? "…" : "Subscribe"}
          </LuxuryButton>
        </div>
        {err ? <p className="mt-1 text-xs text-rose-600">{err}</p> : null}
        <p className="mt-1 text-xs text-slate-500">Occasional updates only. Unsubscribe any time (contact us).</p>
      </form>
    );
  }

  return (
    <div className={className}>
      <div className="flex items-start gap-3">
        <NewsletterAppIcon size={40} className="mt-0.5 shrink-0 rounded-2xl shadow-sm" />
        <div className="min-w-0">
          <p className="text-sm font-semibold uppercase tracking-widest text-slate-500">Newsletter</p>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Tips, offers, and calm in your inbox.
          </p>
        </div>
      </div>
      <form className="mt-3 space-y-2" onSubmit={submit}>
        <div className="jmj-field-block">
          <label className="jmj-label" htmlFor={`jmj-newsletter-${source}`}>
            Email
          </label>
          <input
            id={`jmj-newsletter-${source}`}
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="jmj-input"
            placeholder="you@example.com"
            autoComplete="email"
            disabled={busy}
          />
        </div>
        {err ? <p className="text-xs text-rose-600">{err}</p> : null}
        <LuxuryButton type="submit" disabled={busy} className="w-full sm:w-auto">
          {busy ? "Joining…" : "Subscribe"}
        </LuxuryButton>
        <p className="text-xs text-slate-500">We only use this to send you updates. No spam.</p>
      </form>
    </div>
  );
}

