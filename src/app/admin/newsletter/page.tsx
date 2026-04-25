import { getSql, hasDatabase } from "@/lib/db";
import { getUserSession } from "@/lib/session";
import { AdminNewsletterClient, type PostRow, type SubRow } from "./AdminNewsletterClient";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminNewsletterPage() {
  const s = await getUserSession();
  if (s?.user?.role !== "admin") {
    redirect("/");
  }

  let initial: SubRow[] = [];
  let initialPosts: PostRow[] = [];
  if (hasDatabase()) {
    const sql = getSql();
    initial = (await sql`
      SELECT id, email, source, created_at
      FROM newsletter_subscribers
      ORDER BY created_at DESC
      LIMIT 2000
    `) as SubRow[];
    try {
      initialPosts = (await sql`
        SELECT
          id,
          title,
          subject_line,
          body,
          status,
          created_at,
          updated_at,
          sent_at,
          created_by::text
        FROM newsletter_posts
        ORDER BY updated_at DESC
        LIMIT 200
      `) as PostRow[];
    } catch {
      /* migration 012 not applied */
    }
  }

  return (
    <div>
      <h1 className="font-serif text-3xl text-[#1E3A8A]">Newsletter</h1>
      <p className="mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-300">
        <strong className="font-medium text-slate-700 dark:text-slate-200">Create &amp; history</strong> is where you write
        campaigns and track draft / sent (record-keeping).{" "}
        <strong className="font-medium text-slate-700 dark:text-slate-200">Subscribers</strong> lists signups from the contact
        form and from customer <strong className="font-medium text-slate-700 dark:text-slate-200">Account</strong> settings. Outbound
        email is not wired yet—copy content or export addresses to your ESP.
      </p>
      <div className="mt-4">
        <AdminNewsletterClient initial={initial} initialPosts={initialPosts} />
      </div>
    </div>
  );
}
