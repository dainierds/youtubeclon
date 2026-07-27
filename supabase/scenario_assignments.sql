-- 1. Crear tabla de asignaciones de escenarios
create table public.scenario_assignments (
  id uuid default gen_random_uuid() primary key,
  scenario_id uuid references public.scenarios(id) on delete cascade not null,
  technician_id uuid references public.profiles(id) on delete cascade not null,
  assigned_by uuid references public.profiles(id) on delete set null,
  assigned_at timestamp with time zone default timezone('utc'::text, now()) not null,
  due_date timestamp with time zone
);

-- 2. Habilitar RLS (Row Level Security)
alter table public.scenario_assignments enable row level security;

-- 3. Crear políticas RLS para asignaciones
create policy "Super admins can perform all actions on assignments"
  on public.scenario_assignments for all
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'super_admin'
    )
  );

create policy "Company admins can view and modify assignments for their company technicians"
  on public.scenario_assignments for all
  using (
    exists (
      select 1 from public.profiles admin_profile
      where admin_profile.id = auth.uid()
      and admin_profile.role = 'company_admin'
      and admin_profile.company_id = (
        select company_id from public.profiles where profiles.id = public.scenario_assignments.technician_id
      )
    )
  );

create policy "Technicians can read their own assignments"
  on public.scenario_assignments for select
  using (auth.uid() = technician_id);
