import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe/server';

export async function POST(request: NextRequest) {
  try {
    const { listingId, companyId } = await request.json();

    if (!listingId || !companyId) {
      return NextResponse.json({ error: 'ListingId y CompanyId son requeridos.' }, { status: 400 });
    }

    const supabase = await createClient();

    // 1. Cargar datos de la oferta del marketplace
    const { data: listing } = await supabase
      .from('marketplace_listings')
      .select(`
        price_cents,
        scenario_id,
        creator:profiles (
          stripe_connect_account_id
        )
      `)
      .eq('id', listingId)
      .single();

    if (!listing) {
      return NextResponse.json({ error: 'Oferta no encontrada.' }, { status: 404 });
    }

    const creatorInfo = listing.creator as any;
    const connectAccountId = creatorInfo?.stripe_connect_account_id;

    if (!connectAccountId) {
      return NextResponse.json({ error: 'El creador no tiene configurada una cuenta de pagos.' }, { status: 400 });
    }

    // 2. Obtener stripe_customer_id de la empresa compradora
    const { data: company } = await supabase
      .from('companies')
      .select('stripe_customer_id, name')
      .eq('id', companyId)
      .single();

    if (!company) {
      return NextResponse.json({ error: 'Empresa no encontrada.' }, { status: 404 });
    }

    // Calcular comisiones de plataforma (20% de comisión)
    const platformFeeCents = Math.round(listing.price_cents * 0.2);

    // 3. Crear sesión de Stripe Checkout en modo 'payment' (compra única con Stripe Connect)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
    const successUrl = `${baseUrl}/marketplace`;
    const cancelUrl = `${baseUrl}/marketplace`;

    const session = await stripe.checkout.sessions.create({
      customer: company.stripe_customer_id || undefined,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Escenario PACS: Compra de Licencia`,
            },
            unit_amount: listing.price_cents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      payment_intent_data: {
        application_fee_amount: platformFeeCents,
        transfer_data: {
          destination: connectAccountId,
        },
      },
      metadata: {
        type: 'marketplace_purchase',
        listingId,
        companyId,
        scenarioId: listing.scenario_id,
        amountCents: listing.price_cents.toString(),
        platformFeeCents: platformFeeCents.toString(),
        creatorPayoutCents: (listing.price_cents - platformFeeCents).toString(),
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error('Error creating marketplace checkout session:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
