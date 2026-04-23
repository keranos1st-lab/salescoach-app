alter table public.company_profile
  add column if not exists niche text,
  add column if not exists services jsonb,
  add column if not exists products jsonb,
  add column if not exists regions jsonb,
  add column if not exists min_check integer,
  add column if not exists avg_check integer,
  add column if not exists priority_clients text,
  add column if not exists unique_selling_points jsonb,
  add column if not exists upsell_services jsonb,
  add column if not exists anti_ideal_clients text;
