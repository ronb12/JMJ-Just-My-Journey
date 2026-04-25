"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { LuxuryButton } from "@/components/ui/LuxuryButton";
import { useState } from "react";
import { FadeIn } from "@/components/ui/FadeIn";
import { NewsletterSignup } from "@/components/newsletter/NewsletterSignup";

export default function ContactPage() {
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  return (
    <div className="jmj-container max-w-lg py-12">
      <FadeIn>
        <h1 className="font-serif text-4xl text-[#1E3A8A]">Contact</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-300">
          We read every message and reply during studio hours.
        </p>
      </FadeIn>
      <GlassCard className="mt-6">
        {sent ? (
          <p className="text-[#14B8A6]">Message sent. We will be in touch.</p>
        ) : (
          <form
            className="space-y-3"
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              const f = e.currentTarget;
              const fd = new FormData(f);
              const res = await fetch("/api/contact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  name: fd.get("name"),
                  email: fd.get("email"),
                  phone: fd.get("phone") || null,
                  message: fd.get("message"),
                }),
              });
              setBusy(false);
              if (res.ok) {
                setSent(true);
                f.reset();
              }
            }}
          >
            <div className="jmj-field-block">
              <label className="jmj-label">Name</label>
              <input name="name" required className="jmj-input" />
            </div>
            <div className="jmj-field-block">
              <label className="jmj-label">Email</label>
              <input
                name="email"
                type="email"
                required
                className="jmj-input"
              />
            </div>
            <div className="jmj-field-block">
              <label className="jmj-label">Phone (optional)</label>
              <input name="phone" className="jmj-input" />
            </div>
            <div className="jmj-field-block">
              <label className="jmj-label">Message</label>
              <textarea
                name="message"
                required
                minLength={5}
                className="jmj-textarea"
                rows={4}
              />
            </div>
            <LuxuryButton type="submit" className="w-full" disabled={busy}>
              {busy ? "Sending…" : "Send"}
            </LuxuryButton>
          </form>
        )}
      </GlassCard>
      <GlassCard className="mt-6">
        <h2 className="font-serif text-xl text-[#1E3A8A]">Stay in the loop</h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          Occasional wellness tips and special offers. No pressure.
        </p>
        <div className="mt-4">
          <NewsletterSignup source="contact" compact />
        </div>
      </GlassCard>
    </div>
  );
}
