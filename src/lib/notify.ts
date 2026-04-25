import { getSql } from "./db";

type NotifyInput = {
  userId: string;
  title: string;
  message: string;
  type: string;
  linkUrl?: string | null;
};

export async function createNotification(p: NotifyInput) {
  const sql = getSql();
  await sql`
    INSERT INTO notifications (user_id, title, message, type, link_url)
    VALUES (
      ${p.userId}::uuid,
      ${p.title},
      ${p.message},
      ${p.type},
      ${p.linkUrl ?? null}
    )
  `;
}

export async function getAdminUserIds(): Promise<string[]> {
  const sql = getSql();
  const rows = (await sql`
    SELECT id FROM users WHERE role = 'admin' LIMIT 50
  `) as { id: string }[];
  return rows.map((r) => r.id);
}
