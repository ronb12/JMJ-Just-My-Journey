import { SessionProvider } from "@/components/providers/SessionProvider";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { GradientBackground } from "@/components/ui/GradientBackground";
import { Cormorant_Garamond, Outfit } from "next/font/google";
import type { Metadata, Viewport } from "next";
import Link from "next/link";
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

export const metadata: Metadata = {
  title: "JMJ — Just My Journey | Luxury Wellness & Spa",
  description:
    "Book luxury spa services, shop wellness products, and manage your self-care journey in one calming place.",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, title: "Just My Journey", statusBarStyle: "default" },
  icons: {
    icon: [
      { url: "/icons/jmj-favicon-16.png", type: "image/png", sizes: "16x16" },
      { url: "/icons/jmj-favicon-32.png", type: "image/png", sizes: "32x32" },
      { url: "/icons/jmj-icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/icons/jmj-mark.png", type: "image/png", sizes: "any" },
    ],
    apple: { url: "/icons/jmj-apple-180.png", sizes: "180x180" },
  },
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
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${cormorant.variable} h-full scroll-smooth`}
    >
      <body className="min-h-full bg-[#F3F4F6] text-slate-800">
        <SessionProvider>
          <GradientBackground />
          <div className="flex min-h-full flex-col">
            <SiteHeader />
            <main className="flex-1">{children}</main>
            <footer className="mt-auto border-t border-white/20 bg-gradient-to-b from-sky-50/40 to-slate-100/60 py-10">
              <div className="jmj-container flex flex-col gap-6 sm:flex-row sm:justify-between">
                <div>
                  <p className="font-serif text-xl text-[#1E3A8A]">JMJ — Just My Journey</p>
                  <p className="mt-1 max-w-sm text-sm text-slate-600">
                    Premium wellness, spa, and self-care in one calm experience.
                  </p>
                </div>
                <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                  <Link className="hover:text-[#2563EB]" href="/services">
                    Services
                  </Link>
                  <Link className="hover:text-[#2563EB]" href="/store">
                    Store
                  </Link>
                  <Link className="hover:text-[#2563EB]" href="/contact">
                    Contact
                  </Link>
                  <Link className="hover:text-[#2563EB]" href="/login">
                    Log in
                  </Link>
                </div>
              </div>
              <p className="jmj-container mt-6 text-center text-xs text-slate-400">
                &copy; {new Date().getFullYear()} JMJ. All rights reserved.
              </p>
            </footer>
          </div>
        </SessionProvider>
      </body>
    </html>
  );
}
