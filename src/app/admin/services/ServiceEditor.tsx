"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { LuxuryButton } from "@/components/ui/LuxuryButton";
import { Modal } from "@/components/ui/Modal";
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
  const [editing, setEditing] = useState<S | null>(null);
  const [adding, setAdding] = useState(false);
  return (
    <div className="mt-4 space-y-3">
      <div className="overflow-x-auto rounded-3xl border border-white/30 bg-white/30 shadow">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="bg-sky-50/50 text-slate-600">
            <tr>
              <th className="p-2">Name</th>
              <th className="p-2 text-right">Price</th>
              <th className="p-2 text-right">Duration</th>
              <th className="p-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {list.map((s) => (
              <tr key={s.id} className="border-t border-sky-100/50">
                <td className="p-2">{s.name}</td>
                <td className="p-2 text-right">{s.price ? `$${s.price}` : "—"}</td>
                <td className="p-2 text-right">{s.duration_minutes ?? "—"}</td>
                <td className="p-2">
                  <div className="flex justify-end gap-2">
                    <LuxuryButton
                      type="button"
                      variant="ghost"
                      className="!px-3 !py-1.5 text-xs"
                      onClick={() => setEditing(s)}
                    >
                      Edit
                    </LuxuryButton>
                    <LuxuryButton
                      type="button"
                      variant="ghost"
                      className="!px-3 !py-1.5 text-xs"
                      onClick={async () => {
                        if (!confirm("Delete this service? This cannot be undone.")) return;
                        const res = await fetch("/api/services?id=" + s.id, { method: "DELETE" });
                        if (!res.ok) {
                          const j = (await res.json().catch(() => ({}))) as { error?: string };
                          alert(j.error || "Could not delete");
                          return;
                        }
                        setList((l) => l.filter((x) => x.id !== s.id));
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
                <td className="p-3 text-slate-500" colSpan={4}>
                  No services yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      <LuxuryButton type="button" onClick={() => setAdding(true)}>
        + Add service
      </LuxuryButton>

      <Modal open={adding} title="Add service" onClose={() => setAdding(false)}>
        <AddForm
          onAdd={() => {
            setAdding(false);
            r.refresh();
          }}
        />
      </Modal>

      <Modal open={Boolean(editing)} title="Edit service" onClose={() => setEditing(null)}>
        {editing ? (
          <EditForm
            initial={editing}
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

function AddForm({ onAdd }: { onAdd: () => void }) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("99");
  const [desc, setDesc] = useState("");
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
            body: JSON.stringify({
              name,
              price: parseFloat(price) || 0,
              description: desc || null,
              duration_minutes: 60,
            }),
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
  );
}

function EditForm({ initial, onDone }: { initial: S; onDone: () => void }) {
  const [name, setName] = useState(initial.name);
  const [price, setPrice] = useState(initial.price ?? "99");
  const [desc, setDesc] = useState(initial.description ?? "");
  const [duration, setDuration] = useState(String(initial.duration_minutes ?? 60));
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
        placeholder="Price (USD)"
      />
      <input
        className="w-full rounded-xl border border-white/40 bg-white/50 px-2 py-1"
        value={duration}
        onChange={(e) => setDuration(e.target.value)}
        placeholder="Duration (minutes)"
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
          const res = await fetch("/api/services", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: initial.id,
              name,
              price: parseFloat(price) || 0,
              description: desc || null,
              duration_minutes: parseInt(duration, 10) || 60,
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
  );
}
