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
  const [epUseCustom, setEpUseCustom] = useState(false);
  const [epKey, setEpKey] = useState("");
  const [epHasKey, setEpHasKey] = useState(false);
  const [epFrom, setEpFrom] = useState({
    from_name: "",
    from_street1: "",
    from_street2: "",
    from_city: "",
    from_state: "",
    from_zip: "",
    from_country: "US",
    from_phone: "",
    from_email: "",
  });
  const load = useCallback(() => {
    void fetch("/api/admin/stripe-settings")
      .then((r) => r.json())
      .then((d) => {
        setUseCustom(Boolean(d.useCustomKeys));
        if (d.publishableKey) setPk(d.publishableKey);
        setHasSecret(d.hasCustomSecret);
      });
    void fetch("/api/admin/easypost-settings")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d) return;
        if ("error" in d && d.error) return;
        setEpUseCustom(Boolean(d.useCustomEasypost));
        setEpHasKey(Boolean(d.hasApiKey));
        setEpKey("");
        setEpFrom({
          from_name: String(d.from_name || ""),
          from_street1: String(d.from_street1 || ""),
          from_street2: String(d.from_street2 || ""),
          from_city: String(d.from_city || ""),
          from_state: String(d.from_state || ""),
          from_zip: String(d.from_zip || ""),
          from_country: String(d.from_country || "US"),
          from_phone: String(d.from_phone || ""),
          from_email: String(d.from_email || ""),
        });
      })
      .catch(() => {});
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
        title="EasyPost & shipping"
        description={
          <>
            Used when buying shipping labels in <strong>Admin → Orders</strong>. Option A: store the API key here
            (encrypted with <code>ENCRYPTION_KEY</code>) plus your warehouse / studio ship-from address. Option B: leave
            this off and set <code>EASYPOST_API_KEY</code> and <code>EASYPOST_FROM_*</code> in the environment. Ship-from
            in this form overrides env when <strong>name, street, city, state, and ZIP</strong> are all filled.
          </>
        }
      >
        <div className="space-y-3 text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={epUseCustom} onChange={(e) => setEpUseCustom(e.target.checked)} />
            Store EasyPost API key in the database
          </label>
          {epUseCustom ? (
            <div>
              <label className="jmj-label">EasyPost API key {epHasKey ? "— on file" : "— not set yet"}</label>
              <input
                className="jmj-input font-mono text-xs"
                value={epKey}
                onChange={(e) => setEpKey(e.target.value)}
                type="password"
                placeholder="starts with EZAK, EZT, etc."
                autoComplete="off"
              />
            </div>
          ) : null}
          <p className="text-xs text-slate-500 dark:text-slate-400">Ship from (return address on labels)</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <div>
              <label className="jmj-label">Name / business</label>
              <input
                className="jmj-input text-xs"
                value={epFrom.from_name}
                onChange={(e) => setEpFrom((f) => ({ ...f, from_name: e.target.value }))}
                placeholder="JMJ Studio"
                autoComplete="off"
              />
            </div>
            <div>
              <label className="jmj-label">Phone (optional)</label>
              <input
                className="jmj-input text-xs"
                value={epFrom.from_phone}
                onChange={(e) => setEpFrom((f) => ({ ...f, from_phone: e.target.value }))}
                autoComplete="off"
              />
            </div>
          </div>
          <div>
            <label className="jmj-label">Street line 1</label>
            <input
              className="jmj-input text-xs"
              value={epFrom.from_street1}
              onChange={(e) => setEpFrom((f) => ({ ...f, from_street1: e.target.value }))}
              autoComplete="off"
            />
          </div>
          <div>
            <label className="jmj-label">Street line 2 (optional)</label>
            <input
              className="jmj-input text-xs"
              value={epFrom.from_street2}
              onChange={(e) => setEpFrom((f) => ({ ...f, from_street2: e.target.value }))}
              autoComplete="off"
            />
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div>
              <label className="jmj-label">City</label>
              <input
                className="jmj-input text-xs"
                value={epFrom.from_city}
                onChange={(e) => setEpFrom((f) => ({ ...f, from_city: e.target.value }))}
                autoComplete="off"
              />
            </div>
            <div>
              <label className="jmj-label">State</label>
              <input
                className="jmj-input text-xs"
                value={epFrom.from_state}
                onChange={(e) => setEpFrom((f) => ({ ...f, from_state: e.target.value }))}
                placeholder="GA"
                autoComplete="off"
              />
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div>
              <label className="jmj-label">ZIP / postal</label>
              <input
                className="jmj-input text-xs"
                value={epFrom.from_zip}
                onChange={(e) => setEpFrom((f) => ({ ...f, from_zip: e.target.value }))}
                autoComplete="off"
              />
            </div>
            <div>
              <label className="jmj-label">Country</label>
              <input
                className="jmj-input text-xs"
                value={epFrom.from_country}
                onChange={(e) => setEpFrom((f) => ({ ...f, from_country: e.target.value }))}
                placeholder="US"
                autoComplete="off"
              />
            </div>
          </div>
          <div>
            <label className="jmj-label">From email (optional, EasyPost)</label>
            <input
              className="jmj-input text-xs"
              type="email"
              value={epFrom.from_email}
              onChange={(e) => setEpFrom((f) => ({ ...f, from_email: e.target.value }))}
              autoComplete="off"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <LuxuryButton
              type="button"
              onClick={async () => {
                const res = await fetch("/api/admin/easypost-settings", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    useCustomEasypost: epUseCustom,
                    apiKey: epKey || null,
                    from_name: epFrom.from_name || null,
                    from_street1: epFrom.from_street1 || null,
                    from_street2: epFrom.from_street2 || null,
                    from_city: epFrom.from_city || null,
                    from_state: epFrom.from_state || null,
                    from_zip: epFrom.from_zip || null,
                    from_country: epFrom.from_country || null,
                    from_phone: epFrom.from_phone || null,
                    from_email: epFrom.from_email || null,
                  }),
                });
                const d = (await res.json().catch(() => ({}))) as { error?: string; ok?: boolean };
                if (!res.ok) {
                  alert(d.error || "Could not save EasyPost settings");
                  return;
                }
                setEpKey("");
                load();
                alert("Saved.");
              }}
            >
              Save EasyPost settings
            </LuxuryButton>
            {epUseCustom ? (
              <LuxuryButton
                type="button"
                variant="ghost"
                onClick={async () => {
                  await fetch("/api/admin/easypost-settings", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      useCustomEasypost: false,
                      apiKey: null,
                      from_name: epFrom.from_name || null,
                      from_street1: epFrom.from_street1 || null,
                      from_street2: epFrom.from_street2 || null,
                      from_city: epFrom.from_city || null,
                      from_state: epFrom.from_state || null,
                      from_zip: epFrom.from_zip || null,
                      from_country: epFrom.from_country || null,
                      from_phone: epFrom.from_phone || null,
                      from_email: epFrom.from_email || null,
                    }),
                  });
                  setEpUseCustom(false);
                  setEpKey("");
                  load();
                  alert("Cleared database API key. Using EASYPOST_API_KEY from env if set.");
                }}
              >
                Clear DB key & use env
              </LuxuryButton>
            ) : null}
          </div>
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
