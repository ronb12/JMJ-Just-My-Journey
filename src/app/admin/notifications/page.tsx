import { getUserSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { AdminNotificationsClient } from "./AdminNotificationsClient";

export const dynamic = "force-dynamic";

export default async function AdminNotifications() {
  const s = await getUserSession();
  if (s?.user?.role !== "admin") {
    redirect("/");
  }
  return (
    <div>
      <h1 className="font-serif text-3xl text-[#1E3A8A]">System notifications (latest)</h1>
      <AdminNotificationsClient />
    </div>
  );
}
