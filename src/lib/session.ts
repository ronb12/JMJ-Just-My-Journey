import { getServerSession } from "next-auth";
import { authOptions } from "./auth";

export async function getUserSession() {
  return getServerSession(authOptions);
}

export async function requireUser() {
  const s = await getUserSession();
  if (!s?.user?.id) {
    return { error: "Unauthorized" as const, session: null, user: null as null };
  }
  return {
    error: null as null,
    session: s,
    user: s.user,
  };
}

export async function requireAdmin() {
  const r = await requireUser();
  if (r.error) return r;
  if (r.user?.role !== "admin") {
    return { error: "Forbidden" as const, session: r.session, user: null as null };
  }
  return r;
}
