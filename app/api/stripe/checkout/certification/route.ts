import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe/server';
import { CERTIFICATION_PRICING } from '@/lib/stripe/plans';

export async function POST(request: NextRequest) {
  try {
    const { levelId } = await request.json();

    if (!levelId) {
      return NextResponse.json({ error: 'LevelId es requerido.' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
    }

    // 1. Obtener perfil e intentos anteriores para validar cooldown y reintentos
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, stripe_customer_id')
      .eq('id', user.id)
      .single();

    const { data: lastAttempts } = await supabase
      .from('certification_attempts')
      .select('submitted_at, passed, attempt_number')
      .eq('user_id', user.id)
      .eq('certification_level_id', levelId)
      .order('created_at', { ascending: false });

    // Validar cooldown de 24 horas si el último intento fue fallido
    if (lastAttempts && lastAttempts.length > 0) {
      const last = lastAttempts[0];
      if (last.submitted_at && !last.passed) {
        const hoursSinceLast = (Date.now() - new Date(last.submitted_at).getTime()) / (1000 * 60 * 60);
        if (hoursSinceLast < CERTIFICATION_PRICING.retakeCooldownHours) {
          const remaining = Math.ceil(CERTIFICATION_PRICING.retakeCooldownHours - hoursSinceLast);
          return NextResponse.json({
            error: `Debes esperar 24 horas antes de volver a intentar este examen. Tiempo restante: ${remaining} horas.`
          }, { status: 400 });
        }
      }
    }

    // Calcular el precio correcto (Primer intento vs Reintento)
    const attemptsCount = lastAttempts?.length || 0;
    const isRetake = attemptsCount > 0;
    const amountUsd = isRetake ? CERTIFICATION_PRICING.retakeUsd : CERTIFICATION_PRICING.firstAttemptUsd;
    const amountCents = amountUsd * 100;

    let customerId = profile?.stripe_customer_id;

    // Crear cliente en Stripe si no tiene uno
    if (!customerId && profile) {
      const customer = await stripe.customers.create({
        email: profile.email,
        metadata: { userId: user.id },
      });
      customerId = customer.id;
      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id);
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';

    // 2. Crear sesión de Checkout en modo 'payment' (Cobro único)
    const session = await stripe.checkout.sessions.create({
      customer: customerId || undefined,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Examen de Certificación - ${isRetake ? 'Reintento' : 'Primer Intento'}`,
              description: `Puntaje mínimo de aprobación: 80%. Cooldown de 24 horas si no se aprueba.`,
            },
            unit_amount: amountCents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${baseUrl}/simulador/certificacion`,
      cancel_url: `${baseUrl}/simulador/certificacion`,
      metadata: {
        type: 'certification_attempt',
        userId: user.id,
        levelId,
        attemptNumber: (attemptsCount + 1).toString(),
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error('Error creating certification checkout session:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
