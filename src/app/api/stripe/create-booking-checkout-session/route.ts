import { getSql } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { getStripeClient } from "@/lib/stripe-config";
import { NextResponse } from "next/server";
import { z } from "zod";

const bodySchema = z.object({ appointmentId: z.string().uuid() });

export async function POST(req: Request) {
  const u = await requireUser();
  if (u.error) {
    return NextResponse.json({ error: u.error }, { status: 401 });
  }
  const body = bodySchema.parse(await req.json().catch(() => ({})));
  const sql = getSql();
  const appt = (await sql`
    SELECT a.id, a.user_id, a.service_id, a.total_amount, s.name AS service_name, s.price
    FROM appointments a
    JOIN services s ON s.id = a.service_id
    WHERE a.id = ${body.appointmentId}::uuid
  `) as { id: string; user_id: string; service_id: string; total_amount: string | null; service_name: string; price: string }[];

  const row = appt[0];
  if (!row) {
    return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
  }
  if (row.user_id !== u.user!.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const amountCents = Math.round(Number(row.total_amount || row.price) * 100);
  if (amountCents < 100) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  }
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
  const stripe = await getStripeClient();
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: amountCents,
          product_data: { name: row.service_name, description: "JMJ spa booking" },
        },
      },
    ],
    success_url: `${appUrl}/checkout/success?type=booking&id=${row.id}`,
    cancel_url: `${appUrl}/checkout/cancel?type=booking`,
    client_reference_id: u.user!.id,
    customer_email: u.user!.email ?? undefined,
    metadata: {
      checkoutType: "booking",
      appointmentId: row.id,
      userId: u.user!.id,
    },
  });
  if (session.id) {
    await sql`
      UPDATE appointments SET stripe_session_id = ${session.id}, updated_at = now() WHERE id = ${row.id}::uuid
    `;
  }
  return NextResponse.json({ url: session.url, sessionId: session.id });
}
