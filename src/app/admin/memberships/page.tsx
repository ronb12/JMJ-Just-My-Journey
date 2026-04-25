import { getUserSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { getSql } from "@/lib/db";
import { MembershipsEditor } from "./membershipsEditor";

export const dynamic = "force-dynamic";

export default async function AdminMemberships() {
  const s = await getUserSession();
  if (s?.user?.role !== "admin") redirect("/");

  const sql = getSql();
  const rows = (await sql`SELECT id, name, monthly_price, is_active FROM memberships ORDER BY name`) as {
    id: string;
    name: string;
    monthly_price: string | null;
    is_active: boolean;
  }[];

  return (
    <div>
      <h1 className="font-serif text-3xl text-[#1E3A8A]">Memberships</h1>
      <MembershipsEditor initial={rows} />
    </div>
  );
}

