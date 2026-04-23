create table if not exists public.company_profile (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  site_url text,
  parsed_text text,
  manual_description text,
  updated_at timestamptz not null default now()
);

create unique index if not exists company_profile_user_id_uidx
  on public.company_profile (user_id);

alter table public.company_profile enable row level security;

drop policy if exists "Users manage own profile" on public.company_profile;
create policy "Users manage own profile"
  on public.company_profile
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
