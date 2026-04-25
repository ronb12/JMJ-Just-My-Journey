import { getUserSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { MessagesInbox } from "@/app/dashboard/messages/MessagesInbox";

export const dynamic = "force-dynamic";

export default async function AdminMessages() {
  const s = await getUserSession();
  if (s?.user?.role !== "admin") {
    redirect("/");
  }
  return (
    <div>
      <h1 className="font-serif text-3xl text-[#1E3A8A]">Inbox (admin)</h1>
      <MessagesInbox isAdmin currentUserId={s.user.id} currentEmail={s.user.email} />
    </div>
  );
}
