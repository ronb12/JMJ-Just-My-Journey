"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { LuxuryButton } from "@/components/ui/LuxuryButton";
import { Modal } from "@/components/ui/Modal";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Row = { id: string; name: string; price: string | null; is_active: boolean };

export function PackagesEditor({ initial }: { initial: Row[] }) {
  const r = useRouter();
  const [list, setList] = useState<Row[]>(initial);
  const [editing, setEditing] = useState<Row | null>(null);
  const [adding, setAdding] = useState(false);

  return (
    <div className="mt-4 space-y-3">
      <div className="overflow-x-auto rounded-3xl border border-white/30 bg-white/30 shadow">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-sky-50/50 text-slate-600">
            <tr>
              <th className="p-2">Name</th>
              <th className="p-2 text-right">Price</th>
              <th className="p-2">Active</th>
              <th className="p-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {list.map((p) => (
              <tr key={p.id} className="border-t border-sky-100/50">
                <td className="p-2">{p.name}</td>
                <td className="p-2 text-right">{p.price ? `$${p.price}` : "—"}</td>
                <td className="p-2">{p.is_active ? "yes" : "no"}</td>
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
                        if (!confirm("Delete package?")) return;
                        const res = await fetch("/api/packages?id=" + p.id, { method: "DELETE" });
                        if (!res.ok) {
                          const j = (await res.json().catch(() => ({}))) as { error?: string };
                          alert(j.error || "Could not delete");
                          return;
                        }
                        setList((prev) => prev.filter((x) => x.id !== p.id));
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
                <td colSpan={4} className="p-3 text-slate-500">
                  No packages yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <LuxuryButton type="button" onClick={() => setAdding(true)}>
        + Add package
      </LuxuryButton>

      <Modal open={adding} title="Add package" onClose={() => setAdding(false)}>
        <PackageForm
          onSaved={() => {
            setAdding(false);
            r.refresh();
          }}
        />
      </Modal>

      <Modal open={Boolean(editing)} title="Edit package" onClose={() => setEditing(null)}>
        {editing ? (
          <PackageForm
            initial={editing}
            onSaved={() => {
              setEditing(null);
              r.refresh();
            }}
          />
        ) : null}
      </Modal>
    </div>
  );
}

function PackageForm({ initial, onSaved }: { initial?: Row; onSaved: () => void }) {
  const [name, setName] = useState(initial?.name || "");
  const [price, setPrice] = useState(initial?.price || "199");
  const [busy, setBusy] = useState(false);
  return (
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
        placeholder="Price"
      />
      <LuxuryButton
        type="button"
        disabled={busy}
        onClick={async () => {
          if (!name.trim()) return alert("Name required");
          setBusy(true);
          const res = await fetch("/api/packages", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: initial?.id, name, price: parseFloat(price) || 0, is_active: true }),
          });
          setBusy(false);
          if (!res.ok) {
            const j = (await res.json().catch(() => ({}))) as { error?: string };
            alert(j.error || "Could not save");
            return;
          }
          onSaved();
        }}
      >
        {busy ? "Saving…" : initial ? "Save changes" : "Save"}
      </LuxuryButton>
    </div>
  );
}

