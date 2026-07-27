import { createClient } from '@/lib/supabase/server';
import SubscriptionManagerCard from '@/components/simulator/SubscriptionManagerCard';

export default async function EmpresaOverview() {
  const supabase = await createClient();

  // 1. Obtener datos del admin autenticado
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user?.id)
    .single();

  const companyId = profile?.company_id;

  // 2. Traer info de la empresa
  const { data: company } = await supabase
    .from('companies')
    .select('*')
    .eq('id', companyId || '')
    .single();

  // 3. Conteo de técnicos activos
  const { count: techniciansCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('company_id', companyId || '')
    .eq('role', 'technician');

  // 4. Promedio de intentos completados por técnico en los últimos 30 días
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Obtener todos los IDs de los técnicos de la empresa
  const { data: companyTechs } = await supabase
    .from('profiles')
    .select('id')
    .eq('company_id', companyId || '')
    .eq('role', 'technician');

  const techIds = companyTechs?.map((t) => t.id) || [];

  let averageAttempts = 0;
  if (techIds.length > 0) {
    const { count: attemptsCount } = await supabase
      .from('attempts')
      .select('*', { count: 'exact', head: true })
      .in('user_id', techIds)
      .gte('completed_at', thirtyDaysAgo.toISOString());

    averageAttempts = parseFloat(((attemptsCount || 0) / techIds.length).toFixed(1));
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-white">Dashboard Corporativo</h1>
        <p className="text-sm text-slate-400">Resumen y estado de control de acceso de {company?.name || 'la empresa'}.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Técnicos Activos</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-white">{techniciansCount || 0}</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Asientos Utilizados</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-white">{techniciansCount || 0}</span>
            <span className="text-sm text-slate-500">/ {company?.seats_limit || 0} máximo</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Intentos / Técnico (30d)</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-white">{averageAttempts}</span>
          </div>
        </div>
      </div>

      <SubscriptionManagerCard
        plan={company?.plan || 'trial'}
        status={company?.subscription_status || 'trialing'}
        isCompany={true}
        hasSubscription={!!company?.stripe_subscription_id}
      />
    </div>
  );
}
