import { getSql } from "./db";

type Sql = ReturnType<typeof getSql>;

export type OrderTrackingEventRow = {
  id: string;
  order_id: string;
  fulfillment_status: string | null;
  message: string;
  source: string;
  created_at: string;
};

export async function insertOrderTrackingEvent(
  sql: Sql,
  p: {
    orderId: string;
    message: string;
    source: "fulfillment" | "tracking" | "label" | "admin_note" | "system";
    fulfillmentStatus: string | null;
  }
) {
  await sql`
    INSERT INTO order_tracking_events (order_id, fulfillment_status, message, source)
    VALUES (
      ${p.orderId}::uuid,
      ${p.fulfillmentStatus},
      ${p.message},
      ${p.source}
    )
  `;
}

export async function listOrderTrackingEvents(
  sql: Sql,
  orderId: string
): Promise<OrderTrackingEventRow[]> {
  return (await sql`
    SELECT id, order_id, fulfillment_status, message, source, created_at
    FROM order_tracking_events
    WHERE order_id = ${orderId}::uuid
    ORDER BY created_at DESC
  `) as OrderTrackingEventRow[];
}
