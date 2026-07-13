-- Ejecuta esto en el SQL Editor de tu proyecto Supabase

create table if not exists cashflow_rules (
  user_id uuid references auth.users on delete cascade not null,
  data jsonb not null default '[]'::jsonb,
  primary key (user_id)
);

create table if not exists personal_events (
  user_id uuid references auth.users on delete cascade not null,
  data jsonb not null default '[]'::jsonb,
  primary key (user_id)
);

create table if not exists chores (
  user_id uuid references auth.users on delete cascade not null,
  data jsonb not null default '[]'::jsonb,
  primary key (user_id)
);

create table if not exists expenses (
  user_id uuid references auth.users on delete cascade not null,
  data jsonb not null default '[]'::jsonb,
  primary key (user_id)
);

create table if not exists devhub_items (
  user_id uuid references auth.users on delete cascade not null,
  data jsonb not null default '[]'::jsonb,
  primary key (user_id)
);

create table if not exists devbot_history (
  user_id uuid references auth.users on delete cascade not null,
  data jsonb not null default '[]'::jsonb,
  primary key (user_id)
);

-- Permisos: cada usuario solo puede ver/modificar su propia fila
alter table cashflow_rules enable row level security;
alter table personal_events enable row level security;
alter table chores enable row level security;
alter table expenses enable row level security;
alter table devhub_items enable row level security;
alter table devbot_history enable row level security;

create policy "users can manage own cashflow_rules"
  on cashflow_rules for all using (auth.uid() = user_id);

create policy "users can manage own personal_events"
  on personal_events for all using (auth.uid() = user_id);

create policy "users can manage own chores"
  on chores for all using (auth.uid() = user_id);

create policy "users can manage own expenses"
  on expenses for all using (auth.uid() = user_id);

create policy "users can manage own devhub_items"
  on devhub_items for all using (auth.uid() = user_id);

create policy "users can manage own devbot_history"
  on devbot_history for all using (auth.uid() = user_id);
