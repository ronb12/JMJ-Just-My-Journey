"use client";

import { NotificationDropdown } from "@/components/ui/NotificationDropdown";
import { cn } from "@/lib/cn";
import { signOut, useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { LuxuryButton } from "../ui/LuxuryButton";

const nav = [
  { href: "/services", label: "Services" },
  { href: "/booking", label: "Book" },
  { href: "/packages", label: "Packages" },
  { href: "/memberships", label: "Memberships" },
  { href: "/store", label: "Store" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

type N = {
  id: string;
  title: string;
  message: string;
  created_at: string;
  is_read: boolean;
  link_url: string | null;
};

export function SiteHeader() {
  const { data: s } = useSession();
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [dd, setDd] = useState(false);
  const [notifs, setNotifs] = useState<N[]>([]);
  const { theme, setTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const currentTheme = useMemo(() => {
    if (!mounted) return "light";
    return theme === "system" ? systemTheme ?? "light" : theme ?? "light";
  }, [mounted, theme, systemTheme]);

  const load = useCallback(() => {
    if (!s?.user) {
      setNotifs([]);
      return;
    }
    void fetch("/api/notifications")
      .then((r) => r.json())
      .then((d) => setNotifs((d.notifications as N[]) || []))
      .catch(() => setNotifs([]));
  }, [s?.user]);
  useEffect(() => {
    load();
  }, [load]);
  const unread = notifs.filter((n) => !n.is_read).length;
  return (
    <header className="sticky top-0 z-40 border-b border-white/30 bg-white/40 shadow-sm shadow-sky-900/5 backdrop-blur-md dark:border-white/10 dark:bg-slate-950/60 dark:shadow-none">
      <div className="jmj-container flex items-center justify-between py-3">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/icons/jmj-icon-192.png"
            alt="JMJ"
            width={32}
            height={32}
            className="butterfly-flutter rounded-lg object-cover"
          />
          <span className="font-serif text-2xl font-semibold tracking-tight text-[#1E3A8A] sm:text-3xl">
            JMJ
          </span>
        </Link>
        <button
          type="button"
          className="rounded-2xl border border-white/40 p-2 md:hidden dark:border-white/15"
          onClick={() => setOpen((o) => !o)}
          aria-label="Open menu"
        >
          <span className="text-xl">&#9776;</span>
        </button>
        <nav
          className={cn(
            "absolute left-0 right-0 top-full z-30 flex-col gap-1 border-b border-white/30 bg-white/90 p-4 backdrop-blur md:static md:flex md:flex-row md:items-center md:gap-1 md:border-0 md:bg-transparent md:p-0 dark:border-white/10 dark:bg-slate-950/90",
            open ? "flex" : "hidden md:flex"
          )}
        >
          {nav.map((i) => (
            <Link
              key={i.href}
              href={i.href}
              className={cn(
                "rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-white/50 dark:text-slate-200 dark:hover:bg-white/10",
                path === i.href && "text-[#2563EB] bg-sky-50/80 dark:bg-white/10"
              )}
            >
              {i.label}
            </Link>
          ))}
          {s?.user ? (
            <>
              <Link
                href={s.user.role === "admin" ? "/admin" : "/dashboard"}
                className="rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-white/50 dark:text-slate-200 dark:hover:bg-white/10"
              >
                {s.user.role === "admin" ? "Admin" : "My journey"}
              </Link>
            </>
          ) : null}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          <button
            type="button"
            className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
            onClick={() => setTheme(currentTheme === "dark" ? "light" : "dark")}
            aria-label="Toggle dark mode"
          >
            {currentTheme === "dark" ? "Light" : "Dark"}
          </button>
          {s?.user ? (
            <>
              <NotificationDropdown
                open={dd}
                onToggle={() => setDd((d) => !d)}
                onClose={() => setDd(false)}
                items={notifs}
                unread={unread}
                onMarkAll={async () => {
                  await fetch("/api/notifications/mark-all-read", { method: "POST" });
                  load();
                }}
                onMark={async (id) => {
                  await fetch("/api/notifications/mark-read", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id }),
                  });
                  load();
                }}
                onDelete={async (id) => {
                  await fetch(`/api/notifications/${id}`, { method: "DELETE" });
                  load();
                }}
              />
              <span className="max-w-[9rem] truncate text-xs text-slate-500">{s.user.email}</span>
              <LuxuryButton
                type="button"
                variant="ghost"
                className="!px-3 !py-1.5 text-xs"
                onClick={() => signOut({ callbackUrl: "/" })}
              >
                Sign out
              </LuxuryButton>
            </>
          ) : (
            <>
              <Link href="/login">
                <LuxuryButton type="button" variant="ghost" className="!px-3 !py-1.5 text-xs">
                  Log in
                </LuxuryButton>
              </Link>
              <Link href="/register">
                <LuxuryButton type="button" className="!px-3 !py-1.5 text-xs">
                  Join
                </LuxuryButton>
              </Link>
            </>
          )}
        </div>
      </div>
      {s?.user && open ? (
        <div className="flex items-center justify-end gap-2 border-t border-white/20 px-4 py-2 md:hidden">
          <button
            type="button"
            className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
            onClick={() => setTheme(currentTheme === "dark" ? "light" : "dark")}
            aria-label="Toggle dark mode"
          >
            {currentTheme === "dark" ? "Light" : "Dark"}
          </button>
          <NotificationDropdown
            open={dd}
            onToggle={() => setDd((d) => !d)}
            onClose={() => setDd(false)}
            items={notifs}
            unread={unread}
            onMarkAll={async () => {
              await fetch("/api/notifications/mark-all-read", { method: "POST" });
              load();
            }}
            onMark={async (id) => {
              await fetch("/api/notifications/mark-read", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id }),
              });
              load();
            }}
            onDelete={async (id) => {
              await fetch(`/api/notifications/${id}`, { method: "DELETE" });
              load();
            }}
          />
        </div>
      ) : null}
    </header>
  );
}
