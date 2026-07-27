import Link from 'next/link';
import SubscriptionManagerCard from '@/components/simulator/SubscriptionManagerCard';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function TechnicianOverviewPage() {
  const supabase = await createClient();

  // 1. Obtener datos del técnico autenticado
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id || '';

  // 2. Traer asignaciones de escenarios para el técnico actual
  const { data: assignments } = await supabase
    .from('scenario_assignments')
    .select(`
      id,
      assigned_at,
      due_date,
      scenario:scenarios (
        id,
        title,
        description,
        type,
        difficulty_level
      )
    `)
    .eq('technician_id', userId);

  // 3. Traer intentos del técnico para verificar si ya los completó
  const { data: attempts } = await supabase
    .from('attempts')
    .select('scenario_id, is_correct')
    .eq('user_id', userId);

  // 4. Traer certificaciones aprobadas del usuario para mostrar su nivel máximo
  const { data: certifications } = await supabase
    .from('certifications')
    .select('level')
    .eq('user_id', userId)
    .order('level', { ascending: false });

  const maxLevel = certifications && certifications.length > 0 ? certifications[0].level : 0;

  const getScenarioStatus = (scenarioId: string) => {
    if (!attempts) return 'Pendiente';
    const attemptsForScenario = attempts.filter((a) => a.scenario_id === scenarioId);
    if (attemptsForScenario.length === 0) return 'Pendiente';
    const hasSuccess = attemptsForScenario.some((a) => a.is_correct);
    return hasSuccess ? 'Completado' : 'Intentado (Con Fallos)';
  };

  // 5. Traer datos de suscripción del técnico
  const { data: dbProfile } = await supabase
    .from('profiles')
    .select('stripe_subscription_id, subscription_status')
    .eq('id', userId)
    .single();

  return (
    <div className="min-h-screen bg-slate-950 p-8 text-white flex flex-col items-center">
      <div className="w-full max-w-5xl space-y-8">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-extrabold text-emerald-400">Portal del Técnico</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                maxLevel > 0 
                  ? 'bg-blue-950/60 border-blue-800 text-blue-300' 
                  : 'bg-slate-900 border-slate-850 text-slate-500'
              }`}>
                {maxLevel > 0 ? `Certificado Lvl ${maxLevel}` : 'Sin certificar'}
              </span>
            </div>
            <p className="text-sm text-slate-400 mt-1">Prácticas y asignaciones de control de acceso PACS.</p>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/simulador/certificacion"
              className="bg-blue-650 hover:bg-blue-600 text-white font-semibold text-xs px-4 py-2.5 rounded-lg transition animate-pulse"
            >
              Exámenes de Certificación
            </Link>
            <Link
              href="/simulador/sandbox"
              className="bg-slate-805 hover:bg-slate-700 text-white font-semibold text-xs px-4 py-2.5 rounded-lg border border-slate-700 transition"
            >
              Práctica Libre (Sandbox)
            </Link>
            <form action={async () => {
              'use server';
              const client = await createClient();
              await client.auth.signOut();
              redirect('/login');
            }}>
              <button
                type="submit"
                className="bg-slate-900 hover:bg-red-950/30 hover:text-red-400 text-slate-300 font-semibold text-xs px-4 py-2.5 rounded-lg border border-slate-800 transition"
              >
                Cerrar Sesión
              </button>
            </form>
          </div>
        </div>

        {/* Listado de Tareas Asignadas */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-white">Tareas Asignadas</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {assignments && assignments.length > 0 ? (
              assignments.map((assignment: any) => {
                const s = assignment.scenario;
                if (!s) return null;
                const status = getScenarioStatus(s.id);
                return (
                  <div key={assignment.id} className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl flex flex-col justify-between space-y-4 hover:border-slate-700 transition">
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider font-semibold border ${
                          s.type === 'diagnostic' 
                            ? 'bg-red-950/40 border-red-900 text-red-400' 
                            : s.type === 'guided' 
                            ? 'bg-blue-950/40 border-blue-900 text-blue-400' 
                            : 'bg-zinc-850 border-zinc-700 text-zinc-300'
                        }`}>
                          {s.type}
                        </span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          status === 'Completado' 
                            ? 'bg-green-950 text-green-300 border border-green-800' 
                            : status === 'Pendiente'
                            ? 'bg-slate-800 text-slate-400 border border-slate-700'
                            : 'bg-yellow-950 text-yellow-300 border border-yellow-800'
                        }`}>
                          {status}
                        </span>
                      </div>
                      
                      <h4 className="text-base font-bold text-white">{s.title}</h4>
                      <p className="text-xs text-slate-400 line-clamp-2">{s.description || 'Sin descripción disponible.'}</p>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-slate-800/60">
                      <span className="text-xs text-slate-500 font-medium">
                        Límite: {assignment.due_date ? new Date(assignment.due_date).toLocaleDateString() : 'Sin fecha límite'}
                      </span>
                      <Link
                        href={`/simulador/${s.id}`}
                        className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs px-4 py-2 rounded-lg transition"
                      >
                        Iniciar
                      </Link>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-2 bg-slate-900 border border-slate-850 p-8 rounded-xl text-center text-sm text-slate-500 font-medium">
                No tienes tareas asignadas actualmente. ¡Usa el Sandbox para practicar libremente!
              </div>
            )}
          </div>
        </div>

        <SubscriptionManagerCard
          plan={dbProfile?.stripe_subscription_id ? 'Pro' : 'Free Sandbox'}
          status={dbProfile?.subscription_status || 'trialing'}
          isCompany={false}
          hasSubscription={!!dbProfile?.stripe_subscription_id}
        />

      </div>
    </div>
  );
}
