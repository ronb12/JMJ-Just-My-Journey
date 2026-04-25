import { getUserSession } from "@/lib/session";
import { GlassCard } from "@/components/ui/GlassCard";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
  const s = await getUserSession();
  if (!s?.user) {
    redirect("/login");
  }
  return (
    <div>
      <h1 className="font-serif text-3xl text-[#1E3A8A]">Profile</h1>
      <GlassCard className="mt-4 max-w-md">
        <p className="text-sm text-slate-500">Name</p>
        <p className="text-slate-800">{s.user.name}</p>
        <p className="mt-2 text-sm text-slate-500">Email</p>
        <p className="text-slate-800">{s.user.email}</p>
        <p className="mt-2 text-sm text-slate-500">Account type</p>
        <p className="text-slate-800 capitalize">{s.user.role}</p>
      </GlassCard>
    </div>
  );
}
