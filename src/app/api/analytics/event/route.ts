import { logAnalyticsEvent } from "@/lib/analytics";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getUserSession } from "@/lib/session";
import { randomUUID } from "crypto";

const bodySchema = z.object({
  name: z.string().min(1).max(120),
  properties: z.record(z.string(), z.any()).optional().nullable(),
});

export async function POST(req: Request) {
  const s = await getUserSession();
  const b = bodySchema.parse(await req.json().catch(() => ({})));
  const cookieName = "jmj_vid";
  const existing = req.headers.get("cookie") || "";
  const match = existing.match(new RegExp(`(?:^|; )${cookieName}=([^;]+)`));
  const visitorId = match?.[1] || randomUUID();
  await logAnalyticsEvent({
    name: b.name,
    userId: s?.user?.id ?? null,
    properties: {
      ...(b.properties ? b.properties : {}),
      visitorId,
    },
  });
  const res = NextResponse.json({ ok: true });
  if (!match?.[1]) {
    res.cookies.set(cookieName, visitorId, {
      httpOnly: false,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }
  return res;
}
