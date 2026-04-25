import { ServiceEditor } from "./ServiceEditor";
import { getServices } from "@/lib/data/public";
import { getUserSession } from "@/lib/session";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminServices() {
  const s = await getUserSession();
  if (s?.user?.role !== "admin") {
    redirect("/");
  }
  const list = await getServices();
  return (
    <div>
      <h1 className="font-serif text-3xl text-[#1E3A8A]">Services</h1>
      <p className="text-sm text-slate-500">Add, edit, or soft-delete (deactivate) services.</p>
      <ServiceEditor initial={list} />
    </div>
  );
}
