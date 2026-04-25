import { CartClient } from "./CartClient";

export const dynamic = "force-dynamic";

export default function CartPage() {
  return (
    <div className="jmj-container py-10">
      <h1 className="font-serif text-4xl text-[#1E3A8A]">Your bag</h1>
      <p className="mt-2 text-slate-600">Update quantities, then check out with Stripe.</p>
      <CartClient />
    </div>
  );
}
