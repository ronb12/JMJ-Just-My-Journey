import { getPackages } from "@/lib/data/public";
import { PackagesClient } from "./PackagesClient";
import { FadeIn } from "@/components/ui/FadeIn";

export const dynamic = "force-dynamic";

export default async function PackagesPage() {
  const packages = await getPackages();
  return (
    <div className="jmj-container py-10">
      <FadeIn>
        <h1 className="font-serif text-4xl text-[#1E3A8A]">Wellness packages</h1>
        <p className="mt-2 text-slate-600">One-time wellness bundles. Checkout with Stripe.</p>
      </FadeIn>
      <PackagesClient packages={packages} />
    </div>
  );
}
