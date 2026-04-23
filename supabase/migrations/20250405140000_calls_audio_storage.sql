-- Bucket для аудио звонков (лимит ~25 МБ; при ошибке INSERT создайте bucket в Dashboard вручную)
insert into storage.buckets (id, name, public, file_size_limit)
values ('calls-audio', 'calls-audio', false, 26214400)
on conflict (id) do update set file_size_limit = excluded.file_size_limit;

-- Загрузка только в папку с UUID пользователя (первый сегмент пути)
drop policy if exists "calls_audio_insert_own" on storage.objects;
drop policy if exists "calls_audio_select_own" on storage.objects;
drop policy if exists "calls_audio_update_own" on storage.objects;
drop policy if exists "calls_audio_delete_own" on storage.objects;

create policy "calls_audio_insert_own"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'calls-audio'
    and split_part(name, '/', 1) = auth.uid()::text
  );

create policy "calls_audio_select_own"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'calls-audio'
    and split_part(name, '/', 1) = auth.uid()::text
  );

create policy "calls_audio_update_own"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'calls-audio'
    and split_part(name, '/', 1) = auth.uid()::text
  )
  with check (
    bucket_id = 'calls-audio'
    and split_part(name, '/', 1) = auth.uid()::text
  );

create policy "calls_audio_delete_own"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'calls-audio'
    and split_part(name, '/', 1) = auth.uid()::text
  );
