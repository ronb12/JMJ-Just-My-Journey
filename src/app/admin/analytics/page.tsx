import { GlassCard } from "@/components/ui/GlassCard";
import { StatGlassCard } from "@/components/ui/StatGlassCard";
import { getSql, hasDatabase } from "@/lib/db";
import { getUserSession } from "@/lib/session";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type Row = { name: string; c: string };

/** Human-friendly names—no need to match internal database labels */
const EVENT_LABELS: Record<string, string> = {
  cart_view: "Someone opened their shopping cart",
  cart_item_change: "Items added, removed, or updated in a cart",
  product_view: "A product was viewed",
  add_to_cart: "Something was added to a cart",
  checkout_started: "A customer started checking out (store)",
  store_order_paid: "A store order was paid",
  abandoned_cart_reminder_sent: "A “don’t forget your cart” email was sent",
  abandoned_cart_cron_run: "A routine check for forgotten carts ran in the background",
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
  let signedInVisitors7d = 0;
  let guestEvents7d = 0;
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

      const s7 = (await sql`
        SELECT COUNT(DISTINCT user_id)::int AS c
        FROM analytics_events
        WHERE created_at > (now() - interval '7 days')
          AND user_id IS NOT NULL
      `) as { c: number }[];
      signedInVisitors7d = s7[0]?.c ?? 0;

      const g7 = (await sql`
        SELECT COUNT(*)::int AS c
        FROM analytics_events
        WHERE created_at > (now() - interval '7 days')
          AND user_id IS NULL
      `) as { c: number }[];
      guestEvents7d = g7[0]?.c ?? 0;

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
          How your online store is doing
        </p>
        <h1 className="mt-1 font-serif text-3xl text-[#1E3A8A] dark:text-sky-200">Store activity</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          Use this page to see <strong className="font-medium text-slate-800 dark:text-slate-200">shopping cart activity</strong>, what
          visitors are doing in your store, and reminder emails—not spreadsheets or code.
        </p>
        <details className="mt-4 max-w-2xl rounded-2xl border border-slate-200/80 bg-white/50 px-4 py-3 text-sm text-slate-600 open:bg-white/80 dark:border-white/10 dark:bg-slate-950/40 dark:text-slate-300 open:dark:bg-slate-950/70">
          <summary className="cursor-pointer list-none font-medium text-slate-800 outline-none dark:text-slate-200 marker:hidden [&::-webkit-details-marker]:hidden">
            <span className="text-[#2563EB] dark:text-sky-400">A few things to know</span> (read once)
          </summary>
          <ul className="mt-2 list-inside list-disc space-y-2 pl-0.5 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
            <li>
              <strong className="font-medium text-slate-700 dark:text-slate-300">Forgotten carts (1+ day):</strong> counts carts that
              still have at least one product but haven’t been touched for 24 hours—helpful to see who may need a nudge.
            </li>
            <li>
              <strong className="font-medium text-slate-700 dark:text-slate-300">“Different people (signed in)”</strong> counts how many
              customer accounts did something in the store this week—one per person.{" "}
              <strong className="font-medium text-slate-700 dark:text-slate-300">Guests</strong> browsing without an account
              are not counted as people here; their activity still appears in the feed and in “total steps.”
            </li>
            <li>
              <strong className="font-medium text-slate-700 dark:text-slate-300">Total store steps (past week):</strong> every
              action the site records (each cart open, click, checkout step, etc.)—so one shopper can add several steps.
            </li>
            <li>
              <strong className="font-medium text-slate-700 dark:text-slate-300">“Guest” in the list:</strong> the person wasn’t
              signed in; they may still be a repeat buyer on another visit.
            </li>
            <li>
              <strong className="font-medium text-slate-700 dark:text-slate-300">Reminder emails:</strong> if your site is set up to
              email people who left items behind, the count here shows how many of those were sent in the last week.
            </li>
          </ul>
        </details>
      </div>

      {dbError && hasDatabase() && (
        <div className="rounded-2xl border border-amber-200/80 bg-amber-50/80 px-4 py-3 text-sm text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
          <p className="font-medium">We couldn’t load these numbers</p>
          <p className="mt-1 text-xs text-amber-900/80 dark:text-amber-200/90">
            Ask whoever manages the website to confirm the database and analytics are set up. You can also try again later.
          </p>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatGlassCard
          label="Forgotten carts (1+ day old)"
          value={abandonedNow.toLocaleString()}
          hint="Has items, no activity in 24 hours"
        />
        <StatGlassCard
          label="Different people in the store (signed in, 7 days)"
          value={signedInVisitors7d.toLocaleString()}
          hint={
            totalEvents7d > 0
              ? `${totalEvents7d.toLocaleString()} total store steps; ${guestEvents7d.toLocaleString()} from browsers not signed in.`
              : "Each signed-in person is counted once when they do something in the store."
          }
        />
        <StatGlassCard
          label="Types of activity (7 days)"
          value={uniqueEventTypes7d.toLocaleString()}
          hint="How many different kinds of actions happened"
        />
        <StatGlassCard
          label="“Come back to your cart” emails (7 days)"
          value={reminders7d.toLocaleString()}
          hint="Only if reminders are turned on for your site"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <GlassCard className="overflow-hidden p-0">
          <div className="border-b border-slate-200/80 bg-sky-50/40 px-4 py-3 dark:border-white/10 dark:bg-slate-800/30">
            <h2 className="font-serif text-lg text-sky-900 dark:text-sky-200">What people did most (past week)</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">The longer the bar, the more often that happened.</p>
          </div>
          <div className="p-4">
            {last7.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-200 py-10 text-center dark:border-white/10">
                <p className="text-sm text-slate-500 dark:text-slate-400">No store activity in the last week yet.</p>
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  When people browse, use the cart, or check out, you’ll see the most common actions here.
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
                        <span
                          className="shrink-0 text-sm tabular-nums text-slate-500 dark:text-slate-400"
                          title={`Count: ${n.toLocaleString()}`}
                        >
                          {n.toLocaleString()}×
                        </span>
                      </div>
                      <div
                        className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-800/80"
                        role="presentation"
                        aria-label={`${formatEventLabel(r.name)}: about ${pct} percent of the most common action`}
                      >
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#2563EB] to-[#14B8A6] shadow-sm transition-[width] duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </GlassCard>

        <GlassCard className="overflow-hidden p-0">
          <div className="border-b border-slate-200/80 bg-sky-50/40 px-4 py-3 dark:border-white/10 dark:bg-slate-800/30">
            <h2 className="font-serif text-lg text-sky-900 dark:text-sky-200">Latest activity</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Newest on top, up to 50 recent items.</p>
          </div>
          <div className="p-0">
            {recent.length === 0 ? (
              <div className="p-6 text-center text-sm text-slate-500 dark:text-slate-400">
                Nothing has been recorded yet. Check back after visitors use the store.
              </div>
            ) : (
              <div className="max-h-[28rem] overflow-y-auto">
                <table className="w-full min-w-[min(100%,24rem)] text-left text-sm">
                  <thead className="sticky top-0 z-10 bg-sky-50/90 text-slate-600 shadow-sm backdrop-blur dark:bg-slate-800/90 dark:text-slate-200">
                    <tr>
                      <th className="p-3 font-medium">When</th>
                      <th className="p-3 font-medium">What happened</th>
                      <th className="p-3 font-medium">Signed in?</th>
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
                            className="inline-block text-sm font-medium text-[#1E3A8A] dark:text-sky-200"
                            title={r.name}
                          >
                            {formatEventLabel(r.name)}
                          </span>
                        </td>
                        <td className="p-3 text-xs text-slate-600 dark:text-slate-400">
                          {r.user_id ? (
                            <span title="A logged-in customer; ID is for support only" className="text-slate-700 dark:text-slate-300">
                              Yes
                            </span>
                          ) : (
                            <span>Not yet (browser visit)</span>
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
