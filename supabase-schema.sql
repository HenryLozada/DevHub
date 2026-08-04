-- Ejecuta esto en el SQL Editor de tu proyecto Supabase

create table if not exists cashflow_rules (
  user_id uuid references auth.users on delete cascade not null,
  data jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id)
);

create table if not exists personal_events (
  user_id uuid references auth.users on delete cascade not null,
  data jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id)
);

create table if not exists event_completed (
  user_id uuid references auth.users on delete cascade not null,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id)
);

create table if not exists chores (
  user_id uuid references auth.users on delete cascade not null,
  data jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id)
);

create table if not exists expenses (
  user_id uuid references auth.users on delete cascade not null,
  data jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id)
);

create table if not exists devhub_items (
  user_id uuid references auth.users on delete cascade not null,
  data jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id)
);

create table if not exists devbot_history (
  user_id uuid references auth.users on delete cascade not null,
  data jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id)
);

-- Si las tablas ya existían sin updated_at:
alter table cashflow_rules add column if not exists updated_at timestamptz not null default now();
alter table personal_events add column if not exists updated_at timestamptz not null default now();
alter table chores add column if not exists updated_at timestamptz not null default now();
alter table expenses add column if not exists updated_at timestamptz not null default now();
alter table devhub_items add column if not exists updated_at timestamptz not null default now();
alter table devbot_history add column if not exists updated_at timestamptz not null default now();

alter table cashflow_rules enable row level security;
alter table personal_events enable row level security;
alter table event_completed enable row level security;
alter table chores enable row level security;
alter table expenses enable row level security;
alter table devhub_items enable row level security;
alter table devbot_history enable row level security;

drop policy if exists "users can manage own cashflow_rules" on cashflow_rules;
create policy "users can manage own cashflow_rules"
  on cashflow_rules for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "users can manage own personal_events" on personal_events;
create policy "users can manage own personal_events"
  on personal_events for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "users can manage own event_completed" on event_completed;
create policy "users can manage own event_completed"
  on event_completed for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "users can manage own chores" on chores;
create policy "users can manage own chores"
  on chores for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "users can manage own expenses" on expenses;
create policy "users can manage own expenses"
  on expenses for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "users can manage own devhub_items" on devhub_items;
create policy "users can manage own devhub_items"
  on devhub_items for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "users can manage own devbot_history" on devbot_history;
create policy "users can manage own devbot_history"
  on devbot_history for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
