import { getSql } from "@/lib/db";
import { clearStripeConfigCache } from "@/lib/stripe-config";
import { encryptSecret, maskKey } from "@/lib/encryption";
import { requireUser } from "@/lib/session";
import { NextResponse } from "next/server";
import { z } from "zod";

export async function GET() {
  const u = await requireUser();
  if (u.error || u.user?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const sql = getSql();
  const r = (await sql`SELECT id, use_custom_keys, publishable_key, encrypted_secret_key FROM stripe_settings LIMIT 1`) as {
    id: string;
    use_custom_keys: boolean;
    publishable_key: string | null;
    encrypted_secret_key: string | null;
  }[];
  if (!r[0]) {
    return NextResponse.json({
      useCustomKeys: false,
      publishableKey: "",
      secretMasked: "",
    });
  }
  return NextResponse.json({
    useCustomKeys: r[0].use_custom_keys,
    publishableKey: r[0].publishable_key || "",
    secretMasked: r[0].encrypted_secret_key
      ? maskKey("sk_test_placeholder_xxxxxxxx", 4)
      : "",
    hasCustomSecret: Boolean(r[0].encrypted_secret_key),
  });
}

const postBody = z.object({
  useCustomKeys: z.boolean(),
  publishableKey: z.string().optional().nullable(),
  secretKey: z.string().min(0).optional().nullable(),
});

export async function POST(req: Request) {
  const u = await requireUser();
  if (u.error || u.user?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const b = postBody.parse(await req.json().catch(() => ({})));
  const sql = getSql();
  if (!b.useCustomKeys) {
    const ex = (await sql`SELECT id FROM stripe_settings LIMIT 1`) as { id: string }[];
    if (ex[0]) {
      await sql`
        UPDATE stripe_settings
        SET use_custom_keys = false, publishable_key = NULL, encrypted_secret_key = NULL, updated_at = now()
        WHERE id = ${ex[0].id}::uuid
      `;
    } else {
      await sql`INSERT INTO stripe_settings (id, use_custom_keys) VALUES (gen_random_uuid(), false)`;
    }
    clearStripeConfigCache();
    return NextResponse.json({ ok: true });
  }
  if (!b.publishableKey?.trim()) {
    return NextResponse.json({ error: "Publishable key required" }, { status: 400 });
  }
  if (!b.secretKey?.trim()) {
    return NextResponse.json({ error: "Secret key required when using custom keys" }, { status: 400 });
  }
  if (!b.secretKey.startsWith("sk_")) {
    return NextResponse.json({ error: "Secret key should start with sk_" }, { status: 400 });
  }
  if (!b.publishableKey.startsWith("pk_")) {
    return NextResponse.json({ error: "Publishable key should start with pk_" }, { status: 400 });
  }
  const enc = encryptSecret(b.secretKey);
  const existing = (await sql`SELECT id FROM stripe_settings LIMIT 1`) as { id: string }[];
  if (existing[0]) {
    await sql`
      UPDATE stripe_settings
      SET
        use_custom_keys = true,
        publishable_key = ${b.publishableKey},
        encrypted_secret_key = ${enc},
        updated_at = now()
      WHERE id = ${existing[0].id}::uuid
    `;
  } else {
    await sql`
      INSERT INTO stripe_settings (id, use_custom_keys, publishable_key, encrypted_secret_key)
      VALUES (gen_random_uuid(), true, ${b.publishableKey}, ${enc})
    `;
  }
  clearStripeConfigCache();
  return NextResponse.json({ ok: true, secretMasked: maskKey(b.publishableKey, 4) });
}
