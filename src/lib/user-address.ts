export type UserAddressFields = {
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string | null;
};

/** One-line display for admin lists (full value in `title` attributes). */
export function formatUserAddressLine(a: Partial<UserAddressFields> | null | undefined): string {
  if (!a) return "";
  const p = [
    a.address_line1,
    a.address_line2,
    a.city,
    a.state,
    a.postal_code,
    a.country,
  ]
    .map((x) => (typeof x === "string" ? x.trim() : ""))
    .filter(Boolean);
  return p.join(", ");
}

export function emptyToNull(s: string | undefined | null): string | null {
  const t = typeof s === "string" ? s.trim() : "";
  return t || null;
}
