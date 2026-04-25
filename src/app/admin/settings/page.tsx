"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { LuxuryButton } from "@/components/ui/LuxuryButton";
import { useCallback, useEffect, useState } from "react";

export default function AdminSettings() {
  const [useCustom, setUseCustom] = useState(false);
  const [pk, setPk] = useState("");
  const [sk, setSk] = useState("");
  const [hasSecret, setHasSecret] = useState(false);
  const [social, setSocial] = useState({
    instagram_url: "",
    facebook_url: "",
    tiktok_url: "",
    youtube_url: "",
    x_url: "",
  });
  const load = useCallback(() => {
    void fetch("/api/admin/stripe-settings")
      .then((r) => r.json())
      .then((d) => {
        setUseCustom(Boolean(d.useCustomKeys));
        if (d.publishableKey) setPk(d.publishableKey);
        setHasSecret(d.hasCustomSecret);
      });
    void fetch("/api/admin/site-settings")
      .then((r) => r.json())
      .then((d) => {
        setSocial({
          instagram_url: String(d.instagram_url || ""),
          facebook_url: String(d.facebook_url || ""),
          tiktok_url: String(d.tiktok_url || ""),
          youtube_url: String(d.youtube_url || ""),
          x_url: String(d.x_url || ""),
        });
      })
      .catch(() => {});
  }, []);
  useEffect(() => {
    load();
  }, [load]);
  return (
    <div>
      <h1 className="font-serif text-3xl text-[#1E3A8A]">Stripe & payments</h1>
      <p className="mt-1 text-sm text-slate-600">
        By default, server uses <code>STRIPE_SECRET_KEY</code> and <code>NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code>{" "}
        from the environment. Enable custom keys to override from the database (secret encrypted with{" "}
        <code>ENCRYPTION_KEY</code>).
      </p>
      <GlassCard className="mt-4 max-w-lg space-y-3 text-sm">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={useCustom} onChange={(e) => setUseCustom(e.target.checked)} />
          Use my own Stripe keys
        </label>
        {useCustom ? (
          <>
            <div>
              <p className="text-xs text-slate-500">Publishable (pk_)</p>
              <input
                className="mt-1 w-full rounded-xl border border-white/40 bg-white/50 px-2 py-1 font-mono text-xs"
                value={pk}
                onChange={(e) => setPk(e.target.value)}
                placeholder="pk_..."
                autoComplete="off"
              />
            </div>
            <div>
              <p className="text-xs text-slate-500">Secret (sk_) — {hasSecret ? "on file" : "not set"}</p>
              <input
                className="mt-1 w-full rounded-xl border border-white/40 bg-white/50 px-2 py-1 font-mono text-xs"
                value={sk}
                onChange={(e) => setSk(e.target.value)}
                type="password"
                placeholder="sk_..."
                autoComplete="off"
              />
            </div>
            <LuxuryButton
              type="button"
              onClick={async () => {
                await fetch("/api/admin/stripe-settings", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    useCustomKeys: useCustom,
                    publishableKey: pk,
                    secretKey: sk,
                  }),
                });
                setSk("");
                load();
                alert("Saved.");
              }}
            >
              Save Stripe settings
            </LuxuryButton>
          </>
        ) : (
          <LuxuryButton
            type="button"
            variant="ghost"
            onClick={async () => {
              await fetch("/api/admin/stripe-settings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ useCustomKeys: false, publishableKey: null, secretKey: null }),
              });
              load();
              alert("Switched to platform env keys.");
            }}
          >
            Use platform (env) keys
          </LuxuryButton>
        )}
      </GlassCard>

      <h2 className="mt-10 font-serif text-2xl text-[#1E3A8A]">Social links</h2>
      <p className="mt-1 max-w-lg text-sm text-slate-600">
        Add your social media URLs here. They’ll be linked on the home page footer.
      </p>
      <GlassCard className="mt-4 max-w-lg space-y-3 text-sm">
        {(
          [
            ["instagram_url", "Instagram URL"],
            ["facebook_url", "Facebook URL"],
            ["tiktok_url", "TikTok URL"],
            ["youtube_url", "YouTube URL"],
            ["x_url", "X (Twitter) URL"],
          ] as const
        ).map(([k, label]) => (
          <div key={k}>
            <p className="text-xs text-slate-500">{label}</p>
            <input
              className="mt-1 w-full rounded-xl border border-white/40 bg-white/50 px-2 py-1 text-xs"
              value={social[k]}
              onChange={(e) => setSocial((s) => ({ ...s, [k]: e.target.value }))}
              placeholder="https://..."
              autoComplete="off"
            />
          </div>
        ))}
        <LuxuryButton
          type="button"
          onClick={async () => {
            await fetch("/api/admin/site-settings", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                instagram_url: social.instagram_url || null,
                facebook_url: social.facebook_url || null,
                tiktok_url: social.tiktok_url || null,
                youtube_url: social.youtube_url || null,
                x_url: social.x_url || null,
              }),
            });
            load();
            alert("Saved.");
          }}
        >
          Save social links
        </LuxuryButton>
      </GlassCard>
    </div>
  );
}
