import { GlassCard } from "@/components/ui/GlassCard";
import Link from "next/link";
import { LuxuryButton } from "@/components/ui/LuxuryButton";

export default function CheckoutCancelPage() {
  return (
    <div className="jmj-container py-20">
      <GlassCard className="text-center">
        <h1 className="font-serif text-3xl text-[#1E3A8A]">Payment cancelled</h1>
        <p className="mt-2 text-slate-600">No charge was made. You can return anytime to complete checkout.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Link href="/store">
            <LuxuryButton type="button">Back to store</LuxuryButton>
          </Link>
          <Link href="/contact">
            <LuxuryButton type="button" variant="ghost">
              Contact us
            </LuxuryButton>
          </Link>
        </div>
      </GlassCard>
    </div>
  );
}
