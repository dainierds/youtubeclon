-- 1. Ampliar el tipo enum user_role
-- Nota: En Postgres no se puede hacer ALTER TYPE para agregar valores a un enum dentro de una transacción.
-- Ejecutamos la consulta directa para agregarlo.
alter type user_role add value if not exists 'creator';

-- 2. Modificar tabla profiles para soporte de Stripe Connect
alter table public.profiles add column stripe_connect_account_id text;
alter table public.profiles add column stripe_connect_onboarded boolean default false not null;

-- 3. Crear tipos enum específicos para el Marketplace
create type scenario_grant_type as enum ('purchase', 'admin_grant');

-- 4. Crear tabla de listados en el Marketplace
create table public.marketplace_listings (
  id uuid default gen_random_uuid() primary key,
  scenario_id uuid references public.scenarios(id) on delete cascade not null,
  creator_id uuid references public.profiles(id) on delete cascade not null,
  price_cents integer not null check (price_cents >= 0),
  is_active boolean default true not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Crear tabla de accesos a escenarios por empresa
create table public.company_scenario_access (
  company_id uuid references public.companies(id) on delete cascade not null,
  scenario_id uuid references public.scenarios(id) on delete cascade not null,
  granted_via scenario_grant_type default 'purchase'::scenario_grant_type not null,
  granted_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (company_id, scenario_id)
);

-- 6. Crear tabla de transacciones de compra en el Marketplace
create table public.marketplace_purchases (
  id uuid default gen_random_uuid() primary key,
  listing_id uuid references public.marketplace_listings(id) on delete cascade not null,
  company_id uuid references public.companies(id) on delete cascade not null,
  stripe_payment_intent_id text not null,
  amount_cents integer not null,
  platform_fee_cents integer not null,
  creator_payout_cents integer not null,
  purchased_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. Habilitar RLS (Row Level Security)
alter table public.marketplace_listings enable row level security;
alter table public.company_scenario_access enable row level security;
alter table public.marketplace_purchases enable row level security;

-- POLÍTICAS PARA MARKETPLACE LISTINGS
create policy "Anyone authenticated can view active listings"
  on public.marketplace_listings for select
  using (auth.role() = 'authenticated' and is_active = true);

create policy "Creators can view and modify their own listings"
  on public.marketplace_listings for all
  using (creator_id = auth.uid());

create policy "Super admins can perform all actions on listings"
  on public.marketplace_listings for all
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'super_admin'
    )
  );

-- POLÍTICAS PARA COMPANY SCENARIO ACCESS
create policy "Super admins can do all on company scenario access"
  on public.company_scenario_access for all
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'super_admin'
    )
  );

create policy "Company members can view their own granted scenarios"
  on public.company_scenario_access for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.company_id = public.company_scenario_access.company_id
    )
  );

-- POLÍTICAS PARA MARKETPLACE PURCHASES
create policy "Super admins can do all on purchases"
  on public.marketplace_purchases for all
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'super_admin'
    )
  );

create policy "Company admins can view their own purchases"
  on public.marketplace_purchases for select
  using (
    exists (
      select 1 from public.profiles admin_profile
      where admin_profile.id = auth.uid()
      and admin_profile.role = 'company_admin'
      and admin_profile.company_id = public.marketplace_purchases.company_id
    )
  );

create policy "Creators can view purchases of their listings"
  on public.marketplace_purchases for select
  using (
    exists (
      select 1 from public.marketplace_listings listing
      where listing.id = public.marketplace_purchases.listing_id
      and listing.creator_id = auth.uid()
    )
  );

-- Actualizar política de escenarios para que creadores manejen sus propios escenarios
create policy "Creators can manage their own scenarios"
  on public.scenarios for all
  using (created_by = auth.uid());
