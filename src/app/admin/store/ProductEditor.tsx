"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { LuxuryButton } from "@/components/ui/LuxuryButton";
import { useRouter } from "next/navigation";
import { useState } from "react";

type P = { id: string; name: string; price: string; stock_quantity: number; category: string | null };

const cats = [
  "Skincare",
  "Massage Oils",
  "Candles",
  "Bath Salts",
  "Body Scrubs",
  "Wellness Journals",
  "Gift Cards",
  "Spa Bundles",
];

export function ProductEditor({ initial }: { initial: P[] }) {
  const r = useRouter();
  const [list, setList] = useState<P[]>(initial);
  return (
    <div className="mt-4 space-y-3">
      {list.map((p) => (
        <GlassCard key={p.id} className="!p-3 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-medium text-slate-800">{p.name}</p>
              <p className="text-slate-500">
                ${p.price} &middot; {p.category} &middot; stock {p.stock_quantity}
              </p>
            </div>
            <LuxuryButton
              type="button"
              variant="ghost"
              onClick={async () => {
                if (!confirm("Deactivate product?")) return;
                await fetch("/api/products?id=" + p.id, { method: "DELETE" });
                setList((l) => l.filter((x) => x.id !== p.id));
              }}
            >
              Deactivate
            </LuxuryButton>
          </div>
        </GlassCard>
      ))}
      <GlassCard>
        <h2 className="font-serif text-lg">Add product</h2>
        <Add onDone={() => r.refresh()} categories={cats} />
      </GlassCard>
    </div>
  );
}

function Add({ onDone, categories }: { onDone: () => void; categories: string[] }) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("29");
  const [stock, setStock] = useState("20");
  const [cat, setCat] = useState(categories[0]);
  return (
    <div className="mt-2 space-y-2 text-sm">
      <input
        className="w-full rounded-xl border border-white/40 bg-white/50 px-2 py-1"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Name"
      />
      <div className="grid grid-cols-2 gap-2">
        <input
          className="rounded-xl border border-white/40 bg-white/50 px-2 py-1"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="Price"
        />
        <input
          className="rounded-xl border border-white/40 bg-white/50 px-2 py-1"
          value={stock}
          onChange={(e) => setStock(e.target.value)}
          placeholder="Stock"
        />
      </div>
      <select
        className="w-full rounded-xl border border-white/40 bg-white/50 px-2 py-1"
        value={cat}
        onChange={(e) => setCat(e.target.value)}
      >
        {categories.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
      <LuxuryButton
        type="button"
        onClick={async () => {
          await fetch("/api/products", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name,
              price: parseFloat(price) || 0,
              stock_quantity: parseInt(stock, 10) || 0,
              category: cat,
            }),
          });
          onDone();
        }}
      >
        Save
      </LuxuryButton>
    </div>
  );
}
