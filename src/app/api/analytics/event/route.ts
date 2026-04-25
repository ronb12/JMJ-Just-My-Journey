import { logAnalyticsEvent } from "@/lib/analytics";
import { requireUser } from "@/lib/session";
import { NextResponse } from "next/server";
import { z } from "zod";

const bodySchema = z.object({
  name: z.string().min(1).max(120),
  properties: z.record(z.string(), z.any()).optional().nullable(),
});

export async function POST(req: Request) {
  const u = await requireUser();
  if (u.error) {
    return NextResponse.json({ error: u.error }, { status: 401 });
  }
  const b = bodySchema.parse(await req.json().catch(() => ({})));
  await logAnalyticsEvent({
    name: b.name,
    userId: u.user!.id,
    properties: b.properties ?? null,
  });
  return NextResponse.json({ ok: true });
}
