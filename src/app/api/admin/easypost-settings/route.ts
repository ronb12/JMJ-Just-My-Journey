import { getSql } from "@/lib/db";
import { encryptSecret } from "@/lib/encryption";
import { clearEasyPostConfigCache } from "@/lib/easypost";
import { requireUser } from "@/lib/session";
import { NextResponse } from "next/server";
import { z } from "zod";

function isMissingTable(e: unknown) {
  return (e as { code?: string })?.code === "42P01";
}

export async function GET() {
  const u = await requireUser();
  if (u.error || u.user?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const sql = getSql();
  try {
    const r = (await sql`
      SELECT
        id,
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
      id: string;
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

    const row = r[0] || null;
    return NextResponse.json({
      useCustomEasypost: row?.use_custom_easypost ?? false,
      hasApiKey: Boolean(row?.encrypted_api_key),
      from_name: row?.from_name ?? "",
      from_street1: row?.from_street1 ?? "",
      from_street2: row?.from_street2 ?? "",
      from_city: row?.from_city ?? "",
      from_state: row?.from_state ?? "",
      from_zip: row?.from_zip ?? "",
      from_country: row?.from_country ?? "US",
      from_phone: row?.from_phone ?? "",
      from_email: row?.from_email ?? "",
    });
  } catch (e) {
    if (isMissingTable(e)) {
      return NextResponse.json(
        {
          useCustomEasypost: false,
          hasApiKey: false,
          from_name: "",
          from_street1: "",
          from_street2: "",
          from_city: "",
          from_state: "",
          from_zip: "",
          from_country: "US",
          from_phone: "",
          from_email: "",
          warning: "EasyPost settings require DB migration 014_easypost_settings.sql",
        },
        { status: 200 }
      );
    }
    throw e;
  }
}

const postBody = z.object({
  useCustomEasypost: z.boolean(),
  apiKey: z.string().optional().nullable(),
  from_name: z.string().optional().nullable(),
  from_street1: z.string().optional().nullable(),
  from_street2: z.string().optional().nullable(),
  from_city: z.string().optional().nullable(),
  from_state: z.string().optional().nullable(),
  from_zip: z.string().optional().nullable(),
  from_country: z.string().optional().nullable(),
  from_phone: z.string().optional().nullable(),
  from_email: z.string().optional().nullable(),
});

export async function POST(req: Request) {
  const u = await requireUser();
  if (u.error || u.user?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const b = postBody.parse(await req.json().catch(() => ({})));
  const sql = getSql();

  let enc: string | null = null;
  if (b.useCustomEasypost) {
    if (b.apiKey?.trim()) {
      enc = encryptSecret(b.apiKey.trim());
    }
  }

  try {
    const ex = (await sql`SELECT id, encrypted_api_key FROM easypost_settings LIMIT 1`) as {
      id: string;
      encrypted_api_key: string | null;
    }[];
    const id = ex[0]?.id;
    const keepKey = ex[0]?.encrypted_api_key ?? null;
    const nextKey =
      b.useCustomEasypost
        ? enc ?? keepKey
        : null;

    if (id) {
      await sql`
        UPDATE easypost_settings
        SET
          use_custom_easypost = ${b.useCustomEasypost},
          encrypted_api_key = ${nextKey},
          from_name = ${b.from_name ?? null},
          from_street1 = ${b.from_street1 ?? null},
          from_street2 = ${b.from_street2 ?? null},
          from_city = ${b.from_city ?? null},
          from_state = ${b.from_state ?? null},
          from_zip = ${b.from_zip ?? null},
          from_country = ${b.from_country ?? null},
          from_phone = ${b.from_phone ?? null},
          from_email = ${b.from_email ?? null},
          updated_at = now()
        WHERE id = ${id}::uuid
      `;
    } else {
      await sql`
        INSERT INTO easypost_settings (
          id,
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
        )
        VALUES (
          gen_random_uuid(),
          ${b.useCustomEasypost},
          ${nextKey},
          ${b.from_name ?? null},
          ${b.from_street1 ?? null},
          ${b.from_street2 ?? null},
          ${b.from_city ?? null},
          ${b.from_state ?? null},
          ${b.from_zip ?? null},
          ${b.from_country ?? null},
          ${b.from_phone ?? null},
          ${b.from_email ?? null}
        )
      `;
    }
  } catch (e) {
    if (isMissingTable(e)) {
      return NextResponse.json(
        { error: "EasyPost settings table missing. Run migration: migrations/014_easypost_settings.sql" },
        { status: 409 }
      );
    }
    throw e;
  }

  clearEasyPostConfigCache();
  return NextResponse.json({ ok: true });
}
