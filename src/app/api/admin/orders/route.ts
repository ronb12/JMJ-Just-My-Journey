import { getSql } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { NextResponse } from "next/server";
import { z } from "zod";

const itemSchema = z.object({
  productId: z.string().uuid().nullable().optional(),
  name: z.string().min(1),
  quantity: z.coerce.number().int().min(1),
  unitPrice: z.coerce.number().min(0),
});

const createSchema = z
  .object({
    userId: z.string().uuid(),
    totalAmount: z.coerce.number().min(0).optional(),
    items: z.array(itemSchema).optional(),
    paymentStatus: z.enum(["pending", "paid", "failed", "cancelled"]).default("pending"),
    fulfillmentStatus: z
      .enum(["unfulfilled", "processing", "shipped", "delivered", "cancelled"])
      .default("unfulfilled"),
  })
  .superRefine((b, ctx) => {
    const hasItems = (b.items?.length || 0) > 0;
    if (!hasItems && typeof b.totalAmount !== "number") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["totalAmount"],
        message: "totalAmount is required when no items are provided",
      });
    }
  });

export async function POST(req: Request) {
  const u = await requireAdmin();
  if (u.error) {
    return NextResponse.json({ error: u.error }, { status: 401 });
  }
  const b = createSchema.parse(await req.json().catch(() => ({})));
  const sql = getSql();

  let total = b.totalAmount ?? 0;
  if ((b.items?.length || 0) > 0) {
    total = 0;
    for (const it of b.items!) {
      const line = Math.round(it.quantity * it.unitPrice * 100) / 100;
      total += line;
    }
    total = Math.round(total * 100) / 100;
  }

  const r = (await sql`
    INSERT INTO orders (user_id, total_amount, payment_status, fulfillment_status)
    VALUES (
      ${b.userId}::uuid,
      ${String(total)}::numeric,
      ${b.paymentStatus},
      ${b.fulfillmentStatus}
    )
    RETURNING id
  `) as { id: string }[];

  const orderId = r[0]!.id;
  if ((b.items?.length || 0) > 0) {
    for (const it of b.items!) {
      const line = Math.round(it.quantity * it.unitPrice * 100) / 100;
      await sql`
        INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, line_total)
        VALUES (
          ${orderId}::uuid,
          ${it.productId ?? null}::uuid,
          ${it.name},
          ${it.quantity},
          ${String(it.unitPrice)}::numeric,
          ${String(line)}::numeric
        )
      `;
    }
  }

  return NextResponse.json({ id: orderId });
}

