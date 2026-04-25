import { GlassCard } from "@/components/ui/GlassCard";
import { getUserSession } from "@/lib/session";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ReactNode } from "react";

const links: { href: string; label: string }[] = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/bookings", label: "Bookings" },
  { href: "/dashboard/orders", label: "Orders" },
  { href: "/dashboard/messages", label: "Messages" },
  { href: "/dashboard/notifications", label: "Notifications" },
  { href: "/dashboard/profile", label: "Account" },
];

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const s = await getUserSession();
  if (!s?.user) {
    redirect("/login?callbackUrl=" + encodeURIComponent("/dashboard"));
  }
  if (s.user.role === "admin") {
    redirect("/admin");
  }
  return (
    <div className="jmj-container flex flex-col gap-6 py-8 lg:flex-row">
      <aside className="w-full shrink-0 lg:max-w-xs">
        <GlassCard className="p-0">
          <p className="border-b border-sky-100/80 px-4 py-3 text-sm text-slate-500">
            {s.user.email}
          </p>
          <nav className="flex flex-col p-2">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="rounded-xl px-3 py-2 text-sm text-slate-700 hover:bg-sky-50/60 dark:text-slate-200 dark:hover:bg-white/5"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </GlassCard>
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
