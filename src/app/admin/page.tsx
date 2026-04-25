import { StatGlassCard } from "@/components/ui/StatGlassCard";
import { GlassCard } from "@/components/ui/GlassCard";
import { getUserSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { getSql, hasDatabase } from "@/lib/db";

export const dynamic = "force-dynamic";

type Stats = Awaited<ReturnType<typeof getStats>>;

async function getStats() {
  if (!hasDatabase()) {
    return null;
  }
  const sql = getSql();
  const a = (await sql`SELECT count(*)::int AS c FROM appointments`) as { c: number }[];
  const o = (await sql`
    SELECT
      coalesce(sum(CASE WHEN payment_status = 'paid' THEN total_amount::numeric END), 0) AS s
    FROM orders
  `) as { s: string }[];
  const b = (await sql`
    SELECT coalesce(sum(CASE WHEN payment_status = 'paid' THEN total_amount::numeric END), 0) AS s
    FROM appointments
  `) as { s: string }[];
  return { bookings: a[0]?.c || 0, store: o[0]?.s || "0", booking: b[0]?.s || "0" };
}

export default async function AdminHome() {
  const s = await getUserSession();
  if (s?.user?.role !== "admin") {
    redirect("/");
  }
  const st: Stats = await getStats();
  return (
    <div className="space-y-4">
      <h1 className="font-serif text-3xl text-[#1E3A8A]">Admin</h1>
      <p className="text-slate-600">Revenue, bookings, and operations in one place.</p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatGlassCard
          label="Total bookings"
          value={st ? st.bookings : "—"}
          trend="neutral"
        />
        <StatGlassCard
          label="Store revenue (paid)"
          value={st ? `$${parseFloat(st.store).toFixed(2)}` : "—"}
        />
        <StatGlassCard
          label="Booking revenue (paid)"
          value={st ? `$${parseFloat(st.booking).toFixed(2)}` : "—"}
        />
        <StatGlassCard
          label="Total revenue (approx.)"
          value={st ? `$${(parseFloat(st.store) + parseFloat(st.booking)).toFixed(2)}` : "—"}
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <GlassCard>
          <h2 className="font-serif text-lg text-sky-900">Today</h2>
          <p className="text-sm text-slate-500">View appointments in Bookings and Today filter.</p>
        </GlassCard>
        <GlassCard>
          <h2 className="font-serif text-lg text-sky-900">Stripe</h2>
          <p className="text-sm text-slate-500">Configure test keys in Settings. Webhook required for live updates.</p>
        </GlassCard>
      </div>
    </div>
  );
}
