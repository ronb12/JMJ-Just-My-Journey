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
    <div>
      <h1 className="font-serif text-3xl text-[#1E3A8A]">Messages</h1>
      <MessagesInbox isAdmin={false} currentUserId={s.user.id} currentEmail={s.user.email} />
    </div>
  );
}
