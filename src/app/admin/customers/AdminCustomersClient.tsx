"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { LuxuryButton } from "@/components/ui/LuxuryButton";
import { Modal } from "@/components/ui/Modal";
import { useMemo, useState } from "react";

type Row = {
  id: string;
  name: string | null;
  email: string;
  address: string | null;
  created_at: string;
};

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
      address: e?.address || "",
    }),
    [e]
  );

  const [name, setName] = useState(form.name);
  const [email, setEmail] = useState(form.email);
  const [address, setAddress] = useState(form.address);

  return (
    <div className="mt-4 space-y-3">
      <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow dark:border-white/10 dark:bg-slate-900">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="bg-sky-50/50 text-slate-600 dark:bg-slate-800/70 dark:text-slate-200">
            <tr>
              <th className="p-2">Name</th>
              <th className="p-2">Email</th>
              <th className="p-2">Address</th>
              <th className="p-2 whitespace-nowrap">Created</th>
              <th className="p-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {list.map((u) => (
              <tr key={u.id} className="border-t border-sky-100/50 dark:border-white/10">
                <td className="p-2">{u.name || "—"}</td>
                <td className="p-2">{u.email}</td>
                <td className="p-2 max-w-[14rem] truncate text-slate-600 dark:text-slate-300" title={u.address || ""}>
                  {u.address || "—"}
                </td>
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
                        setAddress(u.address || "");
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
                <td className="p-3 text-slate-500" colSpan={5}>
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
            <div className="jmj-field-block">
              <label className="jmj-label">Name</label>
              <input
                className="jmj-input"
                value={name}
                onChange={(ev) => setName(ev.target.value)}
              />
            </div>
            <div className="jmj-field-block">
              <label className="jmj-label">Email</label>
              <input
                className="jmj-input"
                value={email}
                onChange={(ev) => setEmail(ev.target.value)}
              />
            </div>
            <div className="jmj-field-block">
              <label className="jmj-label">Address (optional)</label>
              <textarea
                className="jmj-textarea"
                rows={3}
                value={address}
                onChange={(ev) => setAddress(ev.target.value)}
                placeholder="Street, city, state, ZIP"
              />
            </div>
            <div className="flex justify-end">
              <LuxuryButton
                type="button"
                onClick={async () => {
                  const nextAddr = address.trim() ? address.trim() : null;
                  const res = await fetch("/api/admin/customers", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      id: editing.id,
                      name: name || null,
                      email: email || null,
                      address: nextAddr,
                    }),
                  });
                  if (!res.ok) {
                    const j = (await res.json().catch(() => ({}))) as { error?: string };
                    alert(j.error || "Could not save");
                    return;
                  }
                  setList((prev) =>
                    prev.map((p) =>
                      p.id === editing.id
                        ? { ...p, name: name || null, email: email || p.email, address: nextAddr }
                        : p
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

