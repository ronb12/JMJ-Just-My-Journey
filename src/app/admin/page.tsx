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
  const totalBookings = (await sql`SELECT count(*)::int AS c FROM appointments`) as { c: number }[];
  const todayAppointments = (await sql`
    SELECT count(*)::int AS c FROM appointments
    WHERE appointment_date = (now() AT TIME ZONE 'America/New_York')::date
  `) as { c: number }[];
  const unpaidBookings = (await sql`
    SELECT count(*)::int AS c FROM appointments
    WHERE payment_status IN ('pending', 'failed')
  `) as { c: number }[];

  const storeAgg = (await sql`
    SELECT
      count(*)::int AS c,
      count(*) FILTER (WHERE payment_status = 'pending')::int AS pending,
      count(*) FILTER (WHERE fulfillment_status = 'unfulfilled')::int AS unfulfilled,
      count(*) FILTER (WHERE fulfillment_status = 'shipped')::int AS shipped,
      coalesce(sum(CASE WHEN payment_status = 'paid' THEN total_amount::numeric END), 0) AS rev
    FROM orders
  `) as { c: number; pending: number; unfulfilled: number; shipped: number; rev: string }[];
  const bookRev = (await sql`
    SELECT coalesce(sum(CASE WHEN payment_status = 'paid' THEN total_amount::numeric END), 0) AS s
    FROM appointments
  `) as { s: string }[];

  const lowInventory = (await sql`
    SELECT id, name, stock_quantity FROM products
    WHERE is_active = true AND stock_quantity <= 5
    ORDER BY stock_quantity ASC
    LIMIT 6
  `) as { id: string; name: string; stock_quantity: number }[];

  const recentOrders = (await sql`
    SELECT o.id, o.total_amount, o.payment_status, o.fulfillment_status, o.created_at, u.email
    FROM orders o
    JOIN users u ON u.id = o.user_id
    ORDER BY o.created_at DESC
    LIMIT 6
  `) as { id: string; total_amount: string; payment_status: string; fulfillment_status: string; created_at: string; email: string }[];

  let staleCarts24h = "0";
  let reminders7d = "0";
  let cartViews7d = "0";
  let checkoutStarted7d = "0";
  let paidOrders7d = "0";
  try {
    const ab = (await sql`
      SELECT COUNT(*)::text AS c
      FROM carts c
      WHERE EXISTS (SELECT 1 FROM cart_items ci WHERE ci.cart_id = c.id)
        AND c.updated_at < (now() - interval '24 hours')
    `) as { c: string }[];
    staleCarts24h = ab[0]?.c ?? "0";

    const r7 = (await sql`
      SELECT COUNT(*)::text AS c
      FROM cart_reminder_logs
      WHERE sent_at > (now() - interval '7 days')
    `) as { c: string }[];
    reminders7d = r7[0]?.c ?? "0";

    const cv = (await sql`
      SELECT COUNT(*)::text AS c
      FROM analytics_events
      WHERE name = 'cart_view' AND created_at > (now() - interval '7 days')
    `) as { c: string }[];
    cartViews7d = cv[0]?.c ?? "0";

    const cs = (await sql`
      SELECT COUNT(*)::text AS c
      FROM analytics_events
      WHERE name = 'checkout_started' AND created_at > (now() - interval '7 days')
    `) as { c: string }[];
    checkoutStarted7d = cs[0]?.c ?? "0";

    const po = (await sql`
      SELECT COUNT(*)::text AS c
      FROM analytics_events
      WHERE name = 'store_order_paid' AND created_at > (now() - interval '7 days')
    `) as { c: string }[];
    paidOrders7d = po[0]?.c ?? "0";
  } catch {
    /* analytics migrations may be missing in some envs */
  }

  const storeRev = parseFloat(storeAgg[0]?.rev || "0");
  const bookingRev = parseFloat(bookRev[0]?.s || "0");

  return {
    bookings: totalBookings[0]?.c || 0,
    todayAppointments: todayAppointments[0]?.c || 0,
    unpaidBookings: unpaidBookings[0]?.c || 0,
    storeRevenue: storeRev,
    bookingRevenue: bookingRev,
    orderCount: storeAgg[0]?.c || 0,
    pendingOrders: storeAgg[0]?.pending || 0,
    unfulfilledOrders: storeAgg[0]?.unfulfilled || 0,
    shippedOrders: storeAgg[0]?.shipped || 0,
    lowInventory,
    recentOrders,
    staleCarts24h: parseInt(staleCarts24h, 10) || 0,
    reminders7d: parseInt(reminders7d, 10) || 0,
    cartViews7d: parseInt(cartViews7d, 10) || 0,
    checkoutStarted7d: parseInt(checkoutStarted7d, 10) || 0,
    paidOrders7d: parseInt(paidOrders7d, 10) || 0,
  };
}

export default async function AdminHome() {
  const s = await getUserSession();
  if (s?.user?.role !== "admin") {
    redirect("/");
  }
  const st: Stats = await getStats();
  const totalRev = st ? st.storeRevenue + st.bookingRevenue : 0;
  const conv =
    st && st.checkoutStarted7d > 0 ? Math.round((st.paidOrders7d / st.checkoutStarted7d) * 100) : null;
  return (
    <div className="space-y-4">
      <h1 className="font-serif text-3xl text-[#1E3A8A] dark:text-sky-200">Admin</h1>
      <p className="text-slate-600 dark:text-slate-300">Revenue, bookings, and operations in one place.</p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatGlassCard
          label="Total bookings"
          value={st ? st.bookings : "—"}
          trend="neutral"
        />
        <StatGlassCard
          label="Store revenue (paid)"
          value={st ? `$${st.storeRevenue.toFixed(2)}` : "—"}
        />
        <StatGlassCard
          label="Booking revenue (paid)"
          value={st ? `$${st.bookingRevenue.toFixed(2)}` : "—"}
        />
        <StatGlassCard
          label="Total revenue (approx.)"
          value={st ? `$${totalRev.toFixed(2)}` : "—"}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatGlassCard label="Today appointments" value={st ? st.todayAppointments : "—"} />
        <StatGlassCard label="Unpaid bookings" value={st ? st.unpaidBookings : "—"} hint="pending/failed" />
        <StatGlassCard label="Orders (all)" value={st ? st.orderCount : "—"} />
        <StatGlassCard
          label="Unfulfilled orders"
          value={st ? st.unfulfilledOrders : "—"}
          hint={st ? `${st.pendingOrders} pending payment` : undefined}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatGlassCard label="Stale carts (24h+)" value={st ? st.staleCarts24h : "—"} hint="with items" />
        <StatGlassCard label="Cart reminders (7d)" value={st ? st.reminders7d : "—"} />
        <StatGlassCard label="Checkout started (7d)" value={st ? st.checkoutStarted7d : "—"} />
        <StatGlassCard
          label="Paid store orders (7d)"
          value={st ? st.paidOrders7d : "—"}
          hint={conv !== null ? `${conv}% conversion` : st ? "—" : undefined}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <GlassCard>
          <h2 className="font-serif text-lg text-sky-900 dark:text-sky-200">Recent orders</h2>
          {st && st.recentOrders.length ? (
            <div className="mt-3 overflow-x-auto rounded-2xl border border-slate-200 dark:border-white/10">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="bg-sky-50/50 text-slate-600 dark:bg-slate-800/70 dark:text-slate-200">
                  <tr>
                    <th className="p-2">Order</th>
                    <th className="p-2">Customer</th>
                    <th className="p-2 text-right">Total</th>
                    <th className="p-2">Pay</th>
                    <th className="p-2">Fulfillment</th>
                  </tr>
                </thead>
                <tbody>
                  {st.recentOrders.map((o) => (
                    <tr key={o.id} className="border-t border-sky-100/50 dark:border-white/10">
                      <td className="p-2 font-mono text-xs">{o.id.slice(0, 8)}</td>
                      <td className="p-2 text-xs text-slate-500 dark:text-slate-300">{o.email}</td>
                      <td className="p-2 text-right">${o.total_amount}</td>
                      <td className="p-2">{o.payment_status}</td>
                      <td className="p-2">{o.fulfillment_status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">No orders yet.</p>
          )}
        </GlassCard>
        <GlassCard>
          <h2 className="font-serif text-lg text-sky-900 dark:text-sky-200">Low inventory</h2>
          {st && st.lowInventory.length ? (
            <ul className="mt-2 space-y-2 text-sm">
              {st.lowInventory.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-white/10 dark:bg-slate-950"
                >
                  <span className="text-slate-700 dark:text-slate-200">{p.name}</span>
                  <span className="font-mono text-xs text-slate-500 dark:text-slate-400">{p.stock_quantity}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">No low-inventory items.</p>
          )}
        </GlassCard>
      </div>
    </div>
  );
}
