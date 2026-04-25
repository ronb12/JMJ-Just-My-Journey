import { GlassCard } from "@/components/ui/GlassCard";
import { StatGlassCard } from "@/components/ui/StatGlassCard";
import { getSql, hasDatabase } from "@/lib/db";
import { getUserSession } from "@/lib/session";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type Row = { name: string; c: string };

const EVENT_LABELS: Record<string, string> = {
  cart_view: "Cart views",
  cart_item_change: "Cart updates",
  product_view: "Product views",
  add_to_cart: "Add to cart",
  checkout_started: "Checkout started",
  store_order_paid: "Store order paid",
  abandoned_cart_reminder_sent: "Abandoned cart reminder sent",
  abandoned_cart_cron_run: "Abandoned cart cron run",
};

function formatEventLabel(name: string) {
  if (EVENT_LABELS[name]) return EVENT_LABELS[name];
  return name
    .split(/[_\s]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function formatWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return iso;
  }
}

export default async function AdminAnalyticsPage() {
  const s = await getUserSession();
  if (s?.user?.role !== "admin") redirect("/");

  let abandonedNow = 0;
  let totalEvents7d = 0;
  let uniqueEventTypes7d = 0;
  let reminders7d = 0;
  let last7: Row[] = [];
  let recent: { name: string; created_at: string; user_id: string | null }[] = [];
  let dbError = false;

  if (hasDatabase()) {
    const sql = getSql();
    try {
      const ab = (await sql`
        SELECT COUNT(*)::int AS c
        FROM carts c
        WHERE EXISTS (SELECT 1 FROM cart_items ci WHERE ci.cart_id = c.id)
          AND c.updated_at < (now() - interval '24 hours')
      `) as { c: number }[];
      abandonedNow = ab[0]?.c ?? 0;

      const t7 = (await sql`
        SELECT COUNT(*)::int AS c
        FROM analytics_events
        WHERE created_at > (now() - interval '7 days')
      `) as { c: number }[];
      totalEvents7d = t7[0]?.c ?? 0;

      const u7 = (await sql`
        SELECT COUNT(DISTINCT name)::int AS c
        FROM analytics_events
        WHERE created_at > (now() - interval '7 days')
      `) as { c: number }[];
      uniqueEventTypes7d = u7[0]?.c ?? 0;

      try {
        const r7 = (await sql`
          SELECT COUNT(*)::int AS c
          FROM cart_reminder_logs
          WHERE sent_at > (now() - interval '7 days')
        `) as { c: number }[];
        reminders7d = r7[0]?.c ?? 0;
      } catch {
        reminders7d = 0;
      }

      last7 = (await sql`
        SELECT name, COUNT(*)::text AS c
        FROM analytics_events
        WHERE created_at > (now() - interval '7 days')
        GROUP BY name
        ORDER BY COUNT(*) DESC
        LIMIT 20
      `) as Row[];

      recent = (await sql`
        SELECT name, created_at::text, user_id::text
        FROM analytics_events
        ORDER BY created_at DESC
        LIMIT 50
      `) as typeof recent;
    } catch {
      dbError = true;
    }
  }

  const counts = last7.map((r) => parseInt(r.c, 10) || 0);
  const maxCount = Math.max(1, ...counts, 0);

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl border border-sky-200/60 bg-gradient-to-br from-sky-50/90 via-white to-rose-50/30 p-6 dark:border-white/10 dark:from-slate-900/90 dark:via-slate-900/40 dark:to-slate-950">
        <div
          className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-[#2563EB]/10 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-10 left-1/3 h-32 w-32 rounded-full bg-[#14B8A6]/10 blur-3xl"
          aria-hidden
        />
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#2563EB]/80 dark:text-sky-300/80">
          Insights
        </p>
        <h1 className="mt-1 font-serif text-3xl text-[#1E3A8A] dark:text-sky-200">Analytics</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          Product and commerce signals from the last week—cart health, custom events, and a live stream of
          what shoppers are doing.
        </p>
        <details className="mt-4 max-w-2xl rounded-2xl border border-slate-200/80 bg-white/50 px-4 py-2 text-sm text-slate-600 open:bg-white/80 dark:border-white/10 dark:bg-slate-950/40 dark:text-slate-300 open:dark:bg-slate-950/70">
          <summary className="cursor-pointer list-none font-medium text-slate-800 outline-none marker:hidden dark:text-slate-200 [&::-webkit-details-marker]:hidden">
            <span className="text-[#2563EB] dark:text-sky-400">How this works</span> — abandoned carts &amp; cron
          </summary>
          <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
            A cart is “stale” when it still has line items and <code className="rounded bg-slate-200/80 px-1">carts.updated_at</code> is
            more than 24 hours ago (updates when items change). The abandoned-cart job at{" "}
            <code className="rounded bg-slate-200/80 px-1">/api/cron/abandoned-cart</code> uses <code className="rounded bg-slate-200/80 px-1">CRON_SECRET</code>{" "}
            and a Vercel Cron schedule. Events are stored in <code className="rounded bg-slate-200/80 px-1">analytics_events</code> (migration
            009+).
          </p>
        </details>
      </div>

      {dbError && hasDatabase() && (
        <p className="text-sm text-amber-800 dark:text-amber-200">
          Some analytics tables may be missing. Run migration <code className="text-xs">009_abandoned_cart_analytics.sql</code> in Neon, then
          refresh.
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatGlassCard
          label="Stale carts (24h+)"
          value={abandonedNow.toLocaleString()}
          hint="Has items, no touch 24h"
        />
        <StatGlassCard
          label="Events logged (7d)"
          value={totalEvents7d.toLocaleString()}
          hint="All tracked event rows"
        />
        <StatGlassCard
          label="Event types (7d)"
          value={uniqueEventTypes7d.toLocaleString()}
          hint="Distinct event names"
        />
        <StatGlassCard
          label="Reminders sent (7d)"
          value={reminders7d.toLocaleString()}
          hint="Abandoned cart emails / jobs"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <GlassCard className="overflow-hidden p-0">
          <div className="border-b border-slate-200/80 bg-sky-50/40 px-4 py-3 dark:border-white/10 dark:bg-slate-800/30">
            <h2 className="font-serif text-lg text-sky-900 dark:text-sky-200">Top events (7 days)</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">By volume, after deduplication by name.</p>
          </div>
          <div className="p-4">
            {last7.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-200 py-10 text-center dark:border-white/10">
                <p className="text-sm text-slate-500 dark:text-slate-400">No events in the last week yet.</p>
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  Browse the store, add to cart, or start checkout to generate data.
                </p>
              </div>
            ) : (
              <ul className="space-y-4">
                {last7.map((r) => {
                  const n = parseInt(r.c, 10) || 0;
                  const pct = Math.round((n / maxCount) * 100);
                  return (
                    <li key={r.name}>
                      <div className="mb-1.5 flex items-baseline justify-between gap-2">
                        <span className="min-w-0 text-sm font-medium text-slate-800 dark:text-slate-100">
                          {formatEventLabel(r.name)}
                        </span>
                        <span className="shrink-0 text-sm tabular-nums text-slate-500 dark:text-slate-400">
                          {n.toLocaleString()}
                        </span>
                      </div>
                      <div
                        className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-800/80"
                        role="presentation"
                      >
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#2563EB] to-[#14B8A6] shadow-sm transition-[width] duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="mt-0.5 font-mono text-[10px] text-slate-400 dark:text-slate-500">{r.name}</p>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </GlassCard>

        <GlassCard className="overflow-hidden p-0">
          <div className="border-b border-slate-200/80 bg-sky-50/40 px-4 py-3 dark:border-white/10 dark:bg-slate-800/30">
            <h2 className="font-serif text-lg text-sky-900 dark:text-sky-200">Event feed</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Latest 50, newest first.</p>
          </div>
          <div className="p-0">
            {recent.length === 0 ? (
              <div className="p-6 text-center text-sm text-slate-500 dark:text-slate-400">No rows yet.</div>
            ) : (
              <div className="max-h-[28rem] overflow-y-auto">
                <table className="w-full min-w-[min(100%,24rem)] text-left text-sm">
                  <thead className="sticky top-0 z-10 bg-sky-50/90 text-slate-600 shadow-sm backdrop-blur dark:bg-slate-800/90 dark:text-slate-200">
                    <tr>
                      <th className="p-3 font-medium">Time</th>
                      <th className="p-3 font-medium">Event</th>
                      <th className="p-3 font-medium">User</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/10">
                    {recent.map((r, i) => (
                      <tr
                        key={`${r.name}-${r.created_at}-${i}`}
                        className="hover:bg-sky-50/40 dark:hover:bg-white/[0.04]"
                      >
                        <td className="whitespace-nowrap p-3 text-xs text-slate-500 dark:text-slate-400">
                          {formatWhen(r.created_at)}
                        </td>
                        <td className="p-3">
                          <span
                            className="inline-block max-w-[12rem] truncate rounded-full border border-sky-200/80 bg-white px-2.5 py-0.5 text-xs font-medium text-[#1E3A8A] dark:border-white/10 dark:bg-slate-900/60 dark:text-sky-200"
                            title={r.name}
                          >
                            {formatEventLabel(r.name)}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-xs text-slate-500 dark:text-slate-500">
                          {r.user_id ? (
                            <span
                              className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] dark:bg-slate-800/80"
                              title={r.user_id}
                            >
                              {r.user_id.slice(0, 8)}…
                            </span>
                          ) : (
                            <span className="text-slate-400">Guest</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
