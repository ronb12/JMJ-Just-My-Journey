"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { LuxuryButton } from "@/components/ui/LuxuryButton";
import { useRouter } from "next/navigation";
import { useState } from "react";

type S = {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number | null;
  price: string | null;
};

export function ServiceEditor({ initial }: { initial: S[] }) {
  const r = useRouter();
  const [list, setList] = useState<S[]>(initial);
  return (
    <div className="mt-4 space-y-3">
      {list.map((s) => (
        <GlassCard key={s.id} className="!p-3">
          <p className="font-medium text-slate-800">{s.name}</p>
          <p className="text-sm text-slate-500">ID: {s.id}</p>
          <LuxuryButton
            className="mt-2"
            type="button"
            variant="ghost"
            onClick={async () => {
              if (!confirm("Deactivate this service?")) return;
              await fetch("/api/services?id=" + s.id, { method: "DELETE" });
              setList((l) => l.filter((x) => x.id !== s.id));
            }}
          >
            Deactivate
          </LuxuryButton>
        </GlassCard>
      ))}
      <AddForm
        onAdd={() => {
          r.refresh();
        }}
      />
    </div>
  );
}

function AddForm({ onAdd }: { onAdd: () => void }) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("99");
  const [desc, setDesc] = useState("");
  return (
    <GlassCard>
      <h2 className="font-serif text-lg">Add service</h2>
      <div className="mt-2 space-y-2 text-sm">
        <input
          className="w-full rounded-xl border border-white/40 bg-white/50 px-2 py-1"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
        />
        <input
          className="w-full rounded-xl border border-white/40 bg-white/50 px-2 py-1"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="Price (USD)"
        />
        <textarea
          className="w-full rounded-xl border border-white/40 bg-white/50 px-2 py-1"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="Description"
        />
        <LuxuryButton
          type="button"
          onClick={async () => {
            await fetch("/api/services", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ name, price: parseFloat(price) || 0, description: desc || null, duration_minutes: 60 }),
            });
            onAdd();
            setName("");
            setDesc("");
            setPrice("99");
          }}
        >
          Save
        </LuxuryButton>
      </div>
    </GlassCard>
  );
}
