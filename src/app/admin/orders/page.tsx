import { getSql, hasDatabase } from "@/lib/db";
import { getUserSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { OrderAdmin } from "./OrderAdmin";
import { AdminOrderForm } from "./AdminOrderForm";

export const dynamic = "force-dynamic";

export default async function AdminOrders() {
  const s = await getUserSession();
  if (s?.user?.role !== "admin") {
    redirect("/");
  }
  let rows: unknown[] = [];
  if (hasDatabase()) {
    const sql = getSql();
    const r = await sql`
      SELECT o.*, u.name AS user_name, u.email
      FROM orders o
      JOIN users u ON u.id = o.user_id
      ORDER BY o.created_at DESC
    `;
    rows = r;
  }
  return (
    <div>
      <h1 className="font-serif text-3xl text-[#1E3A8A]">Orders</h1>
      <div className="mt-4">
        <AdminOrderForm />
      </div>
      <OrderAdmin rows={rows} />
    </div>
  );
}
