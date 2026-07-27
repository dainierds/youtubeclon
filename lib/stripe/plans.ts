// /lib/stripe/plans.ts

export type PlanId =
  | 'individual_free'
  | 'individual_pro'
  | 'company_starter'
  | 'company_business'
  | 'company_enterprise';

export interface PlanConfig {
  id: PlanId;
  label: string;
  target: 'individual' | 'company';
  priceId: string | null; // null = no cobra por Stripe (free / enterprise a medida)
  priceMonthlyUsd: number | null;
  seatsLimit: number | null; // null = ilimitado o no aplica (individual)
  features: string[];
}

export const PLANS: Record<PlanId, PlanConfig> = {
  individual_free: {
    id: 'individual_free',
    label: 'Free',
    target: 'individual',
    priceId: null,
    priceMonthlyUsd: 0,
    seatsLimit: null,
    features: ['sandbox_unlimited'],
  },
  individual_pro: {
    id: 'individual_pro',
    label: 'Pro',
    target: 'individual',
    priceId: 'price_1Q_placeholder_pro_price_id', // reemplazar con el Price ID real de Stripe
    priceMonthlyUsd: 24,
    seatsLimit: null,
    features: ['sandbox_unlimited', 'guided_scenarios', 'certification_eligible'],
  },
  company_starter: {
    id: 'company_starter',
    label: 'Starter',
    target: 'company',
    priceId: 'price_1Q_placeholder_starter_price_id',
    priceMonthlyUsd: 129,
    seatsLimit: 5,
    features: ['guided_scenarios', 'diagnostic_scenarios', 'risk_report_basic'],
  },
  company_business: {
    id: 'company_business',
    label: 'Business',
    target: 'company',
    priceId: 'price_1Q_placeholder_business_price_id',
    priceMonthlyUsd: 399,
    seatsLimit: 20,
    features: ['guided_scenarios', 'diagnostic_scenarios', 'risk_report_full', 'priority_support'],
  },
  company_enterprise: {
    id: 'company_enterprise',
    label: 'Enterprise',
    target: 'company',
    priceId: null, // no self-service, se cierra manualmente y se asigna desde /admin/empresas
    priceMonthlyUsd: null,
    seatsLimit: null,
    features: ['guided_scenarios', 'diagnostic_scenarios', 'risk_report_full', 'sso', 'dedicated_support'],
  },
};

// Precio de certificación (pago único, no suscripción)
export const CERTIFICATION_PRICING = {
  firstAttemptUsd: 49,
  retakeUsd: 29,
  retakeCooldownHours: 24,
};

// Comisión del marketplace (aplicado como application_fee en Stripe Connect)
export const MARKETPLACE_COMMISSION_PERCENT = 22;

export function getPlanByPriceId(priceId: string): PlanConfig | undefined {
  return Object.values(PLANS).find((plan) => plan.priceId === priceId);
}
