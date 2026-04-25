import { getSql } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { getStripeConfig } from "@/lib/stripe-config";
import { NextResponse } from "next/server";

export async function GET() {
  const u = await requireUser();
  if (u.error || u.user?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const sql = getSql();
  const totalBookings = (await sql`SELECT count(*)::int AS c FROM appointments`) as { c: number }[];
  const today = (await sql`
    SELECT count(*)::int AS c FROM appointments
    WHERE appointment_date = (now() AT TIME ZONE 'America/New_York')::date
  `) as { c: number }[];
  const store = (await sql`
    SELECT
      count(*)::int AS c,
      coalesce(sum(CASE WHEN payment_status = 'paid' THEN total_amount::numeric END), 0) AS rev
    FROM orders
  `) as { c: number; rev: string }[];
  const bookRev = (await sql`
    SELECT coalesce(sum(CASE WHEN payment_status = 'paid' THEN total_amount::numeric END), 0) AS r
    FROM appointments
  `) as { r: string }[];
  const paidAppt = (await sql`SELECT count(*)::int AS c FROM appointments WHERE payment_status = 'paid'`) as {
    c: number;
  }[];
  const unpaidAppt = (await sql`
    SELECT count(*)::int AS c FROM appointments
    WHERE payment_status IN ('pending', 'failed')
  `) as { c: number }[];
  const low = (await sql`
    SELECT id, name, stock_quantity FROM products
    WHERE is_active = true AND stock_quantity <= 5 AND stock_quantity > 0
    ORDER BY stock_quantity ASC
    LIMIT 8
  `) as { id: string; name: string; stock_quantity: number }[];
  const recentOrders = (await sql`
    SELECT o.id, o.total_amount, o.fulfillment_status, o.created_at, u.email
    FROM orders o
    JOIN users u ON u.id = o.user_id
    ORDER BY o.created_at DESC
    LIMIT 5
  `) as unknown[];
  const recentMsg = (await sql`
    SELECT m.body, m.created_at, c.id::text AS conversation_id, u.name AS from_name
    FROM messages m
    JOIN conversations c ON c.id = m.conversation_id
    JOIN users u ON u.id = m.sender_id
    ORDER BY m.created_at DESC
    LIMIT 5
  `) as unknown[];
  const recentNotif = (await sql`
    SELECT * FROM notifications ORDER BY created_at DESC LIMIT 5
  `) as unknown[];
  let stripeOk = false;
  try {
    await getStripeConfig();
    stripeOk = true;
  } catch {
    stripeOk = false;
  }
  const storeRev = parseFloat(store[0]?.rev || "0");
  const br = parseFloat(bookRev[0]?.r || "0");
  return NextResponse.json({
    totalBookings: totalBookings[0]?.c || 0,
    todayAppointments: today[0]?.c || 0,
    totalRevenue: storeRev + br,
    storeRevenue: String(storeRev),
    bookingRevenue: String(br),
    orderCount: store[0]?.c || 0,
    paidBookings: paidAppt[0]?.c || 0,
    unpaidOrPendingBookings: unpaidAppt[0]?.c || 0,
    lowInventory: low,
    recentOrders,
    recentMessages: recentMsg,
    recentNotifications: recentNotif,
    stripeConnected: stripeOk,
  });
}
