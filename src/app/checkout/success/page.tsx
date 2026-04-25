import { GlassCard } from "@/components/ui/GlassCard";
import Link from "next/link";
import { LuxuryButton } from "@/components/ui/LuxuryButton";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function CheckoutSuccessPage({ searchParams }: Props) {
  const sp = await searchParams;
  const type = typeof sp.type === "string" ? sp.type : "";
  return (
    <div className="jmj-container py-20">
      <GlassCard className="text-center">
        <h1 className="font-serif text-3xl text-[#1E3A8A]">Thank you</h1>
        <p className="mt-2 text-slate-600">
          {type
            ? `Your ${type} payment was received. We’ll email you a confirmation.`
            : "Your payment was received."}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Link href="/dashboard">
            <LuxuryButton type="button">Go to dashboard</LuxuryButton>
          </Link>
          <Link href="/">
            <LuxuryButton type="button" variant="ghost">
              Home
            </LuxuryButton>
          </Link>
        </div>
      </GlassCard>
    </div>
  );
}
