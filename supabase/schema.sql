-- Workout Builder database schema.
-- Paste this whole file into the Supabase Dashboard's SQL Editor and click "Run".
-- Safe to run once on a fresh project. Re-running is not needed/supported.

-- =========================================================================
-- exercises: shared catalog rows (owner_id null) + your own custom rows
-- =========================================================================
create table public.exercises (
  id text primary key,
  name text not null,
  force text check (force in ('push', 'pull', 'static')),
  level text not null check (level in ('beginner', 'intermediate', 'expert')),
  mechanic text check (mechanic in ('compound', 'isolation')),
  equipment text not null,
  primary_muscles text[] not null default '{}',
  secondary_muscles text[] not null default '{}',
  muscle_group text not null,
  instructions text[] not null default '{}',
  category text not null,
  movement_pattern text not null,
  source text not null check (source in ('seed', 'custom')),
  owner_id uuid references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.exercises enable row level security;

create policy "exercises are readable by everyone signed in"
  on public.exercises for select
  to authenticated
  using (owner_id is null or owner_id = auth.uid());

create policy "users can insert their own custom exercises"
  on public.exercises for insert
  to authenticated
  with check (owner_id = auth.uid() and source = 'custom');

create policy "users can update their own custom exercises"
  on public.exercises for update
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "users can delete their own custom exercises"
  on public.exercises for delete
  to authenticated
  using (owner_id = auth.uid());

-- =========================================================================
-- exercise_preferences: per-user favorite/hidden flags on any exercise
-- (kept separate from `exercises` since that table is shared - see SETUP.md)
-- =========================================================================
create table public.exercise_preferences (
  user_id uuid not null references auth.users (id) on delete cascade,
  exercise_id text not null references public.exercises (id) on delete cascade,
  is_favorite boolean not null default false,
  is_hidden boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, exercise_id)
);

alter table public.exercise_preferences enable row level security;

create policy "users manage only their own exercise preferences"
  on public.exercise_preferences for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- =========================================================================
-- equipment_inventory
-- =========================================================================
create table public.equipment_inventory (
  user_id uuid not null references auth.users (id) on delete cascade,
  equipment_tag text not null,
  available boolean not null default false,
  min_load_kg numeric,
  max_load_kg numeric,
  primary key (user_id, equipment_tag)
);

alter table public.equipment_inventory enable row level security;

create policy "users manage only their own equipment inventory"
  on public.equipment_inventory for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- =========================================================================
-- mesocycles
-- =========================================================================
create table public.mesocycles (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  program_template_id text not null,
  goal text not null,
  cycle_number int not null,
  start_date text not null,
  status text not null check (status in ('active', 'completed', 'abandoned')),
  baseline_weights jsonb not null default '{}',
  progression_settings jsonb not null,
  previous_mesocycle_id text references public.mesocycles (id)
);

create index mesocycles_user_status_idx on public.mesocycles (user_id, status);

alter table public.mesocycles enable row level security;

create policy "users manage only their own mesocycles"
  on public.mesocycles for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- =========================================================================
-- workout_sessions
-- =========================================================================
create table public.workout_sessions (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  mesocycle_id text not null references public.mesocycles (id) on delete cascade,
  week_number smallint not null check (week_number between 1 and 5),
  day_index smallint not null,
  label text not null,
  status text not null check (status in ('planned', 'in_progress', 'completed', 'skipped')),
  started_at timestamptz,
  completed_at timestamptz
);

create index workout_sessions_mesocycle_week_idx on public.workout_sessions (mesocycle_id, week_number, day_index);
create index workout_sessions_user_status_idx on public.workout_sessions (user_id, status, completed_at desc);

alter table public.workout_sessions enable row level security;

create policy "users manage only their own workout sessions"
  on public.workout_sessions for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- =========================================================================
-- session_exercises
-- =========================================================================
create table public.session_exercises (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  session_id text not null references public.workout_sessions (id) on delete cascade,
  exercise_id text not null references public.exercises (id),
  slot_id text not null,
  movement_pattern text not null,
  order_index smallint not null,
  role text not null check (role in ('main', 'accessory')),
  body_region text not null check (body_region in ('upper', 'lower')),
  target_sets smallint not null,
  target_rep_range_min smallint not null,
  target_rep_range_max smallint not null,
  target_weight numeric,
  rest_seconds smallint not null,
  swapped_from_exercise_id text
);

create index session_exercises_session_idx on public.session_exercises (session_id, order_index);
create index session_exercises_user_exercise_idx on public.session_exercises (user_id, exercise_id);

alter table public.session_exercises enable row level security;

create policy "users manage only their own session exercises"
  on public.session_exercises for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- =========================================================================
-- set_logs
-- =========================================================================
create table public.set_logs (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  session_exercise_id text not null references public.session_exercises (id) on delete cascade,
  set_index smallint not null,
  is_warmup boolean not null default false,
  actual_reps smallint,
  actual_weight numeric,
  rpe numeric,
  completed_at timestamptz,
  is_pr boolean not null default false,
  pr_type text check (pr_type in ('e1rm', 'rep')),
  unique (session_exercise_id, set_index)
);

alter table public.set_logs enable row level security;

create policy "users manage only their own set logs"
  on public.set_logs for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- =========================================================================
-- body_metrics
-- =========================================================================
create table public.body_metrics (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  weight_kg numeric,
  body_fat_pct numeric,
  notes text
);

alter table public.body_metrics enable row level security;

create policy "users manage only their own body metrics"
  on public.body_metrics for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- =========================================================================
-- settings: one row per account, auto-created on sign-up (see trigger below)
-- =========================================================================
create table public.settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  unit_system text not null default 'kg',
  goal text not null default 'general',
  onboarding_completed boolean not null default false,
  rest_timer_main_sec smallint not null default 90,
  rest_timer_accessory_sec smallint not null default 60,
  progression_rule_set jsonb not null default '{
    "upperBodyIncrementKg": 1.25,
    "lowerBodyIncrementKg": 2.5,
    "roundingIncrementKg": 2.5,
    "successThresholdPct": 0.9
  }'::jsonb,
  one_rep_max_formula text not null default 'epley'
);

alter table public.settings enable row level security;

create policy "users manage only their own settings"
  on public.settings for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Automatically create a default settings row the moment someone signs up,
-- so the app never has to handle "no settings row yet".
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.settings (user_id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
