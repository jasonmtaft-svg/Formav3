# Forma v2 — Roadmap

## P0 — Broken UX (fix these first)

### 1. History drill-down
**File to create:** `app/history/[id]/page.tsx`
Each card in the history list should link to a workout detail page showing the full logged sets: exercise name, weight, reps, per superset. The data is already in the `logged_sets` table in Supabase — it just isn't displayed anywhere.

**What to do:**
- Wrap each `<li>` in `app/history/page.tsx` with a `<Link href={/history/${w.id}}>` 
- Create `app/history/[id]/page.tsx` as a server component that queries `logged_sets` joined with the workout payload, grouped by superset
- Show a back button to `/history`

---

### 2. "Already trained today" flow fix
**File:** `app/workout/page.tsx`
If the user already completed a workout today, `getLatestWorkoutAction` returns null (it only returns today's workout if it hasn't been completed yet — or it returns it and `session` is null after save). The page shows "Ready to train?" which is confusing.

**What to do:**
- Detect the "completed today" state (check `workouts` table for a row today with a completed flag, or check `logged_sets` for rows linked to today's workout)
- Show a different empty state: "Great work today. See what you lifted →" linking to that workout's detail page

---

## P1 — Core fitness features

### 3. Streak tracker
**Files:** `app/page.tsx` or `app/profile/page.tsx`
Count consecutive days with at least one completed workout using the `workouts` table. Display on the home screen or profile page.

**What to do:**
- Write a server-side helper that walks backwards through `workouts` rows (ordered by date) and counts the streak
- Show streak count on profile page with a label like "7-day streak"

---

### 4. kg / lbs toggle
**Files:** `app/profile/page.tsx`, `supabase/migrations/`, `lib/types.ts`, `components/ui/ExerciseCard.tsx`
Store `weight_unit` (`kg` | `lbs`) in the `profiles` table. Convert display values throughout the workout and history screens.

**What to do:**
- Add `weight_unit text not null default 'kg'` to `profiles` via a new migration
- Add a toggle in profile page that calls a server action to update the preference
- Read the preference in ExerciseCard and history detail page to convert/display correctly

---

### 5. Personal records (PRs)
**Files:** `app/history/[id]/page.tsx`, `components/ui/ExerciseCard.tsx`
Track the heaviest weight ever logged per exercise per user. Show a "PR" badge on the exercise card when a new record is set mid-workout, or a PR list on the profile page.

**What to do:**
- Query `max(weight_kg)` grouped by `exercise_name` from `logged_sets`
- In the workout session, compare current log entry against the historical max
- Show a "PR" badge in ExerciseCard when current weight > previous max

---

## P2 — Polish

### 6. RPE / effort rating per session
Add a 1–10 effort slider on the workout complete screen. Save to a `rpe` column on the `workouts` table.

### 7. Rest timer customization
On the rest screen (`app/workout/rest/page.tsx`), add "+15s" and "−15s" buttons so users can override the AI-generated rest duration mid-session.

### 8. Push notifications
Daily "Time to train!" reminder via Web Push. Requires a service worker, a `push_subscriptions` table in Supabase, and a scheduled edge function to send the notification.

---

## Suggested session order

| Session | Task | Effort |
|---------|------|--------|
| 1 | History drill-down (#1) | ~1 hr |
| 2 | Already-trained-today fix (#2) | ~30 min |
| 3 | Streak tracker (#3) | ~1 hr |
| 4 | kg/lbs toggle (#4) | ~30 min |
| 5 | Personal records (#5) | ~1 hr |
| 6 | RPE rating (#6) | ~30 min |
| 7 | Rest timer customization (#7) | ~30 min |
| 8 | Push notifications (#8) | ~2 hr |
