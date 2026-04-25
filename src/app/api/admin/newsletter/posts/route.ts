import { getSql } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { NextResponse } from "next/server";
import { z } from "zod";

const createBody = z.object({
  title: z.string().min(1).max(200).trim(),
  subject_line: z.string().min(1).max(300).trim(),
  body: z.string().max(200_000).default(""),
});

export async function GET() {
  const u = await requireUser();
  if (u.error || u.user?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const sql = getSql();
  const rows = (await sql`
    SELECT id, title, subject_line, body, status, created_at, updated_at, sent_at, created_by::text
    FROM newsletter_posts
    ORDER BY updated_at DESC
    LIMIT 200
  `) as {
    id: string;
    title: string;
    subject_line: string;
    body: string;
    status: string;
    created_at: string;
    updated_at: string;
    sent_at: string | null;
    created_by: string | null;
  }[];
  return NextResponse.json({ posts: rows });
}

export async function POST(req: Request) {
  const u = await requireUser();
  if (u.error || u.user?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const b = createBody.parse(await req.json().catch(() => ({})));
  const sql = getSql();
  const rows = (await sql`
    INSERT INTO newsletter_posts (title, subject_line, body, status, created_by)
    VALUES (
      ${b.title},
      ${b.subject_line},
      ${b.body},
      'draft',
      ${u.user.id}::uuid
    )
    RETURNING
      id,
      title,
      subject_line,
      body,
      status,
      created_at,
      updated_at,
      sent_at,
      created_by::text
  `) as {
    id: string;
    title: string;
    subject_line: string;
    body: string;
    status: string;
    created_at: string;
    updated_at: string;
    sent_at: string | null;
    created_by: string | null;
  }[];
  return NextResponse.json({ post: rows[0] });
}
