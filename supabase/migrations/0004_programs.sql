-- -----------------------------------------------------------------------
-- programs — one per training cycle (12-week block)
-- -----------------------------------------------------------------------
create table programs (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users on delete cascade not null,
  goal          text not null,
  equipment     text not null,
  days_per_week int not null,
  blueprint     jsonb not null,
  status        text not null default 'active'
                  check (status in ('active', 'completed')),
  created_at    timestamptz default now() not null
);

alter table programs enable row level security;

create policy "Users can read their own programs"
  on programs for select
  using (auth.uid() = user_id);

create policy "Users can insert their own programs"
  on programs for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own programs"
  on programs for update
  using (auth.uid() = user_id);

-- -----------------------------------------------------------------------
-- Link workouts to the program that generated them
-- -----------------------------------------------------------------------
alter table workouts
  add column program_id   uuid references programs on delete set null,
  add column week_number  int,
  add column block_number int,
  add column day_index    int;

-- -----------------------------------------------------------------------
-- Track which program the user is currently on
-- -----------------------------------------------------------------------
alter table profiles
  add column current_program_id uuid references programs on delete set null;
