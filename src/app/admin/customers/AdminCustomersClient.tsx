"use client";

import { formatUserAddressLine, type UserAddressFields } from "@/lib/user-address";
import { LuxuryButton } from "@/components/ui/LuxuryButton";
import { Modal } from "@/components/ui/Modal";
import { useState } from "react";

type Row = {
  id: string;
  name: string | null;
  email: string;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string | null;
  created_at: string;
};

function fmtDate(s: string) {
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? s : d.toLocaleString();
}

function line(a: UserAddressFields) {
  return formatUserAddressLine(a);
}

function fullAddressTitle(a: UserAddressFields) {
  const p = [a.address_line1, a.address_line2, a.city, a.state, a.postal_code, a.country]
    .map((x) => (x && String(x).trim()) || "")
    .filter(Boolean);
  return p.length ? p.join("\n") : "";
}

export function AdminCustomersClient({ initial }: { initial: Row[] }) {
  const [list, setList] = useState<Row[]>(initial);
  const [editing, setEditing] = useState<Row | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postal, setPostal] = useState("");
  const [country, setCountry] = useState("");

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
            {list.map((u) => {
              const a: UserAddressFields = {
                address_line1: u.address_line1,
                address_line2: u.address_line2,
                city: u.city,
                state: u.state,
                postal_code: u.postal_code,
                country: u.country,
              };
              const short = line(a);
              return (
                <tr key={u.id} className="border-t border-sky-100/50 dark:border-white/10">
                  <td className="p-2">{u.name || "—"}</td>
                  <td className="p-2">{u.email}</td>
                  <td
                    className="p-2 max-w-[16rem] truncate text-slate-600 dark:text-slate-300"
                    title={fullAddressTitle(a) || undefined}
                  >
                    {short || "—"}
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
                          setLine1(u.address_line1 || "");
                          setLine2(u.address_line2 || "");
                          setCity(u.city || "");
                          setState(u.state || "");
                          setPostal(u.postal_code || "");
                          setCountry(u.country || "");
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
              );
            })}
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

      <Modal open={Boolean(editing)} title="Edit customer" onClose={() => setEditing(null)} className="max-w-lg">
        {editing ? (
          <div className="space-y-4">
            <div className="jmj-field-block">
              <label className="jmj-label">Name</label>
              <input className="jmj-input" value={name} onChange={(ev) => setName(ev.target.value)} />
            </div>
            <div className="jmj-field-block">
              <label className="jmj-label">Email</label>
              <input className="jmj-input" type="email" value={email} onChange={(ev) => setEmail(ev.target.value)} />
            </div>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Address (optional)</p>
            <div className="jmj-field-block">
              <label className="jmj-label">Street line 1</label>
              <input
                className="jmj-input"
                value={line1}
                onChange={(ev) => setLine1(ev.target.value)}
                autoComplete="address-line1"
              />
            </div>
            <div className="jmj-field-block">
              <label className="jmj-label">Street line 2</label>
              <input
                className="jmj-input"
                value={line2}
                onChange={(ev) => setLine2(ev.target.value)}
                autoComplete="address-line2"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="jmj-field-block">
                <label className="jmj-label">City</label>
                <input className="jmj-input" value={city} onChange={(ev) => setCity(ev.target.value)} autoComplete="address-level2" />
              </div>
              <div className="jmj-field-block">
                <label className="jmj-label">State / province</label>
                <input
                  className="jmj-input"
                  value={state}
                  onChange={(ev) => setState(ev.target.value)}
                  autoComplete="address-level1"
                />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="jmj-field-block">
                <label className="jmj-label">Postal code</label>
                <input
                  className="jmj-input"
                  value={postal}
                  onChange={(ev) => setPostal(ev.target.value)}
                  autoComplete="postal-code"
                />
              </div>
              <div className="jmj-field-block">
                <label className="jmj-label">Country</label>
                <input
                  className="jmj-input"
                  value={country}
                  onChange={(ev) => setCountry(ev.target.value)}
                  autoComplete="country-name"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <LuxuryButton
                type="button"
                onClick={async () => {
                  const res = await fetch("/api/admin/customers", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      id: editing.id,
                      name: name || null,
                      email: email || null,
                      address_line1: line1 || null,
                      address_line2: line2 || null,
                      city: city || null,
                      state: state || null,
                      postal_code: postal || null,
                      country: country || null,
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
                        ? {
                            ...p,
                            name: name || null,
                            email: email || p.email,
                            address_line1: line1 || null,
                            address_line2: line2 || null,
                            city: city || null,
                            state: state || null,
                            postal_code: postal || null,
                            country: country || null,
                          }
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
