import { FadeIn } from "@/components/ui/FadeIn";
import { FloatingCard } from "@/components/ui/FloatingCard";
import { getServices } from "@/lib/data/public";
import Link from "next/link";
import { LuxuryButton } from "@/components/ui/LuxuryButton";

export const dynamic = "force-dynamic";

export default async function ServicesPage() {
  const services = await getServices();
  return (
    <div className="jmj-container py-12">
      <FadeIn>
        <h1 className="font-serif text-4xl text-[#1E3A8A]">Spa services</h1>
        <p className="mt-2 max-w-2xl text-slate-600">
          Curated treatments with transparent pricing. Every amount is confirmed from our database
          at checkout.
        </p>
      </FadeIn>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {services.map((s, i) => (
          <FloatingCard key={s.id} delay={i * 0.04}>
            <h2 className="font-serif text-2xl text-sky-900">{s.name}</h2>
            {s.description ? <p className="mt-2 text-slate-600">{s.description}</p> : null}
            <p className="mt-2 text-sm text-slate-500">
              {s.duration_minutes ? `${s.duration_minutes} min` : "Duration on request"}
            </p>
            <p className="mt-3 text-2xl text-[#2563EB]">{s.price != null ? `$${s.price}` : "—"}</p>
            <Link className="mt-4 inline-block" href="/booking">
              <LuxuryButton type="button">Book this</LuxuryButton>
            </Link>
          </FloatingCard>
        ))}
      </div>
    </div>
  );
}
