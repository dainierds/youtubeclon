import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { stripe } from '@/lib/stripe/server';
import { getPlanByPriceId } from '@/lib/stripe/plans';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature') || '';

  let event;

  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  const supabase = createAdminClient();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any;
        const customerId = session.customer;
        const metadata = session.metadata || {};

        // 1. Manejar compras del Marketplace
        if (metadata.type === 'marketplace_purchase') {
          const listingId = metadata.listingId;
          const companyId = metadata.companyId;
          const scenarioId = metadata.scenarioId;
          const amountCents = parseInt(metadata.amountCents, 10);
          const platformFeeCents = parseInt(metadata.platformFeeCents, 10);
          const creatorPayoutCents = parseInt(metadata.creatorPayoutCents, 10);
          const paymentIntentId = session.payment_intent as string;

          // Guardar registro de compra
          await supabase
            .from('marketplace_purchases')
            .insert({
              listing_id: listingId,
              company_id: companyId,
              stripe_payment_intent_id: paymentIntentId,
              amount_cents: amountCents,
              platform_fee_cents: platformFeeCents,
              creator_payout_cents: creatorPayoutCents,
            });

          // Otorgar acceso de escenario a la empresa
          await supabase
            .from('company_scenario_access')
            .insert({
              company_id: companyId,
              scenario_id: scenarioId,
              granted_via: 'purchase',
            });
            
          break;
        }

        // 2. Manejar compras de exámenes de Certificación
        if (metadata.type === 'certification_attempt') {
          const userId = metadata.userId;
          const levelId = metadata.levelId;
          const attemptNumber = parseInt(metadata.attemptNumber, 10);
          const paymentIntentId = session.payment_intent as string;

          // Crear el intento de examen en estado pagado
          await supabase
            .from('certification_attempts')
            .insert({
              user_id: userId,
              certification_level_id: levelId,
              started_at: new Date().toISOString(),
              attempt_number: attemptNumber,
              payment_status: 'paid',
              stripe_payment_intent_id: paymentIntentId,
            });
          
          break;
        }

        // 3. Manejar suscripciones recurrentes (antiguo flujo)
        const subscriptionId = session.subscription;
        const isCompany = metadata.isCompany === 'true';

        // Obtener estado de la suscripción de Stripe
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const status = subscription.status;
        const priceId = subscription.items.data[0].price.id;
        const planInfo = getPlanByPriceId(priceId);

        if (isCompany && metadata.companyId) {
          await supabase
            .from('companies')
            .update({
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
              subscription_status: status as any,
              plan: (planInfo?.id || 'trial') as any,
              seats_limit: planInfo?.seatsLimit || 5,
            })
            .eq('id', metadata.companyId);
        } else if (metadata.userId) {
          await supabase
            .from('profiles')
            .update({
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
              subscription_status: status as any,
            })
            .eq('id', metadata.userId);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as any;
        const subscriptionId = subscription.id;
        const customerId = subscription.customer;
        const status = subscription.status;
        const priceId = subscription.items.data[0].price.id;
        const planInfo = getPlanByPriceId(priceId);

        // Buscar si esta suscripción pertenece a una empresa
        const { data: company } = await supabase
          .from('companies')
          .select('id')
          .eq('stripe_subscription_id', subscriptionId)
          .single();

        if (company) {
          await supabase
            .from('companies')
            .update({
              subscription_status: status as any,
              plan: (planInfo?.id || 'trial') as any,
              seats_limit: planInfo?.seatsLimit || 5,
            })
            .eq('id', company.id);
        } else {
          // Buscar si pertenece a un técnico individual
          const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('stripe_subscription_id', subscriptionId)
            .single();

          if (profile) {
            await supabase
              .from('profiles')
              .update({
                subscription_status: status as any,
              })
              .eq('id', profile.id);
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any;
        const subscriptionId = subscription.id;

        // Buscar si pertenece a una empresa
        const { data: company } = await supabase
          .from('companies')
          .select('id')
          .eq('stripe_subscription_id', subscriptionId)
          .single();

        if (company) {
          await supabase
            .from('companies')
            .update({
              subscription_status: 'canceled',
              plan: 'trial',
              seats_limit: 5, // Vuelve al mínimo del plan free/trial
            })
            .eq('id', company.id);
        } else {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('stripe_subscription_id', subscriptionId)
            .single();

          if (profile) {
            await supabase
              .from('profiles')
              .update({
                subscription_status: 'canceled',
              })
              .eq('id', profile.id);
          }
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error('Webhook event handling failed:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
