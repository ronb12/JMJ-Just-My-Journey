import { getMemberships } from "@/lib/data/public";
import { MembershipsClient } from "./MembershipsClient";
import { FadeIn } from "@/components/ui/FadeIn";

export const dynamic = "force-dynamic";

export default async function MembershipsPage() {
  const memberships = await getMemberships();
  return (
    <div className="jmj-container py-10">
      <FadeIn>
        <h1 className="font-serif text-4xl text-[#1E3A8A]">Memberships</h1>
        <p className="mt-2 text-slate-600">Monthly self-care. Subscription handled through Stripe.</p>
      </FadeIn>
      <MembershipsClient memberships={memberships} />
    </div>
  );
}
