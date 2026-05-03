-- Денормализованный user_id на звонках (для вставки с явным владельцем)
alter table public.calls add column if not exists user_id uuid references auth.users (id) on delete cascade;

update public.calls c
set user_id = m.user_id
from public.managers m
where c.manager_id = m.id and c.user_id is null;

alter table public.calls alter column user_id set not null;

create index if not exists calls_user_id_idx on public.calls (user_id);
