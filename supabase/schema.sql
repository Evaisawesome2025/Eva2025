-- ===========================================================================
-- Sioux Falls Flip Radar — Supabase schema
-- Run in the Supabase SQL editor (or via the CLI). Designed to live alongside
-- Supabase Auth: `users.id` references auth.users(id).
--
-- Row Level Security is enabled on every table so this stays a *private*
-- dashboard — each user can only ever see their own rows.
-- ===========================================================================

create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------------------------
-- updated_at trigger helper
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ---------------------------------------------------------------------------
-- users (profile + per-user settings; mirrors auth.users)
-- ---------------------------------------------------------------------------
create table if not exists public.users (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text unique not null,
  full_name   text,
  settings    jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- properties (one row per physical address)
-- ---------------------------------------------------------------------------
create table if not exists public.properties (
  id                uuid primary key default uuid_generate_v4(),
  user_id           uuid not null references public.users(id) on delete cascade,
  formatted_address text not null,
  place_id          text,
  latitude          double precision,
  longitude         double precision,
  street            text,
  city              text,
  state             text,
  zip               text,
  county            text,
  beds              integer,
  baths             numeric,
  sqft              integer,
  lot_size          integer,
  year_built        integer,
  property_type     text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (user_id, place_id)
);
create index if not exists properties_user_id_idx on public.properties(user_id);
create index if not exists properties_city_state_idx on public.properties(city, state);

-- ---------------------------------------------------------------------------
-- property_analysis (flip underwrite snapshots)
-- ---------------------------------------------------------------------------
create table if not exists public.property_analysis (
  id                    uuid primary key default uuid_generate_v4(),
  property_id           uuid not null references public.properties(id) on delete cascade,
  user_id               uuid not null references public.users(id) on delete cascade,
  purchase_price        numeric,
  estimated_arv         numeric,
  estimated_repairs     numeric,
  holding_months        integer,
  financing_cost        numeric,
  selling_cost_pct      numeric,
  closing_cost_estimate numeric,
  max_offer             numeric,
  estimated_profit      numeric,
  flip_score            integer,
  verdict               text check (verdict in ('green','yellow','red')),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
create index if not exists property_analysis_property_id_idx on public.property_analysis(property_id);
create index if not exists property_analysis_user_id_idx on public.property_analysis(user_id);

-- ---------------------------------------------------------------------------
-- comparable_sales (comps from approved providers only)
-- ---------------------------------------------------------------------------
create table if not exists public.comparable_sales (
  id                uuid primary key default uuid_generate_v4(),
  property_id       uuid not null references public.properties(id) on delete cascade,
  formatted_address text,
  distance_miles    numeric,
  sale_price        numeric,
  sale_date         date,
  beds              integer,
  baths             numeric,
  sqft              integer,
  price_per_sqft    numeric,
  source            text,
  created_at        timestamptz not null default now()
);
create index if not exists comparable_sales_property_id_idx on public.comparable_sales(property_id);

-- ---------------------------------------------------------------------------
-- saved_deals
-- ---------------------------------------------------------------------------
create table if not exists public.saved_deals (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.users(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  analysis_id uuid references public.property_analysis(id) on delete set null,
  status      text not null default 'watching'
              check (status in ('watching','pursuing','offer_made','under_contract','passed')),
  share_token text unique,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id, property_id)
);
create index if not exists saved_deals_user_id_idx on public.saved_deals(user_id);

-- ---------------------------------------------------------------------------
-- property_photos (metadata; image bytes live in Supabase Storage)
-- ---------------------------------------------------------------------------
create table if not exists public.property_photos (
  id           uuid primary key default uuid_generate_v4(),
  property_id  uuid not null references public.properties(id) on delete cascade,
  user_id      uuid not null references public.users(id) on delete cascade,
  storage_path text not null,
  caption      text,
  created_at   timestamptz not null default now()
);
create index if not exists property_photos_property_id_idx on public.property_photos(property_id);

-- ---------------------------------------------------------------------------
-- notes
-- ---------------------------------------------------------------------------
create table if not exists public.notes (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.users(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  body        text not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists notes_property_id_idx on public.notes(property_id);

-- ---------------------------------------------------------------------------
-- data_sources (registry of approved integrations)
-- Not user-scoped: this is global config managed by the owner.
-- ---------------------------------------------------------------------------
create table if not exists public.data_sources (
  id             uuid primary key default uuid_generate_v4(),
  key            text unique not null,
  name           text not null,
  category       text,
  enabled        boolean not null default false,
  approved       boolean not null default false,
  base_url       text,
  last_synced_at timestamptz,
  notes          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'users','properties','property_analysis','saved_deals','notes','data_sources'
  ] loop
    execute format('drop trigger if exists set_%1$s_updated_at on public.%1$s;', t);
    execute format(
      'create trigger set_%1$s_updated_at before update on public.%1$s
         for each row execute function public.set_updated_at();', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.users             enable row level security;
alter table public.properties        enable row level security;
alter table public.property_analysis enable row level security;
alter table public.comparable_sales  enable row level security;
alter table public.saved_deals       enable row level security;
alter table public.notes             enable row level security;
alter table public.property_photos   enable row level security;
alter table public.data_sources      enable row level security;

-- users: a user can read/update only their own profile row.
drop policy if exists "users self access" on public.users;
create policy "users self access" on public.users
  for all using (auth.uid() = id) with check (auth.uid() = id);

-- Generic owner policy for user-scoped tables.
drop policy if exists "properties owner" on public.properties;
create policy "properties owner" on public.properties
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "property_analysis owner" on public.property_analysis;
create policy "property_analysis owner" on public.property_analysis
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "saved_deals owner" on public.saved_deals;
create policy "saved_deals owner" on public.saved_deals
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "notes owner" on public.notes;
create policy "notes owner" on public.notes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "property_photos owner" on public.property_photos;
create policy "property_photos owner" on public.property_photos
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- comparable_sales: scoped via the parent property's owner.
drop policy if exists "comparable_sales owner" on public.comparable_sales;
create policy "comparable_sales owner" on public.comparable_sales
  for all using (
    exists (
      select 1 from public.properties p
      where p.id = comparable_sales.property_id and p.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.properties p
      where p.id = comparable_sales.property_id and p.user_id = auth.uid()
    )
  );

-- data_sources: readable by any authenticated user; writes via service role only.
drop policy if exists "data_sources read" on public.data_sources;
create policy "data_sources read" on public.data_sources
  for select using (auth.role() = 'authenticated');

-- ---------------------------------------------------------------------------
-- Auto-provision a public.users row when an auth user is created.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Seed the approved data-source registry (all disabled until you add keys).
-- ---------------------------------------------------------------------------
insert into public.data_sources (key, name, category, approved, enabled, notes) values
  ('google_geocoding', 'Google Geocoding & Places', 'geocoding',     true,  true,  'Address autocomplete + county lookup.'),
  ('rentcast',         'RentCast',                  'valuation',     true,  false, 'AVM, rent estimates, comps. Add RENTCAST_API_KEY.'),
  ('attom',            'ATTOM Data',                'public_records', true,  false, 'Property + sales history. Add ATTOM_API_KEY.'),
  ('county_gis',       'County GIS / Open Data',    'public_records', true,  false, 'Minnehaha/Lincoln County parcel data.'),
  ('mls_idx',          'Broker MLS / IDX Feed',     'comps',          true,  false, 'Licensed IDX feed only.')
on conflict (key) do nothing;

-- ---------------------------------------------------------------------------
-- Storage bucket for property photos (private; owner-scoped access).
-- Paths are namespaced by user id: `<auth.uid()>/<property_id>/<file>`.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('property-photos', 'property-photos', false)
on conflict (id) do nothing;

drop policy if exists "property-photos owner read" on storage.objects;
create policy "property-photos owner read" on storage.objects
  for select using (
    bucket_id = 'property-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "property-photos owner write" on storage.objects;
create policy "property-photos owner write" on storage.objects
  for insert with check (
    bucket_id = 'property-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "property-photos owner delete" on storage.objects;
create policy "property-photos owner delete" on storage.objects
  for delete using (
    bucket_id = 'property-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
