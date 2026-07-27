-- 1. Crear tipo enum para estado de pago si no existe
create type payment_status_type as enum ('pending', 'paid', 'refunded');

-- 2. Modificar tabla certification_attempts
alter table public.certification_attempts add column payment_status payment_status_type default 'pending'::payment_status_type not null;
alter table public.certification_attempts add column stripe_payment_intent_id text;
