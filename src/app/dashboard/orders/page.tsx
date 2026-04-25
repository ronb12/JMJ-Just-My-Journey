import { getSql, hasDatabase } from "@/lib/db";
import { getUserSession } from "@/lib/session";
import { GlassCard } from "@/components/ui/GlassCard";
import { redirect } from "next/navigation";

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
      <div className="mt-4 space-y-2">
        {rows.map((o) => (
          <GlassCard key={o.id} className="!p-4">
            <p className="text-slate-800">Order #{o.id.slice(0, 8)}</p>
            <p className="text-sm text-slate-500">
              ${o.total_amount} &middot; {o.fulfillment_status} &middot; payment: {o.payment_status}
            </p>
          </GlassCard>
        ))}
        {rows.length === 0 ? <p className="text-slate-500">No orders yet.</p> : null}
      </div>
    </div>
  );
}
