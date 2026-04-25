"use client";

import { LuxuryButton } from "@/components/ui/LuxuryButton";
import { Modal } from "@/components/ui/Modal";
import { useRouter } from "next/navigation";
import { useState } from "react";

function str(fd: FormData, key: string) {
  const v = fd.get(key);
  if (typeof v !== "string" || !v.trim()) return undefined;
  return v.trim();
}

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
        phone: str(fd, "phone"),
        address_line1: str(fd, "address_line1"),
        address_line2: str(fd, "address_line2"),
        city: str(fd, "city"),
        state: str(fd, "state"),
        postal_code: str(fd, "postal_code"),
        country: str(fd, "country"),
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
        className="max-w-lg"
      >
        <form className="max-w-lg space-y-3" onSubmit={handleSubmit}>
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
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Address (optional)</p>
          <div className="jmj-field-block">
            <label className="jmj-label">Street line 1</label>
            <input name="address_line1" className="jmj-input" placeholder="Street address" autoComplete="address-line1" />
          </div>
          <div className="jmj-field-block">
            <label className="jmj-label">Street line 2</label>
            <input
              name="address_line2"
              className="jmj-input"
              placeholder="Apt, suite, etc."
              autoComplete="address-line2"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="jmj-field-block">
              <label className="jmj-label">City</label>
              <input name="city" className="jmj-input" autoComplete="address-level2" />
            </div>
            <div className="jmj-field-block">
              <label className="jmj-label">State / province</label>
              <input name="state" className="jmj-input" autoComplete="address-level1" />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="jmj-field-block">
              <label className="jmj-label">Postal code</label>
              <input name="postal_code" className="jmj-input" autoComplete="postal-code" />
            </div>
            <div className="jmj-field-block">
              <label className="jmj-label">Country</label>
              <input name="country" className="jmj-input" autoComplete="country-name" />
            </div>
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
