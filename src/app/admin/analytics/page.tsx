import { GlassCard } from "@/components/ui/GlassCard";
import { getSql, hasDatabase } from "@/lib/db";
import { getUserSession } from "@/lib/session";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type Row = { name: string; c: string };

export default async function AdminAnalyticsPage() {
  const s = await getUserSession();
  if (s?.user?.role !== "admin") redirect("/");

  let abandonedNow = "0";
  let last7: Row[] = [];
  let recent: { name: string; created_at: string; user_id: string | null }[] = [];

  if (hasDatabase()) {
    const sql = getSql();
    try {
      const ab = (await sql`
        SELECT COUNT(*)::text AS c
        FROM carts c
        WHERE EXISTS (SELECT 1 FROM cart_items ci WHERE ci.cart_id = c.id)
          AND c.updated_at < (now() - interval '24 hours')
      `) as { c: string }[];
      abandonedNow = ab[0]?.c ?? "0";

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
        LIMIT 40
      `) as typeof recent;
    } catch {
      /* missing migration */
    }
  }

  return (
    <div>
      <h1 className="font-serif text-3xl text-[#1E3A8A] dark:text-sky-200">Analytics</h1>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
        Cart abandonment uses <code className="text-xs">carts.updated_at</code> (bumped when items change) and a
        scheduled job at <code className="text-xs">/api/cron/abandoned-cart</code>. Set{" "}
        <code className="text-xs">CRON_SECRET</code> and add a Vercel Cron pointing to that URL.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <GlassCard>
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Stale carts (24h+)</p>
          <p className="mt-2 font-serif text-3xl text-[#1E3A8A] dark:text-sky-200">{abandonedNow}</p>
          <p className="mt-1 text-xs text-slate-500">Carts that still have line items and no activity for 24 hours.</p>
        </GlassCard>
        <GlassCard>
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Events (7 days)</p>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Top event names from <code>analytics_events</code>.
          </p>
        </GlassCard>
      </div>

      <GlassCard className="mt-4">
        <p className="text-sm font-medium text-slate-800 dark:text-slate-100">Event counts (last 7 days)</p>
        {last7.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">No analytics data yet (run migration 009 and generate traffic).</p>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-2xl border border-slate-200 dark:border-white/10">
            <table className="w-full min-w-[360px] text-left text-sm">
              <thead className="bg-sky-50/50 text-slate-600 dark:bg-slate-800/70 dark:text-slate-200">
                <tr>
                  <th className="p-2">Event</th>
                  <th className="p-2 text-right">Count</th>
                </tr>
              </thead>
              <tbody>
                {last7.map((r) => (
                  <tr key={r.name} className="border-t border-sky-100/50 dark:border-white/10">
                    <td className="p-2 font-mono text-xs">{r.name}</td>
                    <td className="p-2 text-right">{r.c}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>

      <GlassCard className="mt-4">
        <p className="text-sm font-medium text-slate-800 dark:text-slate-100">Recent events</p>
        {recent.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">No rows yet.</p>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-2xl border border-slate-200 dark:border-white/10">
            <table className="w-full min-w-[480px] text-left text-xs">
              <thead className="bg-sky-50/50 text-slate-600 dark:bg-slate-800/70 dark:text-slate-200">
                <tr>
                  <th className="p-2">When</th>
                  <th className="p-2">Event</th>
                  <th className="p-2">User</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((r, i) => (
                  <tr key={`${r.name}-${r.created_at}-${i}`} className="border-t border-sky-100/50 dark:border-white/10">
                    <td className="p-2 whitespace-nowrap text-slate-500">{r.created_at}</td>
                    <td className="p-2 font-mono">{r.name}</td>
                    <td className="p-2 font-mono text-slate-500">{r.user_id ? r.user_id.slice(0, 8) + "…" : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
