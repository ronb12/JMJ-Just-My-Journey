import { getProviders, getServices } from "@/lib/data/public";
import { BookingForm } from "./BookingForm";

export const dynamic = "force-dynamic";

export default async function BookingPage() {
  const [services, providers] = await Promise.all([getServices(), getProviders()]);
  return (
    <div className="jmj-container py-10">
      <h1 className="font-serif text-4xl text-[#1E3A8A]">Book a session</h1>
      <p className="mt-2 text-slate-600">Select a service, provider, and time. Pay securely with Stripe.</p>
      <BookingForm services={services} providers={providers} />
    </div>
  );
}
