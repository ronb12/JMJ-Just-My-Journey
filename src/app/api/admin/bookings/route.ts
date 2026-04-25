import { getSql } from "@/lib/db";
import { createNotification } from "@/lib/notify";
import { requireUser } from "@/lib/session";
import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  userId: z.string().uuid(),
  serviceId: z.string().uuid(),
  providerId: z.string().uuid().optional().nullable(),
  appointmentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  appointmentTime: z.string().regex(/^\d{2}:\d{2}/),
  notes: z.string().max(2000).optional().nullable(),
  paymentStatus: z.enum(["pending", "paid", "failed"]).default("pending"),
});

export async function POST(req: Request) {
  const u = await requireUser();
  if (u.error || u.user?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const b = schema.parse(await req.json().catch(() => ({})));
  const sql = getSql();

  const svc = (await sql`
    SELECT id, name, price FROM services WHERE id = ${b.serviceId}::uuid AND is_active = true LIMIT 1
  `) as { id: string; name: string; price: string | null }[];
  if (!svc[0]) return NextResponse.json({ error: "Service not found" }, { status: 404 });

  const price = svc[0].price ? parseFloat(svc[0].price) : 0;

  const n = (await sql`
    INSERT INTO appointments (
      user_id, service_id, provider_id, appointment_date, appointment_time,
      status, payment_status, total_amount, notes
    ) VALUES (
      ${b.userId}::uuid,
      ${b.serviceId}::uuid,
      ${b.providerId ?? null}::uuid,
      ${b.appointmentDate}::date,
      ${b.appointmentTime}::time,
      'confirmed',
      ${b.paymentStatus},
      ${String(price)}::numeric,
      ${b.notes ?? null}
    )
    RETURNING id
  `) as { id: string }[];

  await createNotification({
    userId: b.userId,
    title: "Booking confirmed",
    message: `A ${svc[0].name} appointment has been booked for you on ${b.appointmentDate}.`,
    type: "booking_created",
    linkUrl: "/dashboard/bookings",
  });

  return NextResponse.json({ id: n[0].id });
}

export async function DELETE(req: Request) {
  const u = await requireUser();
  if (u.error || u.user?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const id = z.string().uuid().parse(new URL(req.url).searchParams.get("id"));
  const sql = getSql();
  try {
    const del = (await sql`
      DELETE FROM appointments
      WHERE id = ${id}::uuid
      RETURNING id
    `) as { id: string }[];
    if (!del[0]) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const err = e as { code?: string };
    if (err?.code === "23503") {
      return NextResponse.json(
        { error: "Cannot delete booking because it has related records." },
        { status: 409 }
      );
    }
    throw e;
  }
}
