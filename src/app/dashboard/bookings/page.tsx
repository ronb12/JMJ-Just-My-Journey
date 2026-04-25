import { getSql, hasDatabase } from "@/lib/db";
import { getUserSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { CustomerBookingsClient } from "./CustomerBookingsClient";

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
      <CustomerBookingsClient initial={rows as any} />
    </div>
  );
}
