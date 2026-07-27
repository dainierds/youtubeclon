-- 1. Crear tabla de niveles de certificación
create table public.certification_levels (
  id uuid default gen_random_uuid() primary key,
  level_number integer unique not null,
  title text not null,
  description text,
  time_limit_minutes integer default 60 not null,
  passing_score_percent integer default 80 not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Crear tabla de escenarios por nivel (relación y orden)
create table public.certification_level_scenarios (
  certification_level_id uuid references public.certification_levels(id) on delete cascade not null,
  scenario_id uuid references public.scenarios(id) on delete cascade not null,
  order_index integer default 0 not null,
  primary key (certification_level_id, scenario_id)
);

-- 3. Crear tabla de intentos de examen
create table public.certification_attempts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  certification_level_id uuid references public.certification_levels(id) on delete cascade not null,
  started_at timestamp with time zone default timezone('utc'::text, now()) not null,
  submitted_at timestamp with time zone,
  score_percent integer,
  passed boolean,
  attempt_number integer default 1 not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Habilitar RLS (Row Level Security)
alter table public.certification_levels enable row level security;
alter table public.certification_level_scenarios enable row level security;
alter table public.certification_attempts enable row level security;

-- 5. Crear políticas RLS para niveles
create policy "Anyone authenticated can view certification levels"
  on public.certification_levels for select
  using (auth.role() = 'authenticated');

create policy "Super admins can perform all actions on certification levels"
  on public.certification_levels for all
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'super_admin'
    )
  );

-- 6. Crear políticas RLS para escenarios por nivel
create policy "Anyone authenticated can view certification level scenarios"
  on public.certification_level_scenarios for select
  using (auth.role() = 'authenticated');

create policy "Super admins can perform all actions on certification level scenarios"
  on public.certification_level_scenarios for all
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'super_admin'
    )
  );

-- 7. Crear políticas RLS para intentos de examen
create policy "Super admins can perform all actions on certification attempts"
  on public.certification_attempts for all
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'super_admin'
    )
  );

create policy "Technicians can read and write their own certification attempts"
  on public.certification_attempts for all
  using (auth.uid() = user_id);

create policy "Company admins can view certification attempts of their technicians"
  on public.certification_attempts for select
  using (
    exists (
      select 1 from public.profiles admin_profile
      where admin_profile.id = auth.uid()
      and admin_profile.role = 'company_admin'
      and admin_profile.company_id = (
        select company_id from public.profiles where profiles.id = public.certification_attempts.user_id
      )
    )
  );

-- 8. Política pública para certifications (para que el código de verificación funcione de forma pública)
drop policy if exists "Technicians can view their own certifications" on public.certifications;
create policy "Anyone can read certifications by verification code"
  on public.certifications for select
  using (true);
