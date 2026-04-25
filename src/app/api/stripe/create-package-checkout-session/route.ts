import { getSql } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { getStripeClient } from "@/lib/stripe-config";
import { NextResponse } from "next/server";
import { z } from "zod";

const body = z.object({ purchaseId: z.string().uuid() });

export async function POST(req: Request) {
  const u = await requireUser();
  if (u.error) {
    return NextResponse.json({ error: u.error }, { status: 401 });
  }
  const p = body.parse(await req.json().catch(() => ({})));
  const sql = getSql();
  const rows = (await sql`
    SELECT pp.id, pp.user_id, p.name, p.price
    FROM package_purchases pp
    JOIN packages p ON p.id = pp.package_id
    WHERE pp.id = ${p.purchaseId}::uuid
  `) as { id: string; user_id: string; name: string; price: string | null }[];
  const r = rows[0];
  if (!r) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (r.user_id !== u.user!.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const price = Number(r.price);
  if (!Number.isFinite(price) || price < 1) {
    return NextResponse.json({ error: "Invalid price" }, { status: 400 });
  }
  const cents = Math.round(price * 100);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
  const stripe = await getStripeClient();
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: Math.max(100, cents),
          product_data: { name: r.name, description: "Wellness package" },
        },
      },
    ],
    success_url: `${appUrl}/checkout/success?type=package&id=${r.id}`,
    cancel_url: `${appUrl}/checkout/cancel?type=package`,
    client_reference_id: u.user!.id,
    customer_email: u.user!.email ?? undefined,
    metadata: {
      checkoutType: "package",
      purchaseId: r.id,
      userId: u.user!.id,
    },
  });
  if (session.id) {
    await sql`UPDATE package_purchases SET stripe_session_id = ${session.id} WHERE id = ${r.id}::uuid`;
  }
  return NextResponse.json({ url: session.url, sessionId: session.id });
}
