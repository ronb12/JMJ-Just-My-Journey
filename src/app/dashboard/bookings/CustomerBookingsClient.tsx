"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { LuxuryButton } from "@/components/ui/LuxuryButton";
import { Modal } from "@/components/ui/Modal";
import { useState } from "react";

type Row = {
  id: string;
  service_name?: string;
  appointment_date?: string;
  appointment_time?: string;
  status?: string;
  payment_status?: string;
  total_amount?: string;
  notes?: string | null;
  provider_id?: string | null;
};

export function CustomerBookingsClient({ initial }: { initial: Row[] }) {
  const [list, setList] = useState<Row[]>(initial);
  const [editing, setEditing] = useState<Row | null>(null);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("10:00");
  const [notes, setNotes] = useState("");

  return (
    <div className="mt-4 space-y-3">
      <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow dark:border-white/10 dark:bg-slate-900">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="bg-sky-50/50 text-slate-600 dark:bg-slate-800/70 dark:text-slate-200">
            <tr>
              <th className="p-2">Service</th>
              <th className="p-2 whitespace-nowrap">Date</th>
              <th className="p-2 whitespace-nowrap">Time</th>
              <th className="p-2">Status</th>
              <th className="p-2">Payment</th>
              <th className="p-2 text-right">Total</th>
              <th className="p-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {list.map((a) => {
              const canChange = a.payment_status === "pending" && a.status === "pending";
              return (
                <tr key={a.id} className="border-t border-sky-100/50 dark:border-white/10">
                  <td className="p-2">{a.service_name || "—"}</td>
                  <td className="p-2 whitespace-nowrap">{String(a.appointment_date || "")}</td>
                  <td className="p-2 whitespace-nowrap">{a.appointment_time ? a.appointment_time.slice(0, 5) : "—"}</td>
                  <td className="p-2">{a.status || "—"}</td>
                  <td className="p-2">{a.payment_status || "—"}</td>
                  <td className="p-2 text-right">${a.total_amount || "0"}</td>
                  <td className="p-2">
                    <div className="flex justify-end gap-2">
                      {canChange ? (
                        <>
                          <LuxuryButton
                            type="button"
                            variant="ghost"
                            className="!px-3 !py-1.5 text-xs"
                            onClick={() => {
                              setEditing(a);
                              setDate(a.appointment_date || "");
                              setTime((a.appointment_time || "10:00").slice(0, 5));
                              setNotes(a.notes || "");
                            }}
                          >
                            Edit
                          </LuxuryButton>
                          <LuxuryButton
                            type="button"
                            variant="ghost"
                            className="!px-3 !py-1.5 text-xs"
                            onClick={async () => {
                              if (!confirm("Delete this booking? This cannot be undone.")) return;
                              const res = await fetch("/api/appointments?id=" + a.id, { method: "DELETE" });
                              if (!res.ok) {
                                const j = (await res.json().catch(() => ({}))) as { error?: string };
                                alert(j.error || "Could not delete");
                                return;
                              }
                              setList((prev) => prev.filter((x) => x.id !== a.id));
                              if (editing?.id === a.id) setEditing(null);
                            }}
                          >
                            Delete
                          </LuxuryButton>
                        </>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {list.length === 0 ? (
              <tr>
                <td className="p-3 text-slate-500" colSpan={7}>
                  No appointments yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <Modal open={Boolean(editing)} title="Edit booking" onClose={() => setEditing(null)}>
        {editing ? (
          <div className="space-y-3">
            <div className="grid gap-3 text-sm sm:grid-cols-2">
              <div className="jmj-field-block">
                <label className="jmj-label">Date</label>
                <input
                  type="date"
                  className="jmj-input"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div className="jmj-field-block">
                <label className="jmj-label">Time</label>
                <input
                  type="time"
                  className="jmj-input"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                />
              </div>
              <div className="jmj-field-block sm:col-span-2">
                <label className="jmj-label">Notes</label>
                <textarea
                  className="jmj-textarea"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end">
              <LuxuryButton
                type="button"
                onClick={async () => {
                  const res = await fetch("/api/appointments", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      id: editing.id,
                      appointmentDate: date,
                      appointmentTime: time,
                      notes: notes || null,
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
                        ? { ...p, appointment_date: date, appointment_time: time, notes: notes || null }
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

