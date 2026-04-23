-- Align public.company_profile with current product profile fields used in API/UI.
-- Safe migration: adds missing columns and normalizes legacy types.

alter table public.company_profile
  add column if not exists niche text,
  add column if not exists services text[],
  add column if not exists products text[],
  add column if not exists regions text[],
  add column if not exists min_check numeric,
  add column if not exists avg_check numeric,
  add column if not exists priority_clients text,
  add column if not exists unique_selling_points text[],
  add column if not exists upsell_services text[],
  add column if not exists anti_ideal_clients text;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'company_profile'
      and column_name = 'services'
      and udt_name = 'jsonb'
  ) then
    alter table public.company_profile
      alter column services type text[]
      using (
        case
          when services is null then null
          else array(
            select jsonb_array_elements_text(services)
          )
        end
      );
  end if;
end $$;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'company_profile'
      and column_name = 'products'
      and udt_name = 'jsonb'
  ) then
    alter table public.company_profile
      alter column products type text[]
      using (
        case
          when products is null then null
          else array(
            select jsonb_array_elements_text(products)
          )
        end
      );
  end if;
end $$;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'company_profile'
      and column_name = 'regions'
      and udt_name = 'jsonb'
  ) then
    alter table public.company_profile
      alter column regions type text[]
      using (
        case
          when regions is null then null
          else array(
            select jsonb_array_elements_text(regions)
          )
        end
      );
  end if;
end $$;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'company_profile'
      and column_name = 'unique_selling_points'
      and udt_name = 'jsonb'
  ) then
    alter table public.company_profile
      alter column unique_selling_points type text[]
      using (
        case
          when unique_selling_points is null then null
          else array(
            select jsonb_array_elements_text(unique_selling_points)
          )
        end
      );
  end if;
end $$;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'company_profile'
      and column_name = 'upsell_services'
      and udt_name = 'jsonb'
  ) then
    alter table public.company_profile
      alter column upsell_services type text[]
      using (
        case
          when upsell_services is null then null
          else array(
            select jsonb_array_elements_text(upsell_services)
          )
        end
      );
  end if;
end $$;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'company_profile'
      and column_name = 'min_check'
      and data_type = 'integer'
  ) then
    alter table public.company_profile
      alter column min_check type numeric
      using min_check::numeric;
  end if;
end $$;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'company_profile'
      and column_name = 'avg_check'
      and data_type = 'integer'
  ) then
    alter table public.company_profile
      alter column avg_check type numeric
      using avg_check::numeric;
  end if;
end $$;
