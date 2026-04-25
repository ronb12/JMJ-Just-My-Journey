import { getSql, hasDatabase } from "@/lib/db";

export type SiteSettings = {
  facebook_url: string | null;
  instagram_url: string | null;
  tiktok_url: string | null;
  youtube_url: string | null;
  x_url: string | null;
};

export async function getSiteSettings(): Promise<SiteSettings> {
  if (!hasDatabase()) {
    return {
      facebook_url: null,
      instagram_url: null,
      tiktok_url: null,
      youtube_url: null,
      x_url: null,
    };
  }
  const sql = getSql();
  const rows = (await sql`
    SELECT facebook_url, instagram_url, tiktok_url, youtube_url, x_url
    FROM site_settings
    ORDER BY updated_at DESC
    LIMIT 1
  `) as SiteSettings[];
  return (
    rows[0] ?? {
      facebook_url: null,
      instagram_url: null,
      tiktok_url: null,
      youtube_url: null,
      x_url: null,
    }
  );
}

