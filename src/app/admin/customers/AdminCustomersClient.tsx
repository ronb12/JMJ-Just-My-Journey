"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { LuxuryButton } from "@/components/ui/LuxuryButton";
import { Modal } from "@/components/ui/Modal";
import { useMemo, useState } from "react";

type Row = { id: string; name: string | null; email: string; created_at: string };

function fmtDate(s: string) {
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? s : d.toLocaleString();
}

export function AdminCustomersClient({ initial }: { initial: Row[] }) {
  const [list, setList] = useState<Row[]>(initial);
  const [editing, setEditing] = useState<Row | null>(null);
  const e = editing;

  const form = useMemo(
    () => ({
      name: e?.name || "",
      email: e?.email || "",
    }),
    [e]
  );

  const [name, setName] = useState(form.name);
  const [email, setEmail] = useState(form.email);

  return (
    <div className="mt-4 space-y-3">
      <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-sky-50/50 text-slate-600">
            <tr>
              <th className="p-2">Name</th>
              <th className="p-2">Email</th>
              <th className="p-2 whitespace-nowrap">Created</th>
              <th className="p-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {list.map((u) => (
              <tr key={u.id} className="border-t border-sky-100/50">
                <td className="p-2">{u.name || "—"}</td>
                <td className="p-2">{u.email}</td>
                <td className="p-2 whitespace-nowrap text-xs text-slate-500">{fmtDate(u.created_at)}</td>
                <td className="p-2">
                  <div className="flex justify-end gap-2">
                    <LuxuryButton
                      type="button"
                      variant="ghost"
                      className="!px-3 !py-1.5 text-xs"
                      onClick={() => {
                        setEditing(u);
                        setName(u.name || "");
                        setEmail(u.email);
                      }}
                    >
                      Edit
                    </LuxuryButton>
                    <LuxuryButton
                      type="button"
                      variant="ghost"
                      className="!px-3 !py-1.5 text-xs"
                      onClick={async () => {
                        if (!confirm("Delete customer? This will remove their data (if allowed).")) return;
                        const res = await fetch("/api/admin/customers?id=" + u.id, { method: "DELETE" });
                        if (!res.ok) {
                          const j = (await res.json().catch(() => ({}))) as { error?: string };
                          alert(j.error || "Could not delete");
                          return;
                        }
                        setList((prev) => prev.filter((x) => x.id !== u.id));
                        if (editing?.id === u.id) setEditing(null);
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
                  No customers yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <Modal open={Boolean(editing)} title="Edit customer" onClose={() => setEditing(null)}>
        {editing ? (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-600">Name</label>
              <input
                className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                value={name}
                onChange={(ev) => setName(ev.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">Email</label>
              <input
                className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                value={email}
                onChange={(ev) => setEmail(ev.target.value)}
              />
            </div>
            <div className="flex justify-end">
              <LuxuryButton
                type="button"
                onClick={async () => {
                  const res = await fetch("/api/admin/customers", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id: editing.id, name: name || null, email: email || null }),
                  });
                  if (!res.ok) {
                    const j = (await res.json().catch(() => ({}))) as { error?: string };
                    alert(j.error || "Could not save");
                    return;
                  }
                  setList((prev) =>
                    prev.map((p) =>
                      p.id === editing.id ? { ...p, name: name || null, email: email || p.email } : p
                    )
                  );
                  setEditing(null);
                }}
              >
                Save changes
              </LuxuryButton>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

