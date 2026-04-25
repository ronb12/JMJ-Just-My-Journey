import { getSql, hasDatabase } from "@/lib/db";
import { getUserSession } from "@/lib/session";
import { GlassCard } from "@/components/ui/GlassCard";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function BookingsPage() {
  const s = await getUserSession();
  if (!s?.user) {
    redirect("/login");
  }
  let rows: { id: string; service_name?: string; appointment_date?: string; status?: string; payment_status?: string; total_amount?: string }[] = [];
  if (hasDatabase()) {
    const sql = getSql();
    const r = await sql`
      SELECT a.*, s.name AS service_name
      FROM appointments a
      JOIN services s ON s.id = a.service_id
      WHERE a.user_id = ${s.user.id}::uuid
      ORDER BY a.appointment_date DESC
    `;
    rows = r as typeof rows;
  }
  return (
    <div>
      <h1 className="font-serif text-3xl text-[#1E3A8A]">Bookings</h1>
      <div className="mt-4 space-y-2">
        {rows.map((a) => (
          <GlassCard key={a.id} className="!p-4">
            <p className="font-medium text-slate-800">{a.service_name}</p>
            <p className="text-sm text-slate-500">
              {String(a.appointment_date)} &middot; {a.status} &middot; {a.payment_status} &middot; $
              {a.total_amount}
            </p>
          </GlassCard>
        ))}
        {rows.length === 0 ? <p className="text-slate-500">No appointments yet.</p> : null}
      </div>
    </div>
  );
}
