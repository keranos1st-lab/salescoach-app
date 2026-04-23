-- SalesCoach AI: core tables + RLS (выполните в SQL Editor Supabase или через CLI)

-- Менеджеры (привязка к владельцу — auth.users)
create table public.managers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  score_avg numeric not null default 0,
  calls_count int not null default 0,
  created_at timestamptz not null default now()
);

-- Звонки (привязка к менеджеру)
create table public.calls (
  id uuid primary key default gen_random_uuid(),
  manager_id uuid not null references public.managers (id) on delete cascade,
  audio_url text,
  transcript text,
  score int,
  positives jsonb not null default '[]'::jsonb,
  negatives jsonb not null default '[]'::jsonb,
  next_task text,
  created_at timestamptz not null default now()
);

-- Прожарка / интервью
create table public.interviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  messages jsonb not null default '[]'::jsonb,
  analysis text,
  created_at timestamptz not null default now()
);

create index managers_user_id_idx on public.managers (user_id);
create index calls_manager_id_idx on public.calls (manager_id);
create index interviews_user_id_idx on public.interviews (user_id);

alter table public.managers enable row level security;
alter table public.calls enable row level security;
alter table public.interviews enable row level security;

-- managers: только свой tenant
create policy "managers_select_own"
  on public.managers for select
  using (auth.uid() = user_id);

create policy "managers_insert_own"
  on public.managers for insert
  with check (auth.uid() = user_id);

create policy "managers_update_own"
  on public.managers for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "managers_delete_own"
  on public.managers for delete
  using (auth.uid() = user_id);

-- calls: доступ через менеджера того же пользователя
create policy "calls_select_via_manager"
  on public.calls for select
  using (
    exists (
      select 1 from public.managers m
      where m.id = calls.manager_id and m.user_id = auth.uid()
    )
  );

create policy "calls_insert_via_manager"
  on public.calls for insert
  with check (
    exists (
      select 1 from public.managers m
      where m.id = calls.manager_id and m.user_id = auth.uid()
    )
  );

create policy "calls_update_via_manager"
  on public.calls for update
  using (
    exists (
      select 1 from public.managers m
      where m.id = calls.manager_id and m.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.managers m
      where m.id = calls.manager_id and m.user_id = auth.uid()
    )
  );

create policy "calls_delete_via_manager"
  on public.calls for delete
  using (
    exists (
      select 1 from public.managers m
      where m.id = calls.manager_id and m.user_id = auth.uid()
    )
  );

-- interviews: только свои записи
create policy "interviews_select_own"
  on public.interviews for select
  using (auth.uid() = user_id);

create policy "interviews_insert_own"
  on public.interviews for insert
  with check (auth.uid() = user_id);

create policy "interviews_update_own"
  on public.interviews for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "interviews_delete_own"
  on public.interviews for delete
  using (auth.uid() = user_id);
