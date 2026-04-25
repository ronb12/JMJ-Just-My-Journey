import { getSql } from "@/lib/db";
import { createNotification, getAdminUserIds } from "@/lib/notify";
import { requireAdmin, requireUser } from "@/lib/session";
import { NextResponse } from "next/server";
import { z } from "zod";

const create = z.object({
  serviceId: z.string().uuid(),
  providerId: z.string().uuid().optional().nullable(),
  appointmentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  appointmentTime: z.string().regex(/^\d{2}:\d{2}/),
  notes: z.string().max(2000).optional().nullable(),
});

export async function GET() {
  const u = await requireUser();
  if (u.error) {
    return NextResponse.json({ error: u.error }, { status: 401 });
  }
  const sql = getSql();
  if (u.user?.role === "admin") {
    const rows = (await sql`
      SELECT a.*, s.name AS service_name, u.name AS user_name, u.email AS user_email, p.name AS provider_name
      FROM appointments a
      JOIN services s ON s.id = a.service_id
      JOIN users u ON u.id = a.user_id
      LEFT JOIN providers p ON p.id = a.provider_id
      ORDER BY a.appointment_date DESC, a.appointment_time DESC
      LIMIT 200
    `) as unknown[];
    return NextResponse.json({ appointments: rows });
  }
  const rows = (await sql`
    SELECT a.*, s.name AS service_name, p.name AS provider_name
    FROM appointments a
    JOIN services s ON s.id = a.service_id
    LEFT JOIN providers p ON p.id = a.provider_id
    WHERE a.user_id = ${u.user!.id}::uuid
    ORDER BY a.appointment_date DESC, a.appointment_time DESC
  `) as unknown[];
  return NextResponse.json({ appointments: rows });
}

export async function POST(req: Request) {
  const u = await requireUser();
  if (u.error) {
    return NextResponse.json({ error: u.error }, { status: 401 });
  }
  const b = create.parse(await req.json().catch(() => ({})));
  const sql = getSql();
  const s = (await sql`
    SELECT id, name, price FROM services WHERE id = ${b.serviceId}::uuid AND is_active = true
  `) as { id: string; name: string; price: string | null }[];
  if (!s[0]) {
    return NextResponse.json({ error: "Service not found" }, { status: 404 });
  }
  if (b.providerId) {
    const pr = (await sql`SELECT id FROM providers WHERE id = ${b.providerId}::uuid AND is_active = true`) as { id: string }[];
    if (!pr[0]) {
      return NextResponse.json({ error: "Provider not found" }, { status: 400 });
    }
  }
  const price = s[0].price ? parseFloat(s[0].price) : 0;
  const n = (await sql`
    INSERT INTO appointments (
      user_id, service_id, provider_id, appointment_date, appointment_time, status, payment_status, total_amount, notes
    ) VALUES (
      ${u.user!.id}::uuid,
      ${b.serviceId}::uuid,
      ${b.providerId ? b.providerId : null}::uuid,
      ${b.appointmentDate}::date,
      ${b.appointmentTime}::time,
      'pending',
      'pending',
      ${String(price)}::numeric,
      ${b.notes ?? null}
    )
    RETURNING id, total_amount, appointment_date, appointment_time
  `) as { id: string; total_amount: string; appointment_date: string; appointment_time: string }[];
  for (const admin of await getAdminUserIds()) {
    await createNotification({
      userId: admin,
      title: "New booking request",
      message: `New ${s[0].name} appointment for ${b.appointmentDate}`,
      type: "booking_created",
      linkUrl: "/admin/bookings",
    });
    break;
  }
  return NextResponse.json({ appointment: n[0] });
}

export async function PATCH(req: Request) {
  const u = await requireAdmin();
  if (u.error) {
    return NextResponse.json({ error: u.error }, { status: u.error === "Forbidden" ? 403 : 401 });
  }
  const b = z
    .object({
      id: z.string().uuid(),
      status: z.enum(["pending", "confirmed", "completed", "cancelled"]).optional(),
    })
    .parse(await req.json().catch(() => ({})));
  if (!b.status) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }
  const sql = getSql();
  const row = (await sql`SELECT id, user_id, service_id FROM appointments WHERE id = ${b.id}::uuid LIMIT 1`) as {
    id: string;
    user_id: string;
  }[];
  if (!row[0]) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await sql`UPDATE appointments SET status = ${b.status}, updated_at = now() WHERE id = ${b.id}::uuid`;
  if (b.status) {
    const titles: Record<string, string> = {
      confirmed: "Booking confirmed",
      completed: "Appointment completed",
      cancelled: "Booking cancelled",
    };
    await createNotification({
      userId: row[0].user_id,
      title: titles[b.status] || "Booking update",
      message: `Your appointment was updated to: ${b.status}.`,
      type: `booking_${b.status}`,
      linkUrl: "/dashboard/bookings",
    });
  }
  return NextResponse.json({ ok: true });
}
