import { compare } from "bcryptjs";
import type { NextAuthOptions, User } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { getSql, hasDatabase } from "./db";

const providers = [
  Credentials({
    name: "Email",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(cred): Promise<User | null> {
      if (!hasDatabase()) return null;
      if (!cred?.email || !cred?.password) return null;
      const email = String(cred.email).toLowerCase();
      const sql = getSql();
      const rows = (await sql`
        SELECT id, name, email, password_hash, role, phone
        FROM users
        WHERE lower(email) = ${email}
        LIMIT 1
      `) as {
        id: string;
        name: string | null;
        email: string;
        password_hash: string | null;
        role: "customer" | "admin";
        phone: string | null;
      }[];
      const user = rows[0];
      if (!user || !user.password_hash) return null;
      const ok = await compare(String(cred.password), user.password_hash);
      if (!ok) return null;
      return {
        id: user.id,
        email: user.email,
        name: user.name ?? user.email,
        role: user.role,
      } as User & { role: "customer" | "admin" };
    },
  }),
];

function authError(): string {
  return "Authentication requires DATABASE_URL and a Neon database. Configure .env to enable login.";
}

const secret = process.env.NEXTAUTH_SECRET;
if (process.env.NODE_ENV === "development" && !hasDatabase() && !secret) {
  // eslint-disable-next-line no-console
  console.warn(authError());
}

export const authOptions: NextAuthOptions = {
  providers,
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  secret: secret || "development-fallback-not-for-prod",
  pages: { signIn: "/login" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as User & { role: "customer" | "admin" };
        token.id = u.id;
        token.role = u.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) || "";
        session.user.role = (token.role as "customer" | "admin") || "customer";
      }
      return session;
    },
  },
  events: {
    signIn: async () => {
      if (!hasDatabase() && !secret) {
        // eslint-disable-next-line no-console
        console.error(authError());
      }
    },
  },
};
