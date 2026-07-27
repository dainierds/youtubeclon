-- 1. Crear enum para estado de suscripción de Stripe
create type subscription_status_type as enum ('active', 'past_due', 'canceled', 'trialing');

-- 2. Modificar tabla companies
alter table public.companies add column stripe_customer_id text;
alter table public.companies add column stripe_subscription_id text;
alter table public.companies add column subscription_status subscription_status_type;

-- 3. Modificar tabla profiles
alter table public.profiles add column stripe_customer_id text;
alter table public.profiles add column stripe_subscription_id text;
alter table public.profiles add column subscription_status subscription_status_type;
