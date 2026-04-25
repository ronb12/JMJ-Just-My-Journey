import { StatGlassCard } from "@/components/ui/StatGlassCard";
import { GlassCard } from "@/components/ui/GlassCard";
import { getUserSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { getSql, hasDatabase } from "@/lib/db";
import Link from "next/link";

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
      coalesce(sum(CASE WHEN payment_status = 'paid' THEN total_amount::numeric END), 0) AS rev
    FROM orders
  `) as { c: number; pending: number; unfulfilled: number; rev: string }[];
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
    lowInventory,
    recentOrders,
    staleCarts24h: parseInt(staleCarts24h, 10) || 0,
    reminders7d: parseInt(reminders7d, 10) || 0,
    cartViews7d: parseInt(cartViews7d, 10) || 0,
    checkoutStarted7d: parseInt(checkoutStarted7d, 10) || 0,
    paidOrders7d: parseInt(paidOrders7d, 10) || 0,
  };
}

function payPlain(status: string) {
  if (status === "paid") return "Paid";
  if (status === "pending") return "Waiting for payment";
  if (status === "failed" || status === "unpaid") return "Payment did not go through";
  return status;
}

function shipPlain(status: string) {
  if (status === "unfulfilled") return "Not shipped yet";
  if (status === "shipped" || status === "fulfilled") return "Shipped";
  if (status === "partially_fulfilled") return "Partly shipped";
  if (status === "cancelled") return "Cancelled";
  return status.replace(/_/g, " ");
}

function orderWhen(iso: string) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default async function AdminHome() {
  const s = await getUserSession();
  if (s?.user?.role !== "admin") {
    redirect("/");
  }
  const st: Stats = await getStats();
  const totalRev = st ? st.storeRevenue + st.bookingRevenue : 0;
  const conv =
    st && st.checkoutStarted7d > 0
      ? Math.round((st.paidOrders7d / st.checkoutStarted7d) * 100)
      : null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl text-[#1E3A8A] dark:text-sky-200">Overview</h1>
        <p className="mt-2 max-w-2xl text-slate-600 dark:text-slate-300">
          A simple snapshot of your spa, online shop, and what might need a quick look. Nothing here requires technical
          knowledge—just your numbers, in everyday words.
        </p>
      </div>

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Money coming in
        </h2>
        <p className="mb-3 text-sm text-slate-600 dark:text-slate-400">Totals use completed payments (paid) only.</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatGlassCard
            label="Spa service income (paid)"
            value={st ? `$${st.bookingRevenue.toFixed(2)}` : "—"}
            hint="From booked appointments that are paid"
          />
          <StatGlassCard
            label="Shop sales (paid)"
            value={st ? `$${st.storeRevenue.toFixed(2)}` : "—"}
            hint="From online product orders that are paid"
          />
          <StatGlassCard
            label="Combined income (spa + shop)"
            value={st ? `$${totalRev.toFixed(2)}` : "—"}
            trend="neutral"
          />
          <StatGlassCard
            label="Appointments booked (all time)"
            value={st ? st.bookings : "—"}
            hint="Count of all spa visits on the books"
          />
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          What’s happening now
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatGlassCard
            label="Visits scheduled for today"
            value={st ? st.todayAppointments : "—"}
            hint="Based on your business day (Eastern time)"
          />
          <StatGlassCard
            label="Bookings still need payment"
            value={st ? st.unpaidBookings : "—"}
            hint={st && st.unpaidBookings > 0 ? "Follow up with these guests" : "You’re all caught up"}
            trend={st && st.unpaidBookings > 0 ? "down" : "neutral"}
          />
          <StatGlassCard
            label="All online shop orders"
            value={st ? st.orderCount : "—"}
            hint="Every order placed, all statuses"
          />
          <StatGlassCard
            label="Orders not shipped yet"
            value={st ? st.unfulfilledOrders : "—"}
            hint={st && st.orderCount > 0 ? `Includes ${st.pendingOrders} order(s) still waiting on payment` : "Nothing to pack"}
          />
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Online store (last 7 days)
        </h2>
        <p className="mb-3 text-sm text-slate-600 dark:text-slate-400">
          A light view of browsing and checkouts. For more detail, open <Link className="text-[#2563EB] underline" href="/admin/analytics">Analytics</Link>
          .
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatGlassCard
            label="People who viewed their cart"
            value={st ? st.cartViews7d : "—"}
            hint="Helps you see interest in the shop"
          />
          <StatGlassCard
            label="People who started checkout"
            value={st ? st.checkoutStarted7d : "—"}
            hint="Began the payment step"
          />
          <StatGlassCard
            label="Online purchases completed"
            value={st ? st.paidOrders7d : "—"}
            hint={conv !== null && st ? `About ${conv} of checkout starters paid this week` : st ? "No data yet" : "—"}
          />
          <StatGlassCard
            label="Carts with items, left for 24+ hours"
            value={st ? st.staleCarts24h : "—"}
            hint="Might be worth a friendly nudge (if you use reminders)"
          />
        </div>
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-500">
          “Follow-up” reminder emails (if you use that feature) sent in the last week: {st ? st.reminders7d : "—"}.
        </p>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <GlassCard>
          <h2 className="font-serif text-lg text-sky-900 dark:text-sky-200">Latest online orders</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Newest first. “Payment” and “Delivery” are shown in plain English.</p>
          {st && st.recentOrders.length ? (
            <div className="mt-3 overflow-x-auto rounded-2xl border border-slate-200 dark:border-white/10">
              <table className="w-full min-w-[600px] text-left text-sm">
                <thead className="bg-sky-50/50 text-slate-600 dark:bg-slate-800/70 dark:text-slate-200">
                  <tr>
                    <th className="p-2">When</th>
                    <th className="p-2">Customer</th>
                    <th className="p-2 text-right">Order total</th>
                    <th className="p-2">Payment</th>
                    <th className="p-2">Delivery</th>
                  </tr>
                </thead>
                <tbody>
                  {st.recentOrders.map((o) => (
                    <tr key={o.id} className="border-t border-sky-100/50 dark:border-white/10">
                      <td className="whitespace-nowrap p-2 text-xs text-slate-500">{orderWhen(o.created_at)}</td>
                      <td className="p-2 text-xs text-slate-600 dark:text-slate-300">{o.email}</td>
                      <td className="p-2 text-right font-medium text-slate-800 dark:text-slate-100">${o.total_amount}</td>
                      <td className="p-2 text-slate-700 dark:text-slate-200">{payPlain(o.payment_status)}</td>
                      <td className="p-2 text-slate-700 dark:text-slate-200">{shipPlain(o.fulfillment_status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">No online orders yet.</p>
          )}
          <p className="mt-3 text-right">
            <Link
              className="text-sm font-medium text-[#2563EB] hover:underline"
              href="/admin/orders"
            >
              See all orders →
            </Link>
          </p>
        </GlassCard>
        <GlassCard>
          <h2 className="font-serif text-lg text-sky-900 dark:text-sky-200">Low stock in the shop</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Products with 5 or fewer in stock. Restock when you can.</p>
          {st && st.lowInventory.length ? (
            <ul className="mt-2 space-y-2 text-sm">
              {st.lowInventory.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-white/10 dark:bg-slate-950"
                >
                  <span className="min-w-0 text-slate-700 dark:text-slate-200">{p.name}</span>
                  <span className="shrink-0 text-right text-xs text-slate-600 dark:text-slate-400">
                    <span className="font-medium tabular-nums text-slate-800 dark:text-slate-200">{p.stock_quantity}</span> left
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">Nothing is running low. Nice.</p>
          )}
          <p className="mt-3 text-right">
            <Link
              className="text-sm font-medium text-[#2563EB] hover:underline"
              href="/admin/store"
            >
              Manage store →
            </Link>
          </p>
        </GlassCard>
      </div>
    </div>
  );
}
