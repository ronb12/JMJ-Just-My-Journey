import { getSql } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { NextResponse } from "next/server";
import { z } from "zod";

const bodySchema = z.object({
  facebook_url: z.string().url().optional().nullable(),
  instagram_url: z.string().url().optional().nullable(),
  tiktok_url: z.string().url().optional().nullable(),
  youtube_url: z.string().url().optional().nullable(),
  x_url: z.string().url().optional().nullable(),
  business_name: z.string().max(200).optional().nullable(),
  support_email: z.string().email().max(320).optional().nullable(),
  support_phone: z.string().max(50).optional().nullable(),
  support_address: z.string().max(500).optional().nullable(),
  footer_note: z.string().max(280).optional().nullable(),
});

export async function GET() {
  const u = await requireUser();
  if (u.error || u.user?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const sql = getSql();
  const rows = (await sql`
    SELECT
      facebook_url, instagram_url, tiktok_url, youtube_url, x_url,
      business_name, support_email, support_phone, support_address, footer_note
    FROM site_settings
    ORDER BY updated_at DESC
    LIMIT 1
  `) as {
    facebook_url: string | null;
    instagram_url: string | null;
    tiktok_url: string | null;
    youtube_url: string | null;
    x_url: string | null;
    business_name?: string | null;
    support_email?: string | null;
    support_phone?: string | null;
    support_address?: string | null;
    footer_note?: string | null;
  }[];
  return NextResponse.json(rows[0] ?? {});
}

export async function POST(req: Request) {
  const u = await requireUser();
  if (u.error || u.user?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const b = bodySchema.parse(await req.json().catch(() => ({})));
  const sql = getSql();
  const existing = (await sql`SELECT id FROM site_settings LIMIT 1`) as { id: string }[];
  if (existing[0]) {
    await sql`
      UPDATE site_settings
      SET
        facebook_url = ${b.facebook_url ?? null},
        instagram_url = ${b.instagram_url ?? null},
        tiktok_url = ${b.tiktok_url ?? null},
        youtube_url = ${b.youtube_url ?? null},
        x_url = ${b.x_url ?? null},
        business_name = ${b.business_name ?? null},
        support_email = ${b.support_email ?? null},
        support_phone = ${b.support_phone ?? null},
        support_address = ${b.support_address ?? null},
        footer_note = ${b.footer_note ?? null},
        updated_at = now()
      WHERE id = ${existing[0].id}::uuid
    `;
  } else {
    await sql`
      INSERT INTO site_settings (
        id,
        facebook_url, instagram_url, tiktok_url, youtube_url, x_url,
        business_name, support_email, support_phone, support_address, footer_note
      )
      VALUES (
        gen_random_uuid(),
        ${b.facebook_url ?? null},
        ${b.instagram_url ?? null},
        ${b.tiktok_url ?? null},
        ${b.youtube_url ?? null},
        ${b.x_url ?? null},
        ${b.business_name ?? null},
        ${b.support_email ?? null},
        ${b.support_phone ?? null},
        ${b.support_address ?? null},
        ${b.footer_note ?? null}
      )
    `;
  }
  return NextResponse.json({ ok: true });
}

