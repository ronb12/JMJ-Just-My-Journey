import { getSql, hasDatabase } from "@/lib/db";
import { getUserSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { CustomerOrdersClient } from "./CustomerOrdersClient";

export const dynamic = "force-dynamic";

export default async function CustomerOrders() {
  const s = await getUserSession();
  if (!s?.user) {
    redirect("/login");
  }
  let rows: { id: string; total_amount: string; payment_status: string; fulfillment_status: string }[] = [];
  if (hasDatabase()) {
    const sql = getSql();
    const r = await sql`
      SELECT * FROM orders
      WHERE user_id = ${s.user.id}::uuid
      ORDER BY created_at DESC
    `;
    rows = r as typeof rows;
  }
  return (
    <div>
      <h1 className="font-serif text-3xl text-[#1E3A8A]">Orders</h1>
      <CustomerOrdersClient initial={rows as any} />
    </div>
  );
}
