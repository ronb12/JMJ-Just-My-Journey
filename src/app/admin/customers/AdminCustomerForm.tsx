"use client";

import { LuxuryButton } from "@/components/ui/LuxuryButton";
import { Modal } from "@/components/ui/Modal";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminCustomerForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: fd.get("name"),
        email: fd.get("email"),
        phone: fd.get("phone") || undefined,
        address: (() => {
          const v = fd.get("address");
          return typeof v === "string" && v.trim() ? v.trim() : undefined;
        })(),
        password: fd.get("password"),
      }),
    });
    setBusy(false);
    if (res.ok) {
      (e.target as HTMLFormElement).reset();
      setOpen(false);
      router.refresh();
    } else {
      const d = await res.json().catch(() => ({}));
      setError((d as { error?: string }).error ?? "Failed to create customer");
    }
  }

  return (
    <div className="mb-4">
      <LuxuryButton type="button" onClick={() => setOpen(true)}>
        + Add Customer
      </LuxuryButton>
      <Modal
        open={open}
        title="Add customer"
        onClose={() => {
          setOpen(false);
          setError("");
        }}
      >
        <form className="max-w-md space-y-3" onSubmit={handleSubmit}>
          <div className="jmj-field-block">
            <label className="jmj-label">Name</label>
            <input name="name" required className="jmj-input" placeholder="Full name" />
          </div>
          <div className="jmj-field-block">
            <label className="jmj-label">Email</label>
            <input name="email" type="email" required className="jmj-input" placeholder="email@example.com" />
          </div>
          <div className="jmj-field-block">
            <label className="jmj-label">Phone (optional)</label>
            <input name="phone" type="tel" className="jmj-input" placeholder="+1 (555) 000-0000" />
          </div>
          <div className="jmj-field-block">
            <label className="jmj-label">Address (optional)</label>
            <textarea
              name="address"
              rows={3}
              className="jmj-textarea"
              placeholder="Street, city, state, ZIP"
            />
          </div>
          <div className="jmj-field-block">
            <label className="jmj-label">Temporary password (8+ characters)</label>
            <input name="password" type="password" required minLength={8} className="jmj-input" />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <LuxuryButton type="submit" disabled={busy}>
            {busy ? "Creating…" : "Create customer"}
          </LuxuryButton>
        </form>
      </Modal>
    </div>
  );
}
