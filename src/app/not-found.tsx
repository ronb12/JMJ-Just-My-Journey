import Link from "next/link";
import { GlassCard } from "@/components/ui/GlassCard";
import { LuxuryButton } from "@/components/ui/LuxuryButton";

export default function NotFound() {
  return (
    <div className="jmj-container flex min-h-[50vh] items-center justify-center py-16">
      <GlassCard className="max-w-md text-center">
        <h1 className="font-serif text-2xl text-[#1E3A8A]">Page not found</h1>
        <p className="mt-2 text-slate-600">This path doesn&apos;t exist. Let&apos;s take you back.</p>
        <Link className="mt-4 inline-block" href="/">
          <LuxuryButton type="button">Home</LuxuryButton>
        </Link>
      </GlassCard>
    </div>
  );
}
