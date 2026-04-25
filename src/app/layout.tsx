import { SessionProvider } from "@/components/providers/SessionProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { GradientBackground } from "@/components/ui/GradientBackground";
import { Cormorant_Garamond, Outfit } from "next/font/google";
import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { getSiteSettings } from "@/lib/site-settings";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

/** So favicons / social URLs resolve in prod. Set NEXT_PUBLIC_APP_URL on Vercel. */
const siteUrl = process.env.NEXT_PUBLIC_APP_URL
  || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "JMJ — Just My Journey | Luxury Wellness & Spa",
  description:
    "Book luxury spa services, shop wellness products, and manage your self-care journey in one calming place.",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, title: "Just My Journey", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#2563EB",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Note: this component is server-rendered; safe to read DB-backed site settings here.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const settingsPromise = getSiteSettings();
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${cormorant.variable} h-full scroll-smooth`}
    >
      <body className="min-h-full bg-[#F3F4F6] text-slate-800 dark:bg-slate-950 dark:text-slate-100">
        <SessionProvider>
          <ThemeProvider>
            <GradientBackground />
            <div className="flex min-h-full flex-col">
              <SiteHeader />
              <main className="flex-1">{children}</main>
              <footer className="mt-auto border-t border-white/20 bg-gradient-to-b from-sky-50/40 to-slate-100/60 py-10 dark:border-white/10 dark:from-slate-900 dark:to-slate-950">
              <div className="jmj-container grid gap-8 sm:grid-cols-3">
                <div>
                  <p className="font-serif text-xl text-[#1E3A8A]">JMJ — Just My Journey</p>
                  <p className="mt-1 max-w-sm text-sm text-slate-600">
                    Premium wellness, spa, and self-care in one calm experience.
                  </p>
                  <div className="mt-4 flex gap-3">
                    <SocialLinks settingsPromise={settingsPromise} />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-widest text-slate-500">Explore</p>
                  <div className="mt-3 flex flex-col gap-2 text-sm text-slate-600">
                    <Link className="hover:text-[#2563EB]" href="/services">Services</Link>
                    <Link className="hover:text-[#2563EB]" href="/packages">Packages</Link>
                    <Link className="hover:text-[#2563EB]" href="/memberships">Memberships</Link>
                    <Link className="hover:text-[#2563EB]" href="/store">Store</Link>
                    <Link className="hover:text-[#2563EB]" href="/about">About</Link>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-widest text-slate-500">Contact</p>
                  <div className="mt-3 flex flex-col gap-2 text-sm text-slate-600">
                    <Link className="hover:text-[#2563EB]" href="/contact">Send a message</Link>
                    <Link className="hover:text-[#2563EB]" href="/booking">Book a session</Link>
                    <Link className="hover:text-[#2563EB]" href="/login">Log in</Link>
                    <Link className="hover:text-[#2563EB]" href="/register">Create account</Link>
                  </div>
                </div>
              </div>
              <div className="jmj-container mt-8 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400">
                <span>&copy; {new Date().getFullYear()} JMJ — Just My Journey. All rights reserved.</span>
                <span>Created by Ronell Bradley</span>
                <span>Property of Bradley Virtual Solutions, LLC</span>
                <Link href="/privacy" className="hover:text-[#2563EB] transition-colors">Privacy Policy</Link>
                <Link href="/terms" className="hover:text-[#2563EB] transition-colors">Terms of Service</Link>
              </div>
              </footer>
            </div>
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}

async function SocialLinks({ settingsPromise }: { settingsPromise: ReturnType<typeof getSiteSettings> }) {
  const s = await settingsPromise;
  const links = [
    { key: "instagram_url", label: "Instagram", href: s.instagram_url },
    { key: "facebook_url", label: "Facebook", href: s.facebook_url },
    { key: "tiktok_url", label: "TikTok", href: s.tiktok_url },
    { key: "youtube_url", label: "YouTube", href: s.youtube_url },
    { key: "x_url", label: "X", href: s.x_url },
  ] as const;

  return (
    <>
      {links
        .filter((l) => Boolean(l.href))
        .map((l) => (
          <a
            key={l.key}
            href={l.href || "#"}
            aria-label={l.label}
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-400 hover:text-[#2563EB] transition-colors text-sm"
          >
            {l.label}
          </a>
        ))}
    </>
  );
}
