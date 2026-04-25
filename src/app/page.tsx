import { FadeIn } from "@/components/ui/FadeIn";
import { FloatingCard } from "@/components/ui/FloatingCard";
import { LuxuryButton } from "@/components/ui/LuxuryButton";
import { getMemberships, getPackages, getProducts, getServices } from "@/lib/data/public";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [services, products, packs, mems] = await Promise.all([
    getServices(),
    getProducts(),
    getPackages(),
    getMemberships(),
  ]);
  const feat = services.slice(0, 3);
  const storePrev = products.slice(0, 4);
  return (
    <div>
      <section className="jmj-container py-20 sm:py-28">
        <FadeIn>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-600/90">
            JMJ — Just My Journey
          </p>
          <h1 className="mt-3 max-w-3xl font-serif text-4xl font-semibold leading-tight text-[#1E3A8A] sm:text-5xl md:text-6xl">
            Your Wellness Journey Starts Here
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-slate-600 sm:text-xl">
            Book luxury spa services, shop wellness products, and manage your self-care journey in
            one calming place.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/booking">
              <LuxuryButton type="button">Book a Session</LuxuryButton>
            </Link>
            <Link href="/store">
              <LuxuryButton type="button" variant="teal">
                Shop Wellness Products
              </LuxuryButton>
            </Link>
          </div>
        </FadeIn>
      </section>
      <section className="jmj-container grid gap-4 py-6 md:grid-cols-2 lg:grid-cols-4">
        <Link href="/booking" className="block h-full">
          <FloatingCard>
            <h2 className="font-serif text-xl text-[#1E3A8A]">Appointments</h2>
            <p className="mt-2 text-sm text-slate-600">
              Choose a service, therapist, and time. Pay securely with Stripe.
            </p>
          </FloatingCard>
        </Link>
        <Link href="/store" className="block h-full">
          <FloatingCard delay={0.05}>
            <h2 className="font-serif text-xl text-[#1E3A8A]">Wellness Store</h2>
            <p className="mt-2 text-sm text-slate-600">
              Skincare, oils, journals, and spa bundles — shipped with care.
            </p>
          </FloatingCard>
        </Link>
        <Link href="/contact" className="block h-full">
          <FloatingCard delay={0.1}>
            <h2 className="font-serif text-xl text-[#1E3A8A]">Messages</h2>
            <p className="mt-2 text-sm text-slate-600">
              Reach our team anytime. Inbox syncs between you and the studio.
            </p>
          </FloatingCard>
        </Link>
        <Link href="/memberships" className="block h-full">
          <FloatingCard delay={0.15}>
            <h2 className="font-serif text-xl text-[#1E3A8A]">Memberships</h2>
            <p className="mt-2 text-sm text-slate-600">
              Ongoing care with monthly access and members-only benefits.
            </p>
          </FloatingCard>
        </Link>
      </section>
      <section className="jmj-container py-16">
        <h2 className="font-serif text-3xl text-[#1E3A8A]">Featured services</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {feat.map((s) => (
            <FloatingCard key={s.id}>
              <h3 className="font-serif text-lg text-sky-900">{s.name}</h3>
              {s.description ? <p className="mt-2 line-clamp-3 text-sm text-slate-600">{s.description}</p> : null}
              <p className="mt-3 text-lg text-[#2563EB]">
                {s.price != null ? `$${s.price}` : "—"}
              </p>
            </FloatingCard>
          ))}
        </div>
        <div className="mt-6">
          <Link href="/services">
            <LuxuryButton type="button" variant="ghost" className="!bg-white/40">
              View all services
            </LuxuryButton>
          </Link>
        </div>
      </section>
      <section className="jmj-container py-8">
        <h2 className="font-serif text-3xl text-[#1E3A8A]">Wellness store preview</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {storePrev.map((p) => (
            <div key={String(p.id)} className="text-sm text-slate-600">
              <p className="font-medium text-slate-800">{String(p.name)}</p>
              <p className="text-[#2563EB]">
                {p.price != null ? `$${p.price}` : "—"} · {String(p.category || "Wellness")}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-4">
          <Link href="/store">
            <LuxuryButton type="button" variant="teal">
              Open the store
            </LuxuryButton>
          </Link>
        </div>
      </section>
      <section className="jmj-container py-8">
        <h2 className="font-serif text-3xl text-[#1E3A8A]">Packages & memberships</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <FloatingCard>
            <h3 className="font-serif text-xl">Packages</h3>
            <ul className="mt-2 space-y-1 text-sm text-slate-600">
              {packs.slice(0, 3).map((p) => (
                <li key={p.id}>
                  {p.name} — {p.price != null ? `$${p.price}` : "—"}
                </li>
              ))}
            </ul>
            <Link className="mt-3 inline-block" href="/packages">
              <LuxuryButton type="button" variant="ghost" className="!px-3 !py-1.5 text-xs">
                Explore packages
              </LuxuryButton>
            </Link>
          </FloatingCard>
          <FloatingCard delay={0.05}>
            <h3 className="font-serif text-xl">Memberships</h3>
            <ul className="mt-2 space-y-1 text-sm text-slate-600">
              {mems.slice(0, 3).map((m) => (
                <li key={m.id}>
                  {m.name} — {m.monthly_price != null ? `$${m.monthly_price}/mo` : "—"}
                </li>
              ))}
            </ul>
            <Link className="mt-3 inline-block" href="/memberships">
              <LuxuryButton type="button" variant="ghost" className="!px-3 !py-1.5 text-xs">
                See memberships
              </LuxuryButton>
            </Link>
          </FloatingCard>
        </div>
      </section>
      <section className="jmj-container py-12">
        <h2 className="font-serif text-3xl text-[#1E3A8A]">How it works</h2>
        <ol className="mt-4 grid gap-4 md:grid-cols-3">
          {["Choose a service or product", "Review in your payment sheet", "Relax — we handle the rest"].map(
            (t, i) => (
              <FloatingCard key={t} delay={i * 0.05}>
                <p className="text-sm font-semibold text-sky-800">Step {i + 1}</p>
                <p className="mt-1 text-slate-700">{t}</p>
              </FloatingCard>
            )
          )}
        </ol>
      </section>
      <section className="jmj-container py-8">
        <h2 className="font-serif text-3xl text-[#1E3A8A]">Testimonials</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {[
            "A sanctuary in the city — the booking flow is effortless.",
            "The store quality matches the spa. My skin has never been calmer.",
            "Support replies feel human. JMJ is the standard I recommend.",
          ].map((q) => (
            <FloatingCard key={q}>
              <p className="text-sm leading-relaxed text-slate-700">&ldquo;{q}&rdquo;</p>
            </FloatingCard>
          ))}
        </div>
      </section>
      <section className="jmj-container py-16">
        <FloatingCard className="bg-gradient-to-br from-sky-50/80 to-white/60 text-center">
          <h2 className="font-serif text-2xl text-[#1E3A8A]">Begin your calm today</h2>
          <p className="mx-auto mt-2 max-w-lg text-slate-600">
            Your account brings appointments, orders, and messages into one blue, glass-smooth
            experience.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Link href="/register">
              <LuxuryButton type="button">Create account</LuxuryButton>
            </Link>
            <Link href="/contact">
              <LuxuryButton type="button" variant="ghost">
                Talk to us
              </LuxuryButton>
            </Link>
          </div>
        </FloatingCard>
      </section>
    </div>
  );
}
