import { getUserSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { getSql } from "@/lib/db";
import { PackagesEditor } from "./packagesEditor";

export const dynamic = "force-dynamic";

export default async function AdminPackages() {
  const s = await getUserSession();
  if (s?.user?.role !== "admin") redirect("/");

  const sql = getSql();
  const rows = (await sql`SELECT id, name, price, is_active FROM packages ORDER BY name`) as {
    id: string;
    name: string;
    price: string | null;
    is_active: boolean;
  }[];

  return (
    <div>
      <h1 className="font-serif text-3xl text-[#1E3A8A]">Packages</h1>
      <PackagesEditor initial={rows} />
    </div>
  );
}

