import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function TechnicianDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // 1. Validar que el técnico pertenece a la misma empresa que el administrador conectado
  const { data: { user: adminUser } } = await supabase.auth.getUser();
  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', adminUser?.id)
    .single();

  const { data: technician } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .eq('company_id', adminProfile?.company_id || '')
    .eq('role', 'technician')
    .single();

  if (!technician) {
    notFound();
  }

  // 2. Traer historial de intentos (attempts) del técnico
  const { data: attempts } = await supabase
    .from('attempts')
    .select(`
      id,
      is_correct,
      time_spent_seconds,
      completed_at,
      scenario:scenarios (
        title
      )
    `)
    .eq('user_id', id)
    .order('completed_at', { ascending: false });

  // 3. Traer nivel máximo de certificación del técnico
  const { data: certifications } = await supabase
    .from('certifications')
    .select('level')
    .eq('user_id', id)
    .order('level', { ascending: false });

  const maxLevel = certifications && certifications.length > 0 ? certifications[0].level : 0;

  return (
    <div className="space-y-8">
      <div>
        <Link href="/empresa/tecnicos" className="text-sm text-slate-400 hover:text-white transition">
          &larr; Volver a Técnicos
        </Link>
        <div className="flex items-center gap-3 mt-2">
          <h1 className="text-3xl font-extrabold text-white">{technician.full_name || 'Técnico'}</h1>
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
            maxLevel > 0 
              ? 'bg-blue-950/60 border-blue-800 text-blue-300' 
              : 'bg-slate-900 border-slate-850 text-slate-500'
          }`}>
            {maxLevel > 0 ? `Certificado Lvl ${maxLevel}` : 'Sin certificar'}
          </span>
        </div>
        <p className="text-sm text-slate-400 mt-1">Historial de prácticas e intentos de simulación.</p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Historial de Intentos */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-base font-bold text-white">Historial de Escenarios</h3>
          
          <div className="overflow-hidden border border-slate-800 bg-slate-900 rounded-xl shadow-lg">
            <table className="min-w-full divide-y divide-slate-800 text-left text-sm text-slate-300">
              <thead className="bg-slate-950 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-6 py-4">Escenario</th>
                  <th className="px-6 py-4">Resultado</th>
                  <th className="px-6 py-4">Tiempo Tomado</th>
                  <th className="px-6 py-4">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {attempts && attempts.length > 0 ? (
                  attempts.map((attempt: any) => (
                    <tr key={attempt.id} className="hover:bg-slate-850 transition">
                      <td className="px-6 py-4 font-semibold text-white">
                        {attempt.scenario?.title || 'Escenario sin título'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                          attempt.is_correct 
                            ? 'bg-green-950/50 border-green-800 text-green-300' 
                            : 'bg-red-950/50 border-red-800 text-red-300'
                        }`}>
                          {attempt.is_correct ? 'Correcto' : 'Error'}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs">
                        {Math.floor(attempt.time_spent_seconds / 60)}m {attempt.time_spent_seconds % 60}s
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-400">
                        {new Date(attempt.completed_at).toLocaleString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                      Este técnico aún no ha completado ningún escenario.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Panel de áreas de error frecuente */}
        <div className="lg:col-span-1 bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-lg h-fit space-y-4">
          <h3 className="text-base font-bold text-white border-b border-slate-800 pb-2">Áreas de Error Frecuente</h3>
          <p className="text-xs text-slate-400">
            Análisis algorítmico de componentes con fallas recurrentes.
          </p>
          <div className="bg-slate-950 border border-slate-850 p-4 rounded-lg text-center text-xs text-slate-500 font-medium">
            Disponible cuando el técnico complete más escenarios.
          </div>
        </div>
      </div>
    </div>
  );
}
