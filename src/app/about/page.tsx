import { GlassCard } from "@/components/ui/GlassCard";
import { FadeIn } from "@/components/ui/FadeIn";

export default function AboutPage() {
  return (
    <div className="jmj-container max-w-3xl py-12">
      <FadeIn>
        <h1 className="font-serif text-4xl text-[#1E3A8A]">About JMJ</h1>
        <p className="mt-3 text-slate-600">
          JMJ — Just My Journey is a full-service wellness platform built to feel like a $100K luxury SaaS
          product: blue gradients, glass surfaces, and calm motion — without chaos or noise.
        </p>
      </FadeIn>
      <GlassCard className="mt-6">
        <h2 className="font-serif text-2xl text-sky-900">Our values</h2>
        <ul className="mt-3 list-disc pl-5 text-slate-600">
          <li>Transparent pricing, always verified on the server.</li>
          <li>Discreet messaging between you and our care team.</li>
          <li>Stripe-secured checkouts for services, store, and memberships.</li>
        </ul>
      </GlassCard>
    </div>
  );
}
