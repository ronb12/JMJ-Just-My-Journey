import { getDashboardData, requireUserId } from "@/lib/data/dashboard";
import { GlassCard } from "@/components/ui/GlassCard";
import Link from "next/link";
import { LuxuryButton } from "@/components/ui/LuxuryButton";

export const dynamic = "force-dynamic";

export default async function CustomerDashboard() {
  const { userId } = await requireUserId();
  if (!userId) {
    return null;
  }
  const d = await getDashboardData(userId);
  return (
    <div className="space-y-4">
      <h1 className="font-serif text-3xl text-[#1E3A8A]">Your journey</h1>
      <div className="grid gap-4 md:grid-cols-2">
        <GlassCard>
          <h2 className="font-serif text-xl">Upcoming</h2>
          {d.upcoming.length ? (
            <ul className="mt-2 space-y-1 text-sm text-slate-600">
              {d.upcoming.map((a) => (
                <li key={a.id}>
                  {a.service_name} &middot; {String(a.appointment_date || "")}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-slate-500">No upcoming sessions.</p>
          )}
        </GlassCard>
        <GlassCard>
          <h2 className="font-serif text-xl">Messages & alerts</h2>
          <p className="mt-2 text-sm text-slate-600">
            Unread notifications: {d.notifCount}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Link href="/dashboard/messages">
              <LuxuryButton type="button" className="!px-3 !py-1.5 text-xs">
                Inbox
              </LuxuryButton>
            </Link>
            <Link href="/dashboard/notifications">
              <LuxuryButton type="button" variant="ghost" className="!px-3 !py-1.5 text-xs">
                All notifications
              </LuxuryButton>
            </Link>
          </div>
        </GlassCard>
      </div>
      <GlassCard>
        <h2 className="font-serif text-xl">Recent orders</h2>
        {d.orders.length ? (
          <ul className="mt-2 space-y-1 text-sm">
            {d.orders.map((o) => (
              <li key={o.id} className="text-slate-600">
                #{o.id.slice(0, 8)} — ${o.total_amount} &middot; {o.fulfillment_status} &middot;{" "}
                {o.payment_status}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-slate-500">No orders yet.</p>
        )}
      </GlassCard>
    </div>
  );
}
