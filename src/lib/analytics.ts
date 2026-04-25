import { getSql } from "./db";

export type AnalyticsEventInput = {
  name: string;
  userId?: string | null;
  properties?: Record<string, unknown> | null;
};

function isMissingTable(e: unknown) {
  return (e as { code?: string })?.code === "42P01";
}

export async function logAnalyticsEvent(p: AnalyticsEventInput) {
  const sql = getSql();
  try {
    await sql`
      INSERT INTO analytics_events (name, user_id, properties)
      VALUES (
        ${p.name},
        ${p.userId ?? null}::uuid,
        ${JSON.stringify(p.properties ?? null)}::jsonb
      )
    `;
  } catch (e) {
    if (isMissingTable(e)) return;
    throw e;
  }
}
