import { getUserSession } from "@/lib/session";
import { getSql, hasDatabase } from "@/lib/db";
import { redirect } from "next/navigation";
import { GlassCard } from "@/components/ui/GlassCard";

export const dynamic = "force-dynamic";

export default async function AdminNotifications() {
  const s = await getUserSession();
  if (s?.user?.role !== "admin") {
    redirect("/");
  }
  let notifs: { title: string; message: string; created_at: string }[] = [];
  if (hasDatabase()) {
    const sql = getSql();
    notifs = (await sql`SELECT * FROM notifications ORDER BY created_at DESC LIMIT 20`) as typeof notifs;
  }
  return (
    <div>
      <h1 className="font-serif text-3xl text-[#1E3A8A]">System notifications (latest)</h1>
      <div className="mt-4 space-y-2">
        {notifs.map((n, i) => (
          <GlassCard key={i} className="!p-3 text-sm">
            {n.title} &mdash; {n.message} &middot; {n.created_at}
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
