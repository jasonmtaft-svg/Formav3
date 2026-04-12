# Forma — Project Specification

## What is Forma?

Forma is a mobile-first AI fitness web app. Users answer three questions about their goal, available equipment, and training frequency. Forma calls the Claude API to generate a personalised superset-based workout, then guides the user through each exercise with a built-in timer, weight/rep logging, and a rest period between supersets.

The aesthetic is minimal and premium: dark background (`#1a1a1a`), off-white text (`#f5f5f5`), DM Sans typeface, pill chips for selection, and a custom SVG logotype.

---

## Current Prototype (What Exists)

The current codebase is a Vercel-hosted, vanilla HTML/CSS/JS multi-page app with one serverless API route. It works end-to-end but has significant structural debt:

- **No real auth** — the sign-in form navigates directly to onboarding
- **No persistence** — all state lives in `sessionStorage` and is lost on close
- **No workout history** — "Previous" values are always hardcoded as "First session"
- **No progressive overload tracking** — logged weight/reps are never saved
- **Repeated CSS** — design tokens duplicated across 6 HTML files
- **No component reuse** — the header, progress bar, timer, and cards are copy-pasted

### Existing Screens

| Screen | File | Purpose |
|---|---|---|
| Sign In | `index.html` | Email + password form. Auth is stubbed. |
| Build Plan (Onboarding) | `onboarding.html` | Select goal, days/week, equipment → calls AI |
| Workout | `workout.html` | Active superset view with A/B cards, timer, weight/rep inputs |
| Rest | `rest.html` | Countdown between supersets with "up next" preview |
| Complete | `complete.html` | Post-workout summary (supersets, sets, est. time) |
| Profile | `profile.html` | Training preferences display + "Regenerate plan" |

### Existing API

`api/generate.js` — Vercel serverless function. Accepts `{ goal, daysPerWeek, equipment }`, calls `claude-sonnet-4-20250514`, and returns a structured JSON workout:

```ts
{
  workoutName: string
  day: string
  supersets: Array<{
    restSeconds: number
    a: { name: string; detail: string; prev: string; timerSeconds: number }
    b: { name: string; detail: string; prev: string; timerSeconds: number }
  }>
}
```

---

## Design System

### Tokens

| Token | Value |
|---|---|
| Background | `#1a1a1a` |
| Surface | `#242424` |
| Surface elevated | `#282828` |
| Border subtle | `#2e2e2e` |
| Border default | `#333` |
| Border active | `#555` |
| Text primary | `#f5f5f5` |
| Text secondary | `#888` |
| Text muted | `#666` |
| Text disabled | `#555` |
| Error | `#e06060` |

### Typography

- **Font:** DM Sans (Google Fonts)
- **Weights:** 300, 400, 500, 600
- **Scale:** 11px labels → 32px headings

### Components (recurring patterns)

- **Chip / pill** — bordered pill button, fills white on selection
- **Primary button** — white bg, dark text, rounded-12, full width
- **Secondary button** — transparent, muted border, muted text
- **Exercise card** — surface bg, bordered, contains name / detail / weight+rep inputs / prev value
- **Progress bar** — row of flex dots: done (white), active (grey), upcoming (dark)
- **Timer ring** — SVG circle countdown (used on workout screen)
- **Big timer** — giant lightweight number (used on rest screen)

### Logo

SVG inline: vertical spine with two curved branches — a simplified human form / tree. Used at 22×34 (small) and 32×52 (large).

---

## User Flow

```
Sign In / Sign Up
       │
       ▼
  Build Plan (Onboarding)
  ┌──────────────────────┐
  │ 1. Select goal       │
  │ 2. Days per week     │
  │ 3. Equipment         │
  │ → Generate via AI    │
  └──────────────────────┘
       │
       ▼
  Workout (Superset N)
  ┌──────────────────────┐
  │ Exercise A           │
  │  → log weight + reps │
  │  → timer countdown   │
  │ Exercise B           │
  │  → log weight + reps │
  │  → timer countdown   │
  └──────────────────────┘
       │              │
  More supersets   Last superset
       │              │
       ▼              ▼
     Rest          Complete
  (countdown +   (stats summary)
   up next)
       │
       ▼
  Next superset...
```

---

## Recommended Tech Stack for the Rebuild

### Why not stay with vanilla HTML?

The prototype proves the concept. To build Forma properly — with auth, history, progressive overload, and a shared design system — vanilla HTML becomes unmaintainable. The core issues are no component reuse, no shared state, and no database layer.

### Recommended Stack

#### Language: TypeScript
All layers. Catches data-shape mismatches between the AI response, the database, and the UI before they become runtime bugs.

#### Frontend: Next.js 14+ (App Router)
- Deploys to Vercel with zero config (already using Vercel)
- App Router enables shared layouts — one header/nav component wraps all screens
- React Server Components keep the AI call on the server (no exposed API key)
- Excellent TypeScript support
- Large ecosystem; easy to hire for

#### Styling: Tailwind CSS
- Maps directly onto the existing token system
- Mobile-first by default (`sm:` breakpoints)
- Replaces the 6 copies of duplicated CSS with a single `tailwind.config.ts`

#### Auth + Database: Supabase
- Handles email/password auth with minimal setup
- PostgreSQL database for users, workouts, and logged sets
- Row Level Security means no user can read another's data
- Free tier is generous for early-stage

#### AI: Anthropic TypeScript SDK
- Replace the raw `fetch` with the official SDK
- Use structured output / `tool_use` for guaranteed JSON shape
- Enable prompt caching on the system prompt (saves ~80% token cost on repeated generations)

#### State: React Context + `useReducer` (or Zustand)
- Replace `sessionStorage` with in-memory state passed through context
- Persist preferences + history to Supabase on workout completion

---

## Target Data Model

```sql
-- Users managed by Supabase Auth

-- User training preferences (replaces sessionStorage)
create table profiles (
  id uuid primary key references auth.users,
  goal text,
  days_per_week int,
  equipment text,
  created_at timestamptz default now()
);

-- Each AI-generated workout plan
create table workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users,
  name text,
  day text,
  goal text,
  equipment text,
  generated_at timestamptz default now(),
  payload jsonb  -- full AI response stored for replay
);

-- Each completed superset within a workout session
create table logged_sets (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid references workouts,
  user_id uuid references auth.users,
  exercise_name text,
  slot text,           -- 'a' or 'b'
  superset_index int,
  weight_kg numeric,
  reps int,
  logged_at timestamptz default now()
);
```

---

## Target Screen List (Rebuild)

| Route | Screen | Notes |
|---|---|---|
| `/` | Sign In | Real Supabase auth |
| `/signup` | Create Account | Name, email, password |
| `/onboarding` | Build Plan | Same 3-step chip flow |
| `/workout` | Active Workout | Reads active plan from context/db |
| `/workout/rest` | Rest Screen | Same countdown + up next |
| `/workout/complete` | Complete | Save to DB, show real stats |
| `/history` | Workout History | List of past sessions |
| `/profile` | Profile | Edit preferences, sign out |

---

## What to Preserve from the Prototype

- **The exact visual design** — tokens, spacing, chip pattern, card layout
- **The timer mechanic** — SVG ring on exercise, big number on rest
- **The superset A/B flow** — this is the core UX, it works well
- **The AI prompt structure** — the JSON schema returned by Claude is clean; keep it
- **The Forma logo SVG** — the two-branch spine mark

## What to Fix / Add

- Real authentication
- Persist workout history to database
- Pre-fill "prev" values from the last logged set for each exercise
- Workout history / calendar view
- Progressive overload: nudge the user to add weight when prev reps hit target
- Skeleton loading states (currently just a text message while AI generates)
- Error boundaries around the AI call
- PWA manifest so it installs to home screen on iOS

---

## Deployment

- **Platform:** Vercel (no change)
- **Environment variables needed:**
  - `ANTHROPIC_API_KEY`
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY` (server-side only)

---

## Project Structure (Next.js App Router)

```
forma/
├── app/
│   ├── layout.tsx              # Root layout (font, theme)
│   ├── page.tsx                # Sign in
│   ├── signup/page.tsx
│   ├── onboarding/page.tsx
│   ├── workout/
│   │   ├── layout.tsx          # Workout session context
│   │   ├── page.tsx            # Active superset
│   │   ├── rest/page.tsx
│   │   └── complete/page.tsx
│   ├── history/page.tsx
│   └── profile/page.tsx
├── components/
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Chip.tsx
│   │   ├── ExerciseCard.tsx
│   │   ├── ProgressBar.tsx
│   │   ├── TimerRing.tsx
│   │   └── Logo.tsx
│   └── workout/
│       ├── SupersetView.tsx
│       └── RestView.tsx
├── lib/
│   ├── anthropic.ts            # AI generation with SDK + caching
│   ├── supabase/
│   │   ├── client.ts
│   │   └── server.ts
│   └── types.ts                # Shared TypeScript types
├── actions/
│   ├── generate-workout.ts     # Server action: call Claude
│   └── log-workout.ts          # Server action: save to Supabase
└── tailwind.config.ts          # Design tokens
```
