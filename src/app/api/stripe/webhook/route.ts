import { logAnalyticsEvent } from "@/lib/analytics";
import { getSql } from "@/lib/db";
import { createNotification, getAdminUserIds } from "@/lib/notify";
import { getStripeClient } from "@/lib/stripe-config";
import { NextResponse } from "next/server";
import type Stripe from "stripe";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const whSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!whSecret) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }
  const stripe = await getStripeClient();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, whSecret);
  } catch (e) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }
  const sql = getSql();

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const meta = session.metadata || {};
    const type = meta.checkoutType;

    if (type === "booking" && meta.appointmentId) {
      await sql`
        UPDATE appointments
        SET
          payment_status = 'paid',
          stripe_session_id = ${session.id},
          status = 'confirmed',
          updated_at = now()
        WHERE id = ${meta.appointmentId}::uuid
      `;
      if (meta.userId) {
        await createNotification({
          userId: meta.userId,
          title: "Payment successful",
          message: "Your spa appointment is paid and confirmed.",
          type: "payment_success",
          linkUrl: "/dashboard/bookings",
        });
      }
    }

    if (type === "store" && meta.orderId) {
      const orderRows = (await sql`
        SELECT o.id, oi.product_id, oi.quantity, p.stock_quantity, o.user_id
        FROM orders o
        JOIN order_items oi ON oi.order_id = o.id
        JOIN products p ON p.id = oi.product_id
        WHERE o.id = ${meta.orderId}::uuid
      `) as { id: string; product_id: string; quantity: number; stock_quantity: number; user_id: string }[];

      for (const r of orderRows) {
        await sql`
          UPDATE products
          SET
            stock_quantity = stock_quantity - ${r.quantity},
            updated_at = now()
          WHERE id = ${r.product_id}::uuid
        `;
      }
      await sql`
        UPDATE orders
        SET
          payment_status = 'paid',
          stripe_session_id = ${session.id},
          updated_at = now()
        WHERE id = ${meta.orderId}::uuid
      `;
      const u = orderRows[0];
      if (u?.user_id) {
        await createNotification({
          userId: u.user_id,
          title: "Order paid",
          message: "We received your payment. Your order is being prepared.",
          type: "order_paid",
          linkUrl: "/dashboard/orders",
        });
        const amt = (await sql`
          SELECT total_amount FROM orders WHERE id = ${meta.orderId}::uuid LIMIT 1
        `) as { total_amount: string | null }[];
        await logAnalyticsEvent({
          name: "store_order_paid",
          userId: u.user_id,
          properties: {
            orderId: meta.orderId,
            total: amt[0]?.total_amount ?? null,
            recoveredFromCart: true,
          },
        });
      }
    }

    if (type === "package" && meta.purchaseId) {
      await sql`
        UPDATE package_purchases
        SET
          payment_status = 'paid',
          status = 'purchased',
          stripe_session_id = ${session.id},
          updated_at = now()
        WHERE id = ${meta.purchaseId}::uuid
      `;
      if (meta.userId) {
        await createNotification({
          userId: meta.userId,
          title: "Package purchased",
          message: "Your wellness package is now active in your account.",
          type: "package_paid",
          linkUrl: "/dashboard",
        });
      }
    }

    if (type === "membership" && meta.purchaseId) {
      await sql`
        UPDATE membership_purchases
        SET
          payment_status = 'paid',
          status = 'active',
          stripe_session_id = ${session.id},
          updated_at = now()
        WHERE id = ${meta.purchaseId}::uuid
      `;
      if (meta.userId) {
        await createNotification({
          userId: meta.userId,
          title: "Membership active",
          message: "Your membership is now active.",
          type: "membership_paid",
          linkUrl: "/dashboard",
        });
      }
    }

    const st = session.customer;
    if (st && meta.userId && session.customer) {
      /* optional: store stripe customer id in users if we add a column; skipped for spec */
    }
  }

  if (event.type === "checkout.session.expired") {
    const session = event.data.object as Stripe.Checkout.Session;
    const meta = session.metadata || {};
    const type = meta.checkoutType;
    if (type === "booking" && meta.appointmentId) {
      await sql`UPDATE appointments SET payment_status = 'cancelled', updated_at = now() WHERE id = ${meta.appointmentId}::uuid`;
    }
    if (type === "store" && meta.orderId) {
      await sql`UPDATE orders SET payment_status = 'cancelled', updated_at = now() WHERE id = ${meta.orderId}::uuid`;
    }
    if (type === "package" && meta.purchaseId) {
      await sql`UPDATE package_purchases SET payment_status = 'cancelled', status = 'cancelled', updated_at = now() WHERE id = ${meta.purchaseId}::uuid`;
    }
    if (type === "membership" && meta.purchaseId) {
      await sql`UPDATE membership_purchases SET payment_status = 'cancelled', status = 'cancelled', updated_at = now() WHERE id = ${meta.purchaseId}::uuid`;
    }
    if (meta.userId) {
      await createNotification({
        userId: meta.userId,
        title: "Payment session expired",
        message: "The checkout session was not completed. You can try again anytime.",
        type: "payment_session_expired",
        linkUrl: "/checkout/cancel",
      });
    }
  }

  if (event.type === "payment_intent.payment_failed") {
    const pi = event.data.object as Stripe.PaymentIntent;
    const id = (pi as Stripe.PaymentIntent & { metadata: Record<string, string> }).metadata;
    if (id?.userId) {
      await createNotification({
        userId: id.userId,
        title: "Payment failed",
        message: "We could not process your payment. Please try another card or contact us.",
        type: "payment_failed",
        linkUrl: "/contact",
      });
    }
  }

  if (event.type === "checkout.session.completed" || event.type === "payment_intent.payment_failed") {
    for (const adminId of await getAdminUserIds()) {
      if (event.type === "checkout.session.completed" && (event.data.object as Stripe.Checkout.Session).metadata?.userId) {
        await createNotification({
          userId: adminId,
          title: "Revenue: checkout completed",
          message: "A new payment was received via Stripe.",
          type: "admin_revenue",
          linkUrl: "/admin",
        });
        break;
      }
    }
  }

  return NextResponse.json({ received: true });
}
