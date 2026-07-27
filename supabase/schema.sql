-- Habilitar UUID
create extension if not exists "uuid-ossp";

-- 1. ENUMS
create type user_role as enum ('super_admin', 'company_admin', 'technician');
create type company_plan as enum ('trial', 'starter', 'business');
create type technician_status as enum ('invited', 'active', 'suspended');
create type scenario_type as enum ('sandbox', 'guided', 'diagnostic');

-- 2. TABLAS

-- Tabla de Empresas
create table public.companies (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  plan company_plan default 'trial'::company_plan not null,
  seats_limit integer default 5 not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tabla de Perfiles de Usuario (Extiende auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text,
  role user_role default 'technician'::user_role not null,
  company_id uuid references public.companies(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tabla de relación entre empresas y técnicos
create table public.company_technicians (
  company_id uuid references public.companies(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  status technician_status default 'invited'::technician_status not null,
  invited_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (company_id, user_id)
);

-- Tabla de Escenarios
create table public.scenarios (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  type scenario_type default 'guided'::scenario_type not null,
  difficulty_level integer default 1 not null,
  hardware_config jsonb not null,
  correct_wiring jsonb not null,
  fault_injection jsonb,
  created_by uuid references public.profiles(id) on delete set null,
  is_published boolean default false not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tabla de Intentos / Prácticas
create table public.attempts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  scenario_id uuid references public.scenarios(id) on delete cascade not null,
  wiring_state jsonb not null,
  is_correct boolean default false not null,
  errors jsonb not null default '[]'::jsonb,
  time_spent_seconds integer not null,
  completed_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tabla de Certificaciones
create table public.certifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  level integer default 1 not null,
  issued_at timestamp with time zone default timezone('utc'::text, now()) not null,
  verification_code text unique not null
);

-- 3. SEGURIDAD & RLS (Row Level Security)

alter table public.companies enable row level security;
alter table public.profiles enable row level security;
alter table public.company_technicians enable row level security;
alter table public.scenarios enable row level security;
alter table public.attempts enable row level security;
alter table public.certifications enable row level security;

-- POLÍTICAS PARA COMPANIES
create policy "Super admins can perform all actions on companies"
  on public.companies for all
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'super_admin'
    )
  );

create policy "Users can view their own company"
  on public.companies for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.company_id = companies.id
    )
  );

-- POLÍTICAS PARA PROFILES
create policy "Super admins can perform all actions on profiles"
  on public.profiles for all
  using (
    exists (
      select 1 from public.profiles admin_profile
      where admin_profile.id = auth.uid()
      and admin_profile.role = 'super_admin'
    )
  );

create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Company admins can view profiles of their technicians"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles admin_profile
      where admin_profile.id = auth.uid()
      and admin_profile.role = 'company_admin'
      and admin_profile.company_id = public.profiles.company_id
    )
  );

-- POLÍTICAS PARA COMPANY TECHNICIANS
create policy "Super admins can do all on company technicians"
  on public.company_technicians for all
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'super_admin'
    )
  );

create policy "Company admins can view and modify their company technicians"
  on public.company_technicians for all
  using (
    exists (
      select 1 from public.profiles admin_profile
      where admin_profile.id = auth.uid()
      and admin_profile.role = 'company_admin'
      and admin_profile.company_id = public.company_technicians.company_id
    )
  );

create policy "Technicians can view their own relationship status"
  on public.company_technicians for select
  using (auth.uid() = user_id);

-- POLÍTICAS PARA SCENARIOS
create policy "Anyone can read published scenarios"
  on public.scenarios for select
  using (is_published = true);

create policy "Super admins can do all on scenarios"
  on public.scenarios for all
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'super_admin'
    )
  );

-- POLÍTICAS PARA ATTEMPTS
create policy "Super admins can do all on attempts"
  on public.attempts for all
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'super_admin'
    )
  );

create policy "Technicians can see and insert their own attempts"
  on public.attempts for all
  using (auth.uid() = user_id);

create policy "Company admins can view attempts of their technicians"
  on public.attempts for select
  using (
    exists (
      select 1 from public.profiles admin_profile
      where admin_profile.id = auth.uid()
      and admin_profile.role = 'company_admin'
      and admin_profile.company_id = (
        select company_id from public.profiles where profiles.id = public.attempts.user_id
      )
    )
  );

-- POLÍTICAS PARA CERTIFICATIONS
create policy "Super admins can do all on certifications"
  on public.certifications for all
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'super_admin'
    )
  );

create policy "Technicians can view their own certifications"
  on public.certifications for select
  using (auth.uid() = user_id);

create policy "Company admins can view certifications of their technicians"
  on public.certifications for select
  using (
    exists (
      select 1 from public.profiles admin_profile
      where admin_profile.id = auth.uid()
      and admin_profile.role = 'company_admin'
      and admin_profile.company_id = (
        select company_id from public.profiles where profiles.id = public.certifications.user_id
      )
    )
  );

-- 4. TRIGGERS AUTOMÁTICOS
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, role, full_name)
  values (
    new.id,
    new.email,
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'technician'::user_role),
    new.raw_user_meta_data->>'full_name'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
