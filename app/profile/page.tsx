import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";

export default async function ProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase.from("profiles").select("*").eq("id", user.id).single()
    : { data: null };

  return (
    <main className="flex min-h-dvh flex-col px-6 py-10">
      <div className="flex items-center gap-3 mb-10">
        <Logo />
        <h1 className="text-xl font-semibold">Profile</h1>
      </div>

      <div className="space-y-6 flex-1">
        <div className="rounded-xl border border-border-default bg-surface p-4 space-y-3">
          <p className="text-xs text-text-muted uppercase tracking-widest">Account</p>
          <p className="text-sm text-text-primary">{user?.email ?? "—"}</p>
        </div>

        <div className="rounded-xl border border-border-default bg-surface p-4 space-y-3">
          <p className="text-xs text-text-muted uppercase tracking-widest">Training preferences</p>
          <div className="space-y-1 text-sm text-text-secondary">
            <p>Goal: <span className="text-text-primary">{profile?.goal ?? "—"}</span></p>
            <p>Days/week: <span className="text-text-primary">{profile?.days_per_week ?? "—"}</span></p>
            <p>Equipment: <span className="text-text-primary">{profile?.equipment ?? "—"}</span></p>
          </div>
        </div>
      </div>

      <div className="mt-8 space-y-3">
        <Button variant="secondary">Sign out</Button>
      </div>
    </main>
  );
}
