import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe/server';

export async function POST(request: NextRequest) {
  try {
    const { isCompany } = await request.json();

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id, stripe_customer_id')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Perfil no encontrado.' }, { status: 404 });
    }

    let customerId = profile.stripe_customer_id;

    if (isCompany && profile.company_id) {
      const { data: company } = await supabase
        .from('companies')
        .select('stripe_customer_id')
        .eq('id', profile.company_id)
        .single();
      if (company?.stripe_customer_id) {
        customerId = company.stripe_customer_id;
      }
    }

    if (!customerId) {
      return NextResponse.json({ error: 'No tienes una suscripción activa.' }, { status: 400 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
    const returnUrl = isCompany ? `${baseUrl}/empresa` : `${baseUrl}/simulador`;

    // Crear sesión del Billing Portal de Stripe
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error('Error in portal session creation:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
