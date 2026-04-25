import { getSql } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { NextResponse } from "next/server";
import { z } from "zod";

const patchBody = z.object({
  title: z.string().min(1).max(200).trim().optional(),
  subject_line: z.string().min(1).max(300).trim().optional(),
  body: z.string().max(200_000).optional(),
  status: z.enum(["draft", "sent", "archived"]).optional(),
});

type Ctx = { params: Promise<{ id: string }> };

function nextSentAtAfterStatusChange(
  cur: { status: string; sent_at: string | null },
  bStatus: string | undefined
): string | null | "unchanged" {
  if (bStatus === undefined) return "unchanged";
  if (bStatus === "sent") {
    if (cur.status === "sent" && cur.sent_at) return "unchanged";
    return new Date().toISOString();
  }
  if (bStatus === "draft") {
    return null;
  }
  if (bStatus === "archived") {
    return cur.sent_at;
  }
  return "unchanged";
}

export async function PATCH(req: Request, { params }: Ctx) {
  const u = await requireUser();
  if (u.error || u.user?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  const b = patchBody.parse(await req.json().catch(() => ({})));
  if (
    b.title === undefined &&
    b.subject_line === undefined &&
    b.body === undefined &&
    b.status === undefined
  ) {
    return NextResponse.json({ error: "No changes" }, { status: 400 });
  }
  const sql = getSql();
  const cur = (await sql`
    SELECT id, title, subject_line, body, status, sent_at, created_by::text
    FROM newsletter_posts
    WHERE id = ${id}::uuid
    LIMIT 1
  `) as {
    id: string;
    title: string;
    subject_line: string;
    body: string;
    status: string;
    sent_at: string | null;
    created_by: string | null;
  }[];
  if (!cur[0]) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const c = cur[0];
  const nextTitle = b.title !== undefined ? b.title : c.title;
  const nextSubject = b.subject_line !== undefined ? b.subject_line : c.subject_line;
  const nextBody = b.body !== undefined ? b.body : c.body;
  const nextStatus = b.status !== undefined ? b.status : c.status;
  const sentUpdate = nextSentAtAfterStatusChange(
    { status: c.status, sent_at: c.sent_at },
    b.status
  );
  const nextSent: string | null = sentUpdate === "unchanged" ? c.sent_at : sentUpdate;

  await sql`
    UPDATE newsletter_posts
    SET
      title = ${nextTitle},
      subject_line = ${nextSubject},
      body = ${nextBody},
      status = ${nextStatus},
      sent_at = ${nextSent}::timestamptz,
      updated_at = now()
    WHERE id = ${id}::uuid
  `;

  const rows = (await sql`
    SELECT id, title, subject_line, body, status, created_at, updated_at, sent_at, created_by::text
    FROM newsletter_posts
    WHERE id = ${id}::uuid
    LIMIT 1
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

export async function DELETE(_req: Request, { params }: Ctx) {
  const u = await requireUser();
  if (u.error || u.user?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  const sql = getSql();
  const del = (await sql`
    DELETE FROM newsletter_posts
    WHERE id = ${id}::uuid
    RETURNING id
  `) as { id: string }[];
  if (!del[0]) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
