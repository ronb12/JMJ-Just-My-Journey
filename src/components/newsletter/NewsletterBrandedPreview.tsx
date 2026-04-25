"use client";

/** PWA / header icon; must match `public/manifest.json` and `SiteHeader`. */
export const APP_NEWSLETTER_ICON_PATH = "/icons/jmj-icon-192.png";

export function NewsletterAppIcon({
  className = "",
  size = 40,
  alt = "",
}: {
  className?: string;
  size?: number;
  /** Empty alt: decorative when paired with visible brand text */
  alt?: string;
}) {
  return (
    <img
      src={APP_NEWSLETTER_ICON_PATH}
      width={size}
      height={size}
      className={className}
      alt={alt}
    />
  );
}

function escHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * HTML suitable for pasting into Mailchimp, etc.: centered app icon + subject + pre-wrapped body.
 * Body is HTML-escaped (treats content as text). Use absolute `iconUrl` in email clients.
 */
export function buildBrandedNewsletterHtml(args: {
  subject: string;
  body: string;
  /** e.g. https://jmj-app.vercel.app (no trailing slash) */
  origin: string;
}) {
  const origin = args.origin.replace(/\/$/, "");
  const iconUrl = `${origin}${APP_NEWSLETTER_ICON_PATH}`;
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1" /><title>${escHtml(args.subject)}</title></head>
<body style="margin:0;padding:24px;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#F3F4F6;color:#1E293B;">
  <div style="max-width:600px;margin:0 auto;">
    <div style="text-align:center;margin:0 0 24px;">
      <img src="${escHtml(iconUrl)}" width="64" height="64" alt="JMJ — Just My Journey" style="display:inline-block;border-radius:16px;vertical-align:middle;" />
    </div>
    <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.1em;text-transform:uppercase;color:#64748B;">JMJ — Just My Journey</p>
    <h1 style="font-size:18px;font-weight:600;color:#1E3A8A;margin:0 0 16px;">${escHtml(args.subject)}</h1>
    <div style="font-size:15px;line-height:1.65;white-space:pre-wrap;">${escHtml(args.body)}</div>
  </div>
</body>
</html>`;
}

export function NewsletterBrandedPreview({
  subjectLine,
  body,
  className = "",
}: {
  subjectLine: string;
  body: string;
  className?: string;
}) {
  return (
    <div
      className={
        "rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm dark:border-white/10 dark:bg-slate-950/80 " +
        className
      }
    >
      <div className="flex flex-col items-center border-b border-slate-100 pb-4 text-center dark:border-white/10">
        <NewsletterAppIcon size={48} className="rounded-2xl shadow-sm" />
        <p className="mt-2 font-serif text-sm font-semibold text-[#1E3A8A] dark:text-sky-200">JMJ — Just My Journey</p>
        <p className="mt-1 text-xs text-slate-500">How your email can open (with app icon at the top)</p>
      </div>
      <p className="mt-3 text-sm font-medium text-slate-800 dark:text-slate-100">
        Subject: <span className="text-slate-600 dark:text-slate-300">{subjectLine || "—"}</span>
      </p>
      <pre className="mt-2 max-h-44 overflow-y-auto whitespace-pre-wrap border-t border-slate-100 pt-2 text-left text-sm text-slate-600 dark:border-white/10 dark:text-slate-300">
        {body || "—"}
      </pre>
    </div>
  );
}

export function getNewsletterAppOrigin() {
  if (typeof window !== "undefined") return window.location.origin;
  return (process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/$/, "");
}
