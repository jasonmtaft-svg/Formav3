import { createClient } from "@/lib/supabase/server";

export default async function HistoryPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: workouts } = user
    ? await supabase
        .from("workouts")
        .select("id, name, day, generated_at")
        .eq("user_id", user.id)
        .order("generated_at", { ascending: false })
    : { data: [] };

  return (
    <main className="flex min-h-dvh flex-col px-6 py-10">
      <h1 className="text-xl font-semibold mb-6">Workout history</h1>

      {!workouts?.length ? (
        <p className="text-text-secondary text-sm">No workouts yet. Complete your first session!</p>
      ) : (
        <ul className="space-y-3">
          {workouts.map((w) => (
            <li
              key={w.id}
              className="rounded-xl border border-border-default bg-surface p-4"
            >
              <p className="font-medium text-text-primary">{w.name}</p>
              <p className="text-xs text-text-muted mt-0.5">
                {w.day} · {new Date(w.generated_at).toLocaleDateString()}
              </p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
