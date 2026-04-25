import { getSql } from "@/lib/db";
import { getEasyPostClient, getEasyPostFromAddress } from "@/lib/easypost";
import { insertOrderTrackingEvent } from "@/lib/order-tracking";
import { createNotification, getAdminUserIds } from "@/lib/notify";
import { requireAdmin } from "@/lib/session";
import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const ratesSchema = z.object({
  orderId: z.string().uuid(),
  parcel: z.object({
    weightOz: z.coerce.number().positive(),
    lengthIn: z.coerce.number().positive().optional(),
    widthIn: z.coerce.number().positive().optional(),
    heightIn: z.coerce.number().positive().optional(),
  }),
});

const buySchema = z.object({
  orderId: z.string().uuid(),
  shipmentId: z.string().min(3),
  rateId: z.string().min(3),
});

function isMissingColumnError(e: unknown) {
  return Boolean((e as { code?: string })?.code === "42703");
}
function isMissingTable(e: unknown) {
  return (e as { code?: string })?.code === "42P01";
}

export async function POST(req: Request) {
  const u = await requireAdmin();
  if (u.error) return NextResponse.json({ error: u.error }, { status: 401 });

  const url = new URL(req.url);
  const action = url.searchParams.get("action") || "rates";

  const sql = getSql();

  if (action === "rates") {
    const b = ratesSchema.parse(await req.json().catch(() => ({})));
    const rows = (await sql`
      SELECT
        id,
        shipping_name,
        shipping_email,
        shipping_phone,
        shipping_address_line1,
        shipping_address_line2,
        shipping_city,
        shipping_state,
        shipping_zip
      FROM orders
      WHERE id = ${b.orderId}::uuid
      LIMIT 1
    `) as {
      id: string;
      shipping_name: string | null;
      shipping_email: string | null;
      shipping_phone: string | null;
      shipping_address_line1: string | null;
      shipping_address_line2: string | null;
      shipping_city: string | null;
      shipping_state: string | null;
      shipping_zip: string | null;
    }[];
    const o = rows[0];
    if (!o) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    if (
      !o.shipping_name ||
      !o.shipping_address_line1 ||
      !o.shipping_city ||
      !o.shipping_state ||
      !o.shipping_zip
    ) {
      return NextResponse.json(
        { error: "Order is missing a shipping address. Complete checkout shipping first." },
        { status: 409 }
      );
    }

    const ep = getEasyPostClient();
    const from = getEasyPostFromAddress();

    const shipment = await ep.Shipment.create({
      to_address: {
        name: o.shipping_name,
        street1: o.shipping_address_line1,
        street2: o.shipping_address_line2 || undefined,
        city: o.shipping_city,
        state: o.shipping_state,
        zip: o.shipping_zip,
        country: "US",
        phone: o.shipping_phone || undefined,
        email: o.shipping_email || undefined,
      },
      from_address: {
        name: from.name,
        street1: from.street1,
        street2: from.street2 || undefined,
        city: from.city,
        state: from.state,
        zip: from.zip,
        country: from.country,
        phone: from.phone || undefined,
        email: from.email || undefined,
      },
      parcel: {
        weight: b.parcel.weightOz,
        length: b.parcel.lengthIn,
        width: b.parcel.widthIn,
        height: b.parcel.heightIn,
      },
    });

    const rates = (shipment.rates || [])
      .map((r) => ({
        id: String((r as { id?: string }).id || ""),
        carrier: String((r as { carrier?: string }).carrier || ""),
        service: String((r as { service?: string }).service || ""),
        rate: String((r as { rate?: string }).rate || ""),
        currency: String((r as { currency?: string }).currency || "USD"),
        delivery_days: (r as { delivery_days?: number | null }).delivery_days ?? null,
      }))
      .filter((r) => r.id && r.rate);

    return NextResponse.json({ shipmentId: shipment.id, rates });
  }

  if (action === "buy") {
    const b = buySchema.parse(await req.json().catch(() => ({})));
    const ep = getEasyPostClient();
    const shipment = await ep.Shipment.retrieve(b.shipmentId);
    const rate = (shipment.rates || []).find((r) => (r as { id?: string }).id === b.rateId);
    if (!rate) return NextResponse.json({ error: "Rate not found on shipment" }, { status: 404 });

    const bought = await ep.Shipment.buy(shipment.id, rate);
    const labelUrl = String(
      ((bought as unknown as { postage_label?: { label_url?: string } }).postage_label?.label_url as string) || ""
    );
    const trackingCode = String((bought as unknown as { tracking_code?: string }).tracking_code || "");

    if (!labelUrl) {
      return NextResponse.json({ error: "Label not available from EasyPost" }, { status: 502 });
    }

    try {
      await sql`
        UPDATE orders
        SET
          easypost_shipment_id = ${bought.id},
          easypost_rate_id = ${b.rateId},
          easypost_label_url = ${labelUrl},
          easypost_tracking_code = ${trackingCode || null},
          updated_at = now()
        WHERE id = ${b.orderId}::uuid
      `;
    } catch (e: unknown) {
      if (isMissingColumnError(e)) {
        return NextResponse.json(
          { error: "Shipping label columns missing. Run migration: migrations/006_orders_easypost.sql" },
          { status: 409 }
        );
      }
      throw e;
    }

    const oRow = (await sql`SELECT user_id, fulfillment_status FROM orders WHERE id = ${b.orderId}::uuid`) as {
      user_id: string;
      fulfillment_status: string;
    }[];
    const uid = oRow[0]?.user_id;
    const line = trackingCode
      ? `Shipping label created. Tracking: ${trackingCode}.`
      : "Shipping label created.";

    try {
      if (uid) {
        await insertOrderTrackingEvent(sql, {
          orderId: b.orderId,
          fulfillmentStatus: oRow[0]!.fulfillment_status,
          source: "label",
          message: line,
        });
        await createNotification({
          userId: uid,
          title: "Your order is on the way",
          message: line.slice(0, 500),
          type: "order_tracking",
          linkUrl: `/dashboard/orders?o=${b.orderId}`,
        });
        for (const adminId of await getAdminUserIds()) {
          await createNotification({
            userId: adminId,
            title: "Shipping label created",
            message: `Order #${b.orderId.slice(0, 8)} — label ready${trackingCode ? ` (${trackingCode})` : ""}.`,
            type: "admin_shipping",
            linkUrl: "/admin/orders",
          });
        }
      }
    } catch (e) {
      if (!isMissingTable(e)) {
        throw e;
      }
    }

    return NextResponse.json({
      ok: true,
      labelUrl,
      trackingCode: trackingCode || null,
      shipmentId: bought.id,
    });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

