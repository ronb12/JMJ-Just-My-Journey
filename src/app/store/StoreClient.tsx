"use client";

import { ProductGlassCard } from "@/components/ui/ProductGlassCard";
import { LuxuryButton } from "@/components/ui/LuxuryButton";

type P = {
  id: string;
  name: string;
  price: string;
  image_url: string | null;
  category: string | null;
  stock_quantity: number;
};

export function StoreClient({
  products,
  categories,
  initialQ,
  initialCategory,
}: {
  products: P[];
  categories: string[];
  initialQ: string;
  initialCategory: string;
}) {
  return (
    <div>
      <form method="get" action="/store" className="mt-6 flex flex-wrap items-end gap-2">
        <div className="min-w-[180px] flex-1">
          <label className="text-xs text-slate-500">Search</label>
          <input
            name="q"
            defaultValue={initialQ}
            placeholder="Search by name or description"
            className="mt-1 w-full rounded-2xl border border-white/40 bg-white/50 px-3 py-2"
          />
        </div>
        <div>
          <label className="text-xs text-slate-500">Category</label>
          <select
            name="category"
            defaultValue={initialCategory}
            className="mt-1 block w-full min-w-[160px] rounded-2xl border border-white/40 bg-white/50 px-3 py-2"
          >
            <option value="">All</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <LuxuryButton type="submit" className="!mt-4">
          Apply
        </LuxuryButton>
        <p className="self-center text-sm text-slate-500 sm:ml-2">
          {products.length} {products.length === 1 ? "item" : "items"}
        </p>
      </form>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((p) => (
          <ProductGlassCard
            key={p.id}
            id={p.id}
            name={p.name}
            price={p.price}
            imageUrl={p.image_url}
            category={p.category}
            href={`/store/product/${p.id}`}
          />
        ))}
      </div>
    </div>
  );
}
