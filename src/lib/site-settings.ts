import { getSql, hasDatabase } from "@/lib/db";

export type SiteSettings = {
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
};

export async function getSiteSettings(): Promise<SiteSettings> {
  if (!hasDatabase()) {
    return {
      facebook_url: null,
      instagram_url: null,
      tiktok_url: null,
      youtube_url: null,
      x_url: null,
      business_name: null,
      support_email: null,
      support_phone: null,
      support_address: null,
      footer_note: null,
    };
  }
  const sql = getSql();
  let rows: SiteSettings[] = [];
  try {
    rows = (await sql`
      SELECT
        facebook_url, instagram_url, tiktok_url, youtube_url, x_url,
        business_name, support_email, support_phone, support_address, footer_note
      FROM site_settings
      ORDER BY updated_at DESC
      LIMIT 1
    `) as SiteSettings[];
  } catch (e: unknown) {
    const err = e as { code?: string };
    // Backwards-compat: allow build/runtime even if the migration hasn't run yet.
    if (err?.code === "42703") {
      rows = (await sql`
        SELECT facebook_url, instagram_url, tiktok_url, youtube_url, x_url
        FROM site_settings
        ORDER BY updated_at DESC
        LIMIT 1
      `) as SiteSettings[];
    } else {
      throw e;
    }
  }
  return (
    rows[0] ?? {
      facebook_url: null,
      instagram_url: null,
      tiktok_url: null,
      youtube_url: null,
      x_url: null,
      business_name: null,
      support_email: null,
      support_phone: null,
      support_address: null,
      footer_note: null,
    }
  );
}

