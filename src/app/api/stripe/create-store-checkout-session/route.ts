import { getSql } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { getStripeClient } from "@/lib/stripe-config";
import { NextResponse } from "next/server";
import { z } from "zod";

const bodySchema = z.object({
  orderId: z.string().uuid(),
  shipping: z.object({
    name: z.string().min(1),
    email: z.string().email(),
    phone: z.string().optional().nullable(),
    line1: z.string().min(1),
    line2: z.string().optional().nullable(),
    city: z.string().min(1),
    state: z.string().min(1),
    zip: z.string().min(1),
  }),
});

export async function POST(req: Request) {
  const u = await requireUser();
  if (u.error) {
    return NextResponse.json({ error: u.error }, { status: 401 });
  }
  const parsed = bodySchema.parse(await req.json().catch(() => ({})));
  const sql = getSql();
  const { orderId, shipping } = parsed;

  const o = (await sql`
    SELECT o.id, o.user_id, o.total_amount, o.fulfillment_status, oi.product_id, oi.quantity, oi.line_total, p.name, p.price, p.stock_quantity, p.is_active
    FROM orders o
    JOIN order_items oi ON oi.order_id = o.id
    JOIN products p ON p.id = oi.product_id
    WHERE o.id = ${orderId}::uuid
  `) as {
    id: string;
    user_id: string;
    total_amount: string | null;
    fulfillment_status: string;
    product_id: string;
    quantity: number;
    line_total: string;
    name: string;
    price: string;
    stock_quantity: number;
    is_active: boolean;
  }[];

  if (!o.length) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  if (o[0].user_id !== u.user!.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  for (const r of o) {
    if (!r.is_active || r.stock_quantity < r.quantity) {
      return NextResponse.json(
        { error: `Not enough stock for product` },
        { status: 400 }
      );
    }
  }
  const totalServer = o.reduce(
    (acc, r) => acc + parseFloat(r.line_total),
    0
  );
  const lineItems = o.map((r) => {
    const cents = Math.round(parseFloat(r.line_total) * 100);
    return {
      quantity: 1,
      price_data: {
        currency: "usd" as const,
        unit_amount: Math.max(100, cents),
        product_data: { name: r.name, description: "Wellness product" },
      },
    };
  });
  if (!lineItems.length) {
    return NextResponse.json({ error: "Empty order" }, { status: 400 });
  }
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
  const stripe = await getStripeClient();
  const amountCheck = lineItems.reduce((s, l) => s + l.price_data!.unit_amount!, 0);
  if (Math.abs(amountCheck / 100 - totalServer) > 0.02) {
    return NextResponse.json({ error: "Price validation failed" }, { status: 500 });
  }
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: lineItems,
    success_url: `${appUrl}/checkout/success?type=store&id=${orderId}`,
    cancel_url: `${appUrl}/checkout/cancel?type=store`,
    client_reference_id: u.user!.id,
    customer_email: shipping.email || u.user!.email || undefined,
    metadata: {
      checkoutType: "store",
      orderId,
      userId: u.user!.id,
    },
  });
  if (session.id) {
    await sql`
      UPDATE orders SET
        stripe_session_id = ${session.id},
        shipping_name = ${shipping.name},
        shipping_email = ${shipping.email},
        shipping_phone = ${shipping.phone ?? null},
        shipping_address_line1 = ${shipping.line1},
        shipping_address_line2 = ${shipping.line2 ?? null},
        shipping_city = ${shipping.city},
        shipping_state = ${shipping.state},
        shipping_zip = ${shipping.zip},
        total_amount = ${String(totalServer)}::numeric,
        updated_at = now()
      WHERE id = ${orderId}::uuid
    `;
  }
  return NextResponse.json({ url: session.url, sessionId: session.id });
}
