import { getSql } from "@/lib/db";
import { encryptSecret, maskKey } from "@/lib/encryption";
import { clearEasyPostConfigCache } from "@/lib/easypost";
import { requireUser } from "@/lib/session";
import { NextResponse } from "next/server";
import { z } from "zod";

const postBody = z.object({
  useCustomEasypost: z.boolean(),
  apiKey: z.string().optional().nullable(),
  from_name: z.string().max(200).optional().nullable(),
  from_street1: z.string().max(200).optional().nullable(),
  from_street2: z.string().max(200).optional().nullable(),
  from_city: z.string().max(100).optional().nullable(),
  from_state: z.string().max(100).optional().nullable(),
  from_zip: z.string().max(20).optional().nullable(),
  from_country: z.string().max(100).optional().nullable(),
  from_phone: z.string().max(50).optional().nullable(),
  from_email: z.string().max(200).optional().nullable(),
});

export async function GET() {
  const u = await requireUser();
  if (u.error || u.user?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const sql = getSql();
  try {
    const r = (await sql`
      SELECT
        use_custom_easypost,
        encrypted_api_key,
        from_name,
        from_street1,
        from_street2,
        from_city,
        from_state,
        from_zip,
        from_country,
        from_phone,
        from_email
      FROM easypost_settings
      LIMIT 1
    `) as {
      use_custom_easypost: boolean;
      encrypted_api_key: string | null;
      from_name: string | null;
      from_street1: string | null;
      from_street2: string | null;
      from_city: string | null;
      from_state: string | null;
      from_zip: string | null;
      from_country: string | null;
      from_phone: string | null;
      from_email: string | null;
    }[];
    const row = r[0];
    if (!row) {
      return NextResponse.json({
        useCustomEasypost: false,
        hasApiKey: false,
        apiKeyMasked: "",
        from_name: "",
        from_street1: "",
        from_street2: "",
        from_city: "",
        from_state: "",
        from_zip: "",
        from_country: "US",
        from_phone: "",
        from_email: "",
      });
    }
    return NextResponse.json({
      useCustomEasypost: row.use_custom_easypost,
      hasApiKey: Boolean(row.encrypted_api_key),
      apiKeyMasked: row.encrypted_api_key
        ? maskKey("EZAKxxxxxxxxxxxxxxxxxxxxxxxx", 4)
        : "",
      from_name: row.from_name || "",
      from_street1: row.from_street1 || "",
      from_street2: row.from_street2 || "",
      from_city: row.from_city || "",
      from_state: row.from_state || "",
      from_zip: row.from_zip || "",
      from_country: row.from_country || "US",
      from_phone: row.from_phone || "",
      from_email: row.from_email || "",
    });
  } catch (e) {
    if ((e as { code?: string })?.code === "42P01") {
      return NextResponse.json(
        { error: "Run database migration: migrations/014_easypost_settings.sql" },
        { status: 409 }
      );
    }
    throw e;
  }
}

export async function POST(req: Request) {
  const u = await requireUser();
  if (u.error || u.user?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const b = postBody.parse(await req.json().catch(() => ({})));
  const sql = getSql();

  const ex = (await sql`SELECT id, encrypted_api_key FROM easypost_settings LIMIT 1`) as {
    id: string;
    encrypted_api_key: string | null;
  }[];
  if (!ex[0]) {
    return NextResponse.json({ error: "easypost_settings row missing. Run migration 014." }, { status: 409 });
  }

  const fromEmailAny = b.from_email && b.from_email.trim() ? b.from_email.trim() : null;

  if (!b.useCustomEasypost) {
    await sql`
      UPDATE easypost_settings
      SET
        use_custom_easypost = false,
        encrypted_api_key = NULL,
        from_name = ${b.from_name ?? null},
        from_street1 = ${b.from_street1 ?? null},
        from_street2 = ${b.from_street2 ?? null},
        from_city = ${b.from_city ?? null},
        from_state = ${b.from_state ?? null},
        from_zip = ${b.from_zip ?? null},
        from_country = ${b.from_country ?? null},
        from_phone = ${b.from_phone || null},
        from_email = ${fromEmailAny},
        updated_at = now()
      WHERE id = ${ex[0].id}::uuid
    `;
    clearEasyPostConfigCache();
    return NextResponse.json({ ok: true });
  }

  const keyTrim = b.apiKey?.trim() || "";
  const hasExisting = Boolean(ex[0].encrypted_api_key);
  if (!keyTrim && !hasExisting) {
    return NextResponse.json(
      { error: "API key is required when using custom EasyPost. Paste your production or test key from easypost.com." },
      { status: 400 }
    );
  }
  const enc: string = keyTrim
    ? encryptSecret(keyTrim)
    : (ex[0].encrypted_api_key as string);
  await sql`
    UPDATE easypost_settings
    SET
      use_custom_easypost = true,
      encrypted_api_key = ${enc},
      from_name = ${b.from_name ?? null},
      from_street1 = ${b.from_street1 ?? null},
      from_street2 = ${b.from_street2 ?? null},
      from_city = ${b.from_city ?? null},
      from_state = ${b.from_state ?? null},
      from_zip = ${b.from_zip ?? null},
      from_country = ${b.from_country ?? null},
      from_phone = ${b.from_phone || null},
      from_email = ${fromEmailAny},
      updated_at = now()
    WHERE id = ${ex[0].id}::uuid
  `;
  clearEasyPostConfigCache();
  return NextResponse.json({ ok: true, apiKeyMasked: keyTrim ? maskKey(keyTrim, 4) : "" });
}
