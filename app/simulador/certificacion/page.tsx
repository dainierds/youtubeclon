import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function CertificationOverviewPage() {
  const supabase = await createClient();

  // 1. Obtener usuario autenticado
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id || '';

  // 2. Obtener niveles de certificación configurados
  const { data: levels } = await supabase
    .from('certification_levels')
    .select(`
      *,
      scenarios:certification_level_scenarios (
        scenario_id
      )
    `)
    .order('level_number', { ascending: true });

  // 3. Obtener certificaciones aprobadas del usuario
  const { data: approvedCertifications } = await supabase
    .from('certifications')
    .select('*')
    .eq('user_id', userId);

  // 4. Obtener intentos previos del usuario
  const { data: attempts } = await supabase
    .from('certification_attempts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  const getLevelStatus = (levelNum: number, levelId: string) => {
    const isApproved = approvedCertifications?.some((c) => c.level === levelNum);
    if (isApproved) {
      const cert = approvedCertifications?.find((c) => c.level === levelNum);
      return { status: 'Aprobado', color: 'text-green-400', code: cert?.verification_code };
    }

    const levelAttempts = attempts?.filter((a) => a.certification_level_id === levelId);
    if (levelAttempts && levelAttempts.length > 0) {
      const last = levelAttempts[0];
      if (last.submitted_at && !last.passed) {
        return { status: 'Reintentar (Fallo)', color: 'text-red-400' };
      }
    }
    return { status: 'Pendiente', color: 'text-slate-400' };
  };

  const isLevelUnlocked = (levelNum: number) => {
    if (levelNum === 1) return true;
    // Requiere que el nivel anterior esté aprobado
    const prevLevelNum = levelNum - 1;
    return approvedCertifications?.some((c) => c.level === prevLevelNum) || false;
  };



  return (
    <div className="min-h-screen bg-slate-950 p-8 text-white flex flex-col items-center">
      <div className="w-full max-w-5xl space-y-8">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-6">
          <div>
            <Link href="/simulador" className="text-xs text-slate-400 hover:text-white transition">
              &larr; Volver al Panel
            </Link>
            <h1 className="text-3xl font-extrabold text-emerald-450 mt-1">Certificaciones PACS</h1>
            <p className="text-sm text-slate-400">Demuestra tus habilidades técnicas y obtén insignias de certificación oficiales.</p>
          </div>
        </div>

        {/* Listado de Niveles */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-white">Niveles de Certificación</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {levels && levels.length > 0 ? (
              levels.map((lvl) => {
                const unlocked = isLevelUnlocked(lvl.level_number);
                const info = getLevelStatus(lvl.level_number, lvl.id);
                const attemptsCount = attempts?.filter((a) => a.certification_level_id === lvl.id).length || 0;

                return (
                  <div key={lvl.id} className={`bg-slate-900 border rounded-xl p-6 shadow-xl flex flex-col justify-between space-y-4 transition ${
                    unlocked ? 'border-slate-800 hover:border-slate-700' : 'border-slate-950 opacity-40 select-none'
                  }`}>
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <span className="text-xs font-mono font-bold text-blue-400 uppercase tracking-wider">
                          Nivel {lvl.level_number}
                        </span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border border-slate-700 ${info.color}`}>
                          {info.status}
                        </span>
                      </div>
                      
                      <h4 className="text-lg font-bold text-white">{lvl.title}</h4>
                      <p className="text-xs text-slate-400">{lvl.description || 'Evaluación de habilidades lógicas.'}</p>
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t border-slate-800/60">
                      <div className="space-y-1">
                        <span className="block text-[10px] text-slate-500 font-medium">
                          Duración: {lvl.time_limit_minutes} min | Puntaje de corte: {lvl.passing_score_percent}%
                        </span>
                        <span className="block text-[10px] text-slate-500 font-medium">
                          Pasos de examen: {lvl.scenarios?.length || 0} tareas | Intentos: {attemptsCount}
                        </span>
                      </div>

                      {unlocked && (
                        <div>
                          {info.status === 'Aprobado' ? (
                            <Link
                              href={`/verificar/${info.code}`}
                              target="_blank"
                              className="bg-emerald-650 hover:bg-emerald-600 text-white font-semibold text-xs px-4 py-2 rounded-lg transition"
                            >
                              Ver Credencial
                            </Link>
                          ) : (() => {
                            // Buscar si hay examen en curso pagado
                            const activeAttempt = attempts?.find((a) => a.certification_level_id === lvl.id && a.payment_status === 'paid' && a.submitted_at === null);
                            const price = attemptsCount > 0 ? 29 : 49;

                            if (activeAttempt) {
                              return (
                                <Link
                                  href={`/simulador/certificacion/examen/${activeAttempt.id}`}
                                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-4 py-2 rounded-lg transition"
                                >
                                  Continuar Examen
                                </Link>
                              );
                            }

                            return (
                              <form action={async () => {
                                'use server';
                                const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/api/stripe/checkout/certification`, {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ levelId: lvl.id }),
                                });
                                const data = await res.json();
                                if (data.url) {
                                  redirect(data.url);
                                } else if (data.error) {
                                  // Como es una acción de servidor que corre en Next, podemos lanzar error o manejar alerta
                                  throw new Error(data.error);
                                }
                              }}>
                                <button
                                  type="submit"
                                  className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs px-4 py-2 rounded-lg transition"
                                >
                                  Pagar y Comenzar (${price} USD)
                                </button>
                              </form>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-2 bg-slate-900 border border-slate-850 p-8 rounded-xl text-center text-sm text-slate-500 font-medium">
                No hay exámenes de certificación cargados en el sistema por el Administrador.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
