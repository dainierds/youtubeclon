import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe/server';
import { PLANS } from '@/lib/stripe/plans';

export async function POST(request: NextRequest) {
  try {
    const { priceId, isCompany } = await request.json();

    if (!priceId) {
      return NextResponse.json({ error: 'PriceId es requerido.' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
    }

    // 1. Obtener perfil para sacar información de la empresa o del usuario
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, company_id, stripe_customer_id')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Perfil no encontrado.' }, { status: 404 });
    }

    let customerId = profile.stripe_customer_id;

    // Si es para una empresa, obtener stripe_customer_id de la empresa
    let company = null;
    if (isCompany && profile.company_id) {
      const { data: comp } = await supabase
        .from('companies')
        .select('name, stripe_customer_id')
        .eq('id', profile.company_id)
        .single();
      company = comp;
      if (company?.stripe_customer_id) {
        customerId = company.stripe_customer_id;
      }
    }

    // 2. Si no hay customerId, crearlo en Stripe
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: profile.email,
        name: isCompany ? company?.name : undefined,
        metadata: {
          userId: user.id,
          companyId: isCompany ? profile.company_id || '' : '',
        },
      });
      customerId = customer.id;

      // Actualizar la tabla correspondiente con el customerId creado
      if (isCompany && profile.company_id) {
        await supabase
          .from('companies')
          .update({ stripe_customer_id: customerId })
          .eq('id', profile.company_id);
      } else {
        await supabase
          .from('profiles')
          .update({ stripe_customer_id: customerId })
          .eq('id', user.id);
      }
    }

    // 3. Crear sesión de Stripe Checkout
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
    const successUrl = isCompany ? `${baseUrl}/empresa` : `${baseUrl}/simulador`;
    const cancelUrl = isCompany ? `${baseUrl}/empresa` : `${baseUrl}/simulador`;

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId: user.id,
        companyId: isCompany ? profile.company_id || '' : '',
        isCompany: isCompany ? 'true' : 'false',
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error('Error in checkout session creation:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
