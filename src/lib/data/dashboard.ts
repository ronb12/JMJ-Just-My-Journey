import { getSql, hasDatabase } from "../db";
import { getUserSession } from "../session";

export type DashboardAppointmentRow = {
  id: string;
  service_name?: string;
  appointment_date?: string;
};

export type DashboardOrderRow = {
  id: string;
  total_amount: string;
  payment_status: string;
  fulfillment_status: string;
};

export type DashboardData = {
  upcoming: DashboardAppointmentRow[];
  past: DashboardAppointmentRow[];
  orders: DashboardOrderRow[];
  notifCount: number;
};

export async function getDashboardData(userId: string): Promise<DashboardData> {
  if (!hasDatabase()) {
    return { upcoming: [], past: [], orders: [], notifCount: 0 };
  }
  const sql = getSql();
  const [upcoming, past, orders, notif] = await Promise.all([
    sql`
      SELECT a.*, s.name AS service_name
      FROM appointments a
      JOIN services s ON s.id = a.service_id
      WHERE a.user_id = ${userId}::uuid
        AND a.appointment_date >= (now()::date)
      ORDER BY a.appointment_date ASC, a.appointment_time ASC
      LIMIT 5
    `,
    sql`
      SELECT a.*, s.name AS service_name
      FROM appointments a
      JOIN services s ON s.id = a.service_id
      WHERE a.user_id = ${userId}::uuid
        AND a.appointment_date < (now()::date)
      ORDER BY a.appointment_date DESC
      LIMIT 8
    `,
    sql`SELECT * FROM orders WHERE user_id = ${userId}::uuid ORDER BY created_at DESC LIMIT 5`,
    sql`SELECT count(*)::int AS c FROM notifications WHERE user_id = ${userId}::uuid AND is_read = false`,
  ]);
  return {
    upcoming: upcoming as DashboardAppointmentRow[],
    past: past as DashboardAppointmentRow[],
    orders: orders as DashboardOrderRow[],
    notifCount: (notif as { c: number }[])[0]?.c || 0,
  };
}

export async function requireUserId() {
  const s = await getUserSession();
  if (!s?.user?.id) {
    return { userId: null as null };
  }
  return { userId: s.user.id };
}
