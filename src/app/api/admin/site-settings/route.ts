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
});

export async function GET() {
  const u = await requireUser();
  if (u.error || u.user?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const sql = getSql();
  const rows = (await sql`
    SELECT facebook_url, instagram_url, tiktok_url, youtube_url, x_url
    FROM site_settings
    ORDER BY updated_at DESC
    LIMIT 1
  `) as {
    facebook_url: string | null;
    instagram_url: string | null;
    tiktok_url: string | null;
    youtube_url: string | null;
    x_url: string | null;
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
        updated_at = now()
      WHERE id = ${existing[0].id}::uuid
    `;
  } else {
    await sql`
      INSERT INTO site_settings (id, facebook_url, instagram_url, tiktok_url, youtube_url, x_url)
      VALUES (
        gen_random_uuid(),
        ${b.facebook_url ?? null},
        ${b.instagram_url ?? null},
        ${b.tiktok_url ?? null},
        ${b.youtube_url ?? null},
        ${b.x_url ?? null}
      )
    `;
  }
  return NextResponse.json({ ok: true });
}

