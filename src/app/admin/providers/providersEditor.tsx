"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { LuxuryButton } from "@/components/ui/LuxuryButton";
import { Modal } from "@/components/ui/Modal";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Row = { id: string; name: string | null; specialty: string | null; is_active: boolean };

export function ProvidersEditor({ initial }: { initial: Row[] }) {
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
              <th className="p-2">Specialty</th>
              <th className="p-2">Active</th>
              <th className="p-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {list.map((p) => (
              <tr key={p.id} className="border-t border-sky-100/50">
                <td className="p-2">{p.name || "—"}</td>
                <td className="p-2">{p.specialty || "—"}</td>
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
                        if (!confirm("Delete provider?")) return;
                        const res = await fetch("/api/admin/providers?id=" + p.id, { method: "DELETE" });
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
                  No providers yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <LuxuryButton type="button" onClick={() => setAdding(true)}>
        + Add provider
      </LuxuryButton>

      <Modal open={adding} title="Add provider" onClose={() => setAdding(false)}>
        <ProviderForm
          onSaved={() => {
            setAdding(false);
            r.refresh();
          }}
        />
      </Modal>

      <Modal open={Boolean(editing)} title="Edit provider" onClose={() => setEditing(null)}>
        {editing ? (
          <ProviderForm
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

function ProviderForm({
  initial,
  onSaved,
}: {
  initial?: Row;
  onSaved: () => void;
}) {
  const [name, setName] = useState(initial?.name || "");
  const [specialty, setSpecialty] = useState(initial?.specialty || "");
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
        value={specialty}
        onChange={(e) => setSpecialty(e.target.value)}
        placeholder="Specialty"
      />
      <LuxuryButton
        type="button"
        disabled={busy}
        onClick={async () => {
          if (!name.trim()) return alert("Name required");
          setBusy(true);
          const res = await fetch("/api/admin/providers", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: initial?.id,
              name,
              specialty: specialty || null,
              is_active: true,
            }),
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

