import { getUserSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { getSql } from "@/lib/db";
import { ProvidersEditor } from "./providersEditor";

export const dynamic = "force-dynamic";

export default async function AdminProviders() {
  const s = await getUserSession();
  if (s?.user?.role !== "admin") redirect("/");

  const sql = getSql();
  const rows = (await sql`SELECT id, name, specialty, is_active FROM providers ORDER BY name`) as {
    id: string;
    name: string | null;
    specialty: string | null;
    is_active: boolean;
  }[];

  return (
    <div>
      <h1 className="font-serif text-3xl text-[#1E3A8A]">Providers</h1>
      <ProvidersEditor initial={rows} />
    </div>
  );
}

