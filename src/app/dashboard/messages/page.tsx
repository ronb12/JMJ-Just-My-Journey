import { MessagesInbox } from "./MessagesInbox";
import { getUserSession } from "@/lib/session";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function DashboardMessages() {
  const s = await getUserSession();
  if (!s?.user) {
    redirect("/login");
  }
  return (
    <div className="max-w-6xl">
      <h1 className="font-serif text-3xl text-[#1E3A8A] dark:text-sky-200">Messages</h1>
      <p className="mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-300">
        Reach the studio with a new thread, or continue an existing conversation. Replies show up here when the team
        responds.
      </p>
      <MessagesInbox isAdmin={false} currentUserId={s.user.id} currentEmail={s.user.email} />
    </div>
  );
}
