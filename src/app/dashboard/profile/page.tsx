import { getUserSession } from "@/lib/session";
import { GlassCard } from "@/components/ui/GlassCard";
import { NewsletterSignup } from "@/components/newsletter/NewsletterSignup";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
  const s = await getUserSession();
  if (!s?.user) {
    redirect("/login");
  }
  return (
    <div>
      <h1 className="font-serif text-3xl text-[#1E3A8A]">Account settings</h1>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Your profile and how we reach you.</p>
      <GlassCard className="mt-4 max-w-lg">
        <h2 className="font-serif text-lg text-sky-900 dark:text-sky-200">Profile</h2>
        <p className="mt-2 text-sm text-slate-500">Name</p>
        <p className="text-slate-800 dark:text-slate-100">{s.user.name}</p>
        <p className="mt-2 text-sm text-slate-500">Email</p>
        <p className="text-slate-800 dark:text-slate-100">{s.user.email}</p>
        <p className="mt-2 text-sm text-slate-500">Account type</p>
        <p className="text-slate-800 capitalize dark:text-slate-100">{s.user.role}</p>
      </GlassCard>
      <GlassCard className="mt-4 max-w-lg">
        <NewsletterSignup
          source="account"
          defaultEmail={s.user.email ?? ""}
          className="max-w-md"
        />
      </GlassCard>
    </div>
  );
}
