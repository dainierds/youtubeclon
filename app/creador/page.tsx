import { createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe/server';
import ConnectOnboardingButton from '@/components/simulator/ConnectOnboardingButton';

export default async function CreatorDashboardOverview() {
  const supabase = await createClient();

  // 1. Obtener datos del creador autenticado
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_connect_account_id, stripe_connect_onboarded')
    .eq('id', user?.id)
    .single();

  let onboarded = profile?.stripe_connect_onboarded || false;

  // 2. Verificar en Stripe si la cuenta Connect ya completó el onboarding
  if (profile?.stripe_connect_account_id && !onboarded) {
    try {
      const account = await stripe.accounts.retrieve(profile.stripe_connect_account_id);
      if (account.details_submitted) {
        onboarded = true;
        // Guardar estado en base de datos
        await supabase
          .from('profiles')
          .update({ stripe_connect_onboarded: true })
          .eq('id', user?.id || '');
      }
    } catch (err) {
      console.error('Error retrieving Stripe account:', err);
    }
  }

  // 3. Obtener conteo de sus escenarios y ventas
  const { count: scenariosCount } = await supabase
    .from('scenarios')
    .select('*', { count: 'exact', head: true })
    .eq('created_by', user?.id || '');

  const { data: listings } = await supabase
    .from('marketplace_listings')
    .select('id')
    .eq('creator_id', user?.id || '');

  const listingIds = listings?.map((l) => l.id) || [];

  let totalSales = 0;
  let totalEarningsCents = 0;

  if (listingIds.length > 0) {
    const { data: purchases } = await supabase
      .from('marketplace_purchases')
      .select('amount_cents, creator_payout_cents')
      .in('listing_id', listingIds);

    if (purchases) {
      totalSales = purchases.length;
      totalEarningsCents = purchases.reduce((acc, curr) => acc + curr.creator_payout_cents, 0);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-white">Dashboard del Creador</h1>
        <p className="text-sm text-slate-400">Administra tus diseños de hardware PACS y tus cobros en el Marketplace.</p>
      </div>

      {!onboarded ? (
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2 max-w-xl">
            <h3 className="text-lg font-bold text-white">Configura tu cuenta de pagos de Stripe</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Para poder vender tus escenarios de cableado en el marketplace global de AccessTech, necesitas completar el formulario de onboarding de Stripe Connect.
            </p>
          </div>
          <ConnectOnboardingButton />
        </div>
      ) : (
        <div className="rounded-xl border border-green-800/40 bg-green-950/20 p-4 text-xs text-green-300 flex items-center gap-3">
          <span className="h-2 w-2 rounded-full bg-green-400 animate-ping"></span>
          <span>Tu cuenta de cobros Stripe Connect está activa y configurada correctamente. ¡Ya puedes publicar escenarios al marketplace!</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Escenarios Propios</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-white">{scenariosCount || 0}</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Ventas en el Marketplace</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-white">{totalSales}</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Ingresos Totales (Tus Pagos)</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-white">
              ${(totalEarningsCents / 100).toFixed(2)}
            </span>
            <span className="text-xs text-slate-500 font-mono">USD</span>
          </div>
        </div>
      </div>
    </div>
  );
}
