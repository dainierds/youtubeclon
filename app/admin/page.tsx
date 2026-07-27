import { createClient } from '@/lib/supabase/server';

export default async function AdminOverview() {
  const supabase = await createClient();

  // 1. Obtener métricas directo de la base de datos
  const { count: companiesCount } = await supabase
    .from('companies')
    .select('*', { count: 'exact', head: true });

  const { count: techniciansCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'technician');

  // Obtener intentos de los últimos 30 días
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const { count: attemptsCount } = await supabase
    .from('attempts')
    .select('*', { count: 'exact', head: true })
    .gte('completed_at', thirtyDaysAgo.toISOString());

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-white">Resumen del Sistema</h1>
        <p className="text-sm text-slate-400">Métricas clave consolidadas de la plataforma.</p>
      </div>

      {/* Grid de Tarjetas de Métricas */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Empresas Activas</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-white">{companiesCount || 0}</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Técnicos Registrados</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-white">{techniciansCount || 0}</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Intentos (Últimos 30 días)</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-white">{attemptsCount || 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
