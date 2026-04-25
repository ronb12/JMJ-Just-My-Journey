"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { LuxuryButton } from "@/components/ui/LuxuryButton";
import { cn } from "@/lib/cn";
import { useCallback, useEffect, useState } from "react";

function CollapsibleSection({
  title,
  description,
  defaultOpen,
  children,
}: {
  title: string;
  description?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(Boolean(defaultOpen));
  return (
    <GlassCard className="mt-4 max-w-2xl !p-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex w-full items-start justify-between gap-4 rounded-3xl px-5 py-4 text-left",
          "hover:bg-slate-50 dark:hover:bg-white/5"
        )}
        aria-expanded={open}
      >
        <div className="min-w-0">
          <p className="font-serif text-xl text-[#1E3A8A] dark:text-sky-200">{title}</p>
          {description ? (
            <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">{description}</div>
          ) : null}
        </div>
        <span
          className={cn(
            "mt-1 inline-flex h-7 w-7 flex-none items-center justify-center rounded-full border text-sm",
            "border-slate-200 bg-white text-slate-700 dark:border-white/10 dark:bg-slate-950 dark:text-slate-200"
          )}
        >
          {open ? "−" : "+"}
        </span>
      </button>
      {open ? <div className="border-t border-slate-200 px-5 pb-5 pt-4 dark:border-white/10">{children}</div> : null}
    </GlassCard>
  );
}

export default function AdminSettings() {
  const [useCustom, setUseCustom] = useState(false);
  const [pk, setPk] = useState("");
  const [sk, setSk] = useState("");
  const [hasSecret, setHasSecret] = useState(false);
  const [site, setSite] = useState({
    business_name: "",
    support_email: "",
    support_phone: "",
    support_address: "",
    footer_note: "",
  });
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
        setSite({
          business_name: String(d.business_name || ""),
          support_email: String(d.support_email || ""),
          support_phone: String(d.support_phone || ""),
          support_address: String(d.support_address || ""),
          footer_note: String(d.footer_note || ""),
        });
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
      <h1 className="font-serif text-3xl text-[#1E3A8A]">Settings</h1>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
        Click a section to expand/collapse.
      </p>

      <CollapsibleSection
        title="Stripe & payments"
        defaultOpen
        description={
          <>
            By default, server uses <code>STRIPE_SECRET_KEY</code> and{" "}
            <code>NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code> from the environment. Enable custom keys to override from
            the database (secret encrypted with <code>ENCRYPTION_KEY</code>).
          </>
        }
      >
        <div className="space-y-3 text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={useCustom} onChange={(e) => setUseCustom(e.target.checked)} />
            Use my own Stripe keys
          </label>
          {useCustom ? (
            <>
              <div>
                <label className="jmj-label">Publishable (pk_)</label>
                <input
                  className="jmj-input font-mono text-xs"
                  value={pk}
                  onChange={(e) => setPk(e.target.value)}
                  placeholder="pk_..."
                  autoComplete="off"
                />
              </div>
              <div>
                <label className="jmj-label">Secret (sk_) — {hasSecret ? "on file" : "not set"}</label>
                <input
                  className="jmj-input font-mono text-xs"
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
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        title="Site info"
        description="Update your business name and contact details used across the site."
      >
        <div className="space-y-3 text-sm">
          <div>
            <label className="jmj-label">Business name</label>
            <input
              className="jmj-input"
              value={site.business_name}
              onChange={(e) => setSite((s) => ({ ...s, business_name: e.target.value }))}
              placeholder="JMJ — Just My Journey"
              autoComplete="off"
            />
          </div>
          <div>
            <label className="jmj-label">Support email (optional)</label>
            <input
              className="jmj-input"
              value={site.support_email}
              onChange={(e) => setSite((s) => ({ ...s, support_email: e.target.value }))}
              placeholder="support@example.com"
              autoComplete="off"
            />
          </div>
          <div>
            <label className="jmj-label">Support phone (optional)</label>
            <input
              className="jmj-input"
              value={site.support_phone}
              onChange={(e) => setSite((s) => ({ ...s, support_phone: e.target.value }))}
              placeholder="+1 (555) 000-0000"
              autoComplete="off"
            />
          </div>
          <div>
            <label className="jmj-label">Support address (optional)</label>
            <textarea
              className="jmj-textarea"
              value={site.support_address}
              onChange={(e) => setSite((s) => ({ ...s, support_address: e.target.value }))}
              placeholder="Street, City, State ZIP"
              rows={2}
            />
          </div>
          <div>
            <label className="jmj-label">Footer note (optional)</label>
            <input
              className="jmj-input"
              value={site.footer_note}
              onChange={(e) => setSite((s) => ({ ...s, footer_note: e.target.value }))}
              placeholder="Short note shown in the footer"
              autoComplete="off"
            />
          </div>
          <LuxuryButton
            type="button"
            onClick={async () => {
              await fetch("/api/admin/site-settings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  business_name: site.business_name || null,
                  support_email: site.support_email || null,
                  support_phone: site.support_phone || null,
                  support_address: site.support_address || null,
                  footer_note: site.footer_note || null,
                }),
              });
              load();
              alert("Saved.");
            }}
          >
            Save site info
          </LuxuryButton>
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        title="Social links"
        description="Add your social media URLs here. They’ll be linked on the home page footer."
      >
        <div className="space-y-3 text-sm">
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
              <label className="jmj-label">{label}</label>
              <input
                className="jmj-input text-xs"
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
                  business_name: site.business_name || null,
                  support_email: site.support_email || null,
                  support_phone: site.support_phone || null,
                  support_address: site.support_address || null,
                  footer_note: site.footer_note || null,
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
        </div>
      </CollapsibleSection>
    </div>
  );
}
