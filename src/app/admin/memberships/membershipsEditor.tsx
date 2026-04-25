"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { LuxuryButton } from "@/components/ui/LuxuryButton";
import { Modal } from "@/components/ui/Modal";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Row = { id: string; name: string; monthly_price: string | null; is_active: boolean };

export function MembershipsEditor({ initial }: { initial: Row[] }) {
  const r = useRouter();
  const [list, setList] = useState<Row[]>(initial);
  const [editing, setEditing] = useState<Row | null>(null);
  const [adding, setAdding] = useState(false);

  return (
    <div className="mt-4 space-y-3">
      <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-sky-50/50 text-slate-600">
            <tr>
              <th className="p-2">Name</th>
              <th className="p-2 text-right">Monthly</th>
              <th className="p-2">Active</th>
              <th className="p-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {list.map((m) => (
              <tr key={m.id} className="border-t border-sky-100/50">
                <td className="p-2">{m.name}</td>
                <td className="p-2 text-right">{m.monthly_price ? `$${m.monthly_price}` : "—"}</td>
                <td className="p-2">{m.is_active ? "yes" : "no"}</td>
                <td className="p-2">
                  <div className="flex justify-end gap-2">
                    <LuxuryButton
                      type="button"
                      variant="ghost"
                      className="!px-3 !py-1.5 text-xs"
                      onClick={() => setEditing(m)}
                    >
                      Edit
                    </LuxuryButton>
                    <LuxuryButton
                      type="button"
                      variant="ghost"
                      className="!px-3 !py-1.5 text-xs"
                      onClick={async () => {
                        if (!confirm("Delete membership?")) return;
                        const res = await fetch("/api/memberships?id=" + m.id, { method: "DELETE" });
                        if (!res.ok) {
                          const j = (await res.json().catch(() => ({}))) as { error?: string };
                          alert(j.error || "Could not delete");
                          return;
                        }
                        setList((prev) => prev.filter((x) => x.id !== m.id));
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
                  No memberships yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <LuxuryButton type="button" onClick={() => setAdding(true)}>
        + Add membership
      </LuxuryButton>

      <Modal open={adding} title="Add membership" onClose={() => setAdding(false)}>
        <MembershipForm
          onSaved={() => {
            setAdding(false);
            r.refresh();
          }}
        />
      </Modal>

      <Modal open={Boolean(editing)} title="Edit membership" onClose={() => setEditing(null)}>
        {editing ? (
          <MembershipForm
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

function MembershipForm({ initial, onSaved }: { initial?: Row; onSaved: () => void }) {
  const [name, setName] = useState(initial?.name || "");
  const [monthly, setMonthly] = useState(initial?.monthly_price || "49");
  const [busy, setBusy] = useState(false);
  return (
    <div className="space-y-4">
      <div className="grid gap-3 text-sm sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="text-xs font-medium text-slate-600">Membership name</label>
          <input
            className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Monthly Self‑Care"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs font-medium text-slate-600">Monthly price (USD)</label>
          <input
            className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
            value={monthly}
            onChange={(e) => setMonthly(e.target.value)}
            placeholder="49"
            inputMode="decimal"
          />
          <p className="mt-1 text-xs text-slate-500">Displayed to customers; payments are handled through Stripe.</p>
        </div>
      </div>
      <div className="flex justify-end">
        <LuxuryButton
          type="button"
          disabled={busy}
          onClick={async () => {
            if (!name.trim()) return alert("Name required");
            setBusy(true);
            const res = await fetch("/api/memberships", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                id: initial?.id,
                name,
                monthly_price: parseFloat(monthly) || 0,
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
          {busy ? "Saving…" : initial ? "Save changes" : "Save membership"}
        </LuxuryButton>
      </div>
    </div>
  );
}

