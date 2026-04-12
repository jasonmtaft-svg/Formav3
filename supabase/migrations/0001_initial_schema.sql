-- Enable UUID generation
create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------
-- profiles — one row per auth user; stores training preferences
-- -----------------------------------------------------------------------
create table profiles (
  id          uuid primary key references auth.users on delete cascade,
  goal        text,
  days_per_week int,
  equipment   text,
  created_at  timestamptz default now() not null
);

alter table profiles enable row level security;

create policy "Users can read their own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Users can upsert their own profile"
  on profiles for insert
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on profiles for update
  using (auth.uid() = id);

-- Auto-create a profile row when a new user signs up
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- -----------------------------------------------------------------------
-- workouts — each AI-generated plan
-- -----------------------------------------------------------------------
create table workouts (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users on delete cascade not null,
  name         text not null,
  day          text not null,
  goal         text not null,
  equipment    text not null,
  generated_at timestamptz default now() not null,
  payload      jsonb not null
);

alter table workouts enable row level security;

create policy "Users can read their own workouts"
  on workouts for select
  using (auth.uid() = user_id);

create policy "Users can insert their own workouts"
  on workouts for insert
  with check (auth.uid() = user_id);

-- -----------------------------------------------------------------------
-- logged_sets — each completed superset within a session
-- -----------------------------------------------------------------------
create table logged_sets (
  id              uuid primary key default gen_random_uuid(),
  workout_id      uuid references workouts on delete cascade not null,
  user_id         uuid references auth.users on delete cascade not null,
  exercise_name   text not null,
  slot            text not null check (slot in ('a', 'b')),
  superset_index  int not null,
  weight_kg       numeric,
  reps            int,
  logged_at       timestamptz default now() not null
);

alter table logged_sets enable row level security;

create policy "Users can read their own sets"
  on logged_sets for select
  using (auth.uid() = user_id);

create policy "Users can insert their own sets"
  on logged_sets for insert
  with check (auth.uid() = user_id);
