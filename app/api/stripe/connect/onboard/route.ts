import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('email, full_name, stripe_connect_account_id')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Perfil no encontrado.' }, { status: 404 });
    }

    let connectAccountId = profile.stripe_connect_account_id;

    // 1. Si no tiene cuenta de Connect, crearla en modo Express
    if (!connectAccountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        email: profile.email,
        capabilities: {
          transfers: { requested: true },
        },
        business_type: 'individual',
        metadata: {
          userId: user.id,
        },
      });
      connectAccountId = account.id;

      await supabase
        .from('profiles')
        .update({ stripe_connect_account_id: connectAccountId })
        .eq('id', user.id);
    }

    // 2. Generar el Account Link de Stripe Onboarding
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
    
    const accountLink = await stripe.accountLinks.create({
      account: connectAccountId,
      refresh_url: `${baseUrl}/creador`,
      return_url: `${baseUrl}/creador`,
      type: 'account_onboarding',
    });

    return NextResponse.json({ url: accountLink.url });
  } catch (err: any) {
    console.error('Error creating Stripe Connect onboarding link:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
