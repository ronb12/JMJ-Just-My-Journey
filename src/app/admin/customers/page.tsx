import { getSql, hasDatabase } from "@/lib/db";
import { getUserSession } from "@/lib/session";
import { AdminCustomerForm } from "./AdminCustomerForm";
import { AdminCustomersClient } from "./AdminCustomersClient";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminCustomers() {
  const s = await getUserSession();
  if (s?.user?.role !== "admin") {
    redirect("/");
  }
  let list: { id: string; name: string | null; email: string; created_at: string }[] = [];
  if (hasDatabase()) {
    const sql = getSql();
    const rows = (await sql`
      SELECT id, name, email, created_at FROM users WHERE role = 'customer' ORDER BY created_at DESC
    `) as typeof list;
    list = rows;
  }
  return (
    <div>
      <h1 className="font-serif text-3xl text-[#1E3A8A]">Customers</h1>
      <div className="mt-4">
        <AdminCustomerForm />
      </div>
      <div className="mt-4 space-y-1">
        <AdminCustomersClient initial={list} />
      </div>
    </div>
  );
}
