-- user_id: UUID -> TEXT (идентификаторы Clerk и др. как строка)
-- Требуется снять FK на auth.users(id) и обновить RLS (сравнение через text).

-- managers
drop policy if exists "managers_select_own" on public.managers;
drop policy if exists "managers_insert_own" on public.managers;
drop policy if exists "managers_update_own" on public.managers;
drop policy if exists "managers_delete_own" on public.managers;

alter table public.managers
  drop constraint if exists managers_user_id_fkey;

alter table public.managers
  alter column user_id type text using user_id::text;

create policy "managers_select_own"
  on public.managers for select
  using ((auth.uid())::text = user_id);

create policy "managers_insert_own"
  on public.managers for insert
  with check ((auth.uid())::text = user_id);

create policy "managers_update_own"
  on public.managers for update
  using ((auth.uid())::text = user_id)
  with check ((auth.uid())::text = user_id);

create policy "managers_delete_own"
  on public.managers for delete
  using ((auth.uid())::text = user_id);

-- calls (политики ссылаются на m.user_id)
drop policy if exists "calls_select_via_manager" on public.calls;
drop policy if exists "calls_insert_via_manager" on public.calls;
drop policy if exists "calls_update_via_manager" on public.calls;
drop policy if exists "calls_delete_via_manager" on public.calls;

alter table public.calls
  drop constraint if exists calls_user_id_fkey;

alter table public.calls
  alter column user_id type text using user_id::text;

create policy "calls_select_via_manager"
  on public.calls for select
  using (
    exists (
      select 1 from public.managers m
      where m.id = calls.manager_id and m.user_id = (auth.uid())::text
    )
  );

create policy "calls_insert_via_manager"
  on public.calls for insert
  with check (
    exists (
      select 1 from public.managers m
      where m.id = calls.manager_id and m.user_id = (auth.uid())::text
    )
  );

create policy "calls_update_via_manager"
  on public.calls for update
  using (
    exists (
      select 1 from public.managers m
      where m.id = calls.manager_id and m.user_id = (auth.uid())::text
    )
  )
  with check (
    exists (
      select 1 from public.managers m
      where m.id = calls.manager_id and m.user_id = (auth.uid())::text
    )
  );

create policy "calls_delete_via_manager"
  on public.calls for delete
  using (
    exists (
      select 1 from public.managers m
      where m.id = calls.manager_id and m.user_id = (auth.uid())::text
    )
  );

-- company_profile
drop policy if exists "Users manage own profile" on public.company_profile;

alter table public.company_profile
  drop constraint if exists company_profile_user_id_fkey;

alter table public.company_profile
  alter column user_id type text using user_id::text;

create policy "Users manage own profile"
  on public.company_profile
  for all
  using ((auth.uid())::text = user_id)
  with check ((auth.uid())::text = user_id);
