import { getSql, hasDatabase } from "@/lib/db";
import { getUserSession } from "@/lib/session";
import { BookingsTable } from "./BookingsTable";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminBookings() {
  const s = await getUserSession();
  if (s?.user?.role !== "admin") {
    redirect("/");
  }
  let rows: unknown[] = [];
  if (hasDatabase()) {
    const sql = getSql();
    const r = await sql`
      SELECT a.*, s.name AS service_name, u.name AS user_name, u.email
      FROM appointments a
      JOIN services s ON s.id = a.service_id
      JOIN users u ON u.id = a.user_id
      ORDER BY a.appointment_date DESC
    `;
    rows = r;
  }
  return (
    <div>
      <h1 className="font-serif text-3xl text-[#1E3A8A]">All bookings</h1>
      <BookingsTable rows={rows} />
    </div>
  );
}
