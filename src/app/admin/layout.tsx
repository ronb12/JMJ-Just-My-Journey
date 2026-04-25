import { GlassCard } from "@/components/ui/GlassCard";
import { getUserSession } from "@/lib/session";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ReactNode } from "react";

const links: { href: string; label: string }[] = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/bookings", label: "Bookings" },
  { href: "/admin/customers", label: "Customers" },
  { href: "/admin/services", label: "Services" },
  { href: "/admin/packages", label: "Packages" },
  { href: "/admin/memberships", label: "Memberships" },
  { href: "/admin/providers", label: "Providers" },
  { href: "/admin/store", label: "Store" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/analytics", label: "Store activity" },
  { href: "/admin/messages", label: "Messages" },
  { href: "/admin/newsletter", label: "Newsletter" },
  { href: "/admin/notifications", label: "Notifications" },
  { href: "/admin/settings", label: "Settings" },
];

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const s = await getUserSession();
  if (!s?.user) {
    redirect("/login?callbackUrl=/admin");
  }
  if (s.user.role !== "admin") {
    redirect("/dashboard");
  }
  return (
    <div className="jmj-container flex flex-col gap-6 py-8 lg:flex-row">
      <aside className="w-full shrink-0 lg:max-w-xs">
        <GlassCard className="p-0">
          <p className="border-b border-sky-100/80 px-4 py-2 text-sm font-medium text-rose-500">
            Admin
          </p>
          <nav className="flex flex-col p-2">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="rounded-xl px-3 py-2 text-sm text-slate-700 hover:bg-rose-50/40 dark:text-slate-200 dark:hover:bg-white/5"
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
