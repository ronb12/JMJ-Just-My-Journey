"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { LuxuryButton } from "@/components/ui/LuxuryButton";
import { Modal } from "@/components/ui/Modal";
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
  const [editing, setEditing] = useState<P | null>(null);
  const [adding, setAdding] = useState(false);
  return (
    <div className="mt-4 space-y-3">
      <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="bg-sky-50/50 text-slate-600">
            <tr>
              <th className="p-2">Name</th>
              <th className="p-2">Category</th>
              <th className="p-2 text-right">Price</th>
              <th className="p-2 text-right">Stock</th>
              <th className="p-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {list.map((p) => (
              <tr key={p.id} className="border-t border-sky-100/50">
                <td className="p-2">{p.name}</td>
                <td className="p-2">{p.category || "—"}</td>
                <td className="p-2 text-right">${p.price}</td>
                <td className="p-2 text-right">{p.stock_quantity}</td>
                <td className="p-2">
                  <div className="flex justify-end gap-2">
                    <LuxuryButton
                      type="button"
                      variant="ghost"
                      className="!px-3 !py-1.5 text-xs"
                      onClick={() => setEditing(p)}
                    >
                      Edit
                    </LuxuryButton>
                    <LuxuryButton
                      type="button"
                      variant="ghost"
                      className="!px-3 !py-1.5 text-xs"
                      onClick={async () => {
                        if (!confirm("Delete product? This cannot be undone.")) return;
                        const res = await fetch("/api/products?id=" + p.id, { method: "DELETE" });
                        if (!res.ok) {
                          const j = (await res.json().catch(() => ({}))) as { error?: string };
                          alert(j.error || "Could not delete");
                          return;
                        }
                        setList((l) => l.filter((x) => x.id !== p.id));
                      }}
                    >
                      Delete
                    </LuxuryButton>
                  </div>
                </td>
              </tr>
            ))}
            {list.length === 0 ? (
              <tr>
                <td className="p-3 text-slate-500" colSpan={5}>
                  No products yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      <LuxuryButton type="button" onClick={() => setAdding(true)}>
        + Add product
      </LuxuryButton>

      <Modal
        open={adding}
        title="Add product"
        onClose={() => setAdding(false)}
      >
        <Add
          onDone={() => {
            setAdding(false);
            r.refresh();
          }}
          categories={cats}
        />
      </Modal>

      <Modal
        open={Boolean(editing)}
        title="Edit product"
        onClose={() => setEditing(null)}
      >
        {editing ? (
          <Edit
            initial={editing}
            categories={cats}
            onDone={() => {
              setEditing(null);
              r.refresh();
            }}
          />
        ) : null}
      </Modal>
    </div>
  );
}

function Add({ onDone, categories }: { onDone: () => void; categories: string[] }) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("29");
  const [stock, setStock] = useState("20");
  const [cat, setCat] = useState(categories[0]);
  return (
    <div className="space-y-4">
      <div className="grid gap-3 text-sm sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="text-xs font-medium text-slate-600">Product name</label>
          <input
            className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Lavender Body Scrub"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600">Price (USD)</label>
          <input
            className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="29"
            inputMode="decimal"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600">Stock</label>
          <input
            className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            placeholder="20"
            inputMode="numeric"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs font-medium text-slate-600">Category</label>
          <select
            className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
            value={cat}
            onChange={(e) => setCat(e.target.value)}
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex justify-end">
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
          Save product
        </LuxuryButton>
      </div>
    </div>
  );
}

function Edit({
  initial,
  categories,
  onDone,
}: {
  initial: P;
  categories: string[];
  onDone: () => void;
}) {
  const [name, setName] = useState(initial.name);
  const [price, setPrice] = useState(String(initial.price));
  const [stock, setStock] = useState(String(initial.stock_quantity));
  const [cat, setCat] = useState(initial.category || categories[0]);
  return (
    <div className="space-y-4">
      <div className="grid gap-3 text-sm sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="text-xs font-medium text-slate-600">Product name</label>
          <input
            className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600">Price (USD)</label>
          <input
            className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            inputMode="decimal"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600">Stock</label>
          <input
            className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            inputMode="numeric"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs font-medium text-slate-600">Category</label>
          <select
            className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
            value={cat}
            onChange={(e) => setCat(e.target.value)}
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex justify-end">
        <LuxuryButton
          type="button"
          onClick={async () => {
            const res = await fetch("/api/products", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                id: initial.id,
                name,
                price: parseFloat(price) || 0,
                stock_quantity: parseInt(stock, 10) || 0,
                category: cat,
              }),
            });
            if (!res.ok) {
              const j = (await res.json().catch(() => ({}))) as { error?: string };
              alert(j.error || "Could not save");
              return;
            }
            onDone();
          }}
        >
          Save changes
        </LuxuryButton>
      </div>
    </div>
  );
}
