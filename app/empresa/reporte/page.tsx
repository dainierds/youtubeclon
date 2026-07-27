import { createClient } from '@/lib/supabase/server';

export default async function TeamRiskReportPage() {
  const supabase = await createClient();

  // 1. Obtener datos del admin autenticado y su empresa
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user?.id)
    .single();

  const companyId = profile?.company_id || '';

  // 2. Obtener técnicos de la empresa
  const { data: technicians } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .eq('company_id', companyId)
    .eq('role', 'technician');

  // 3. Obtener certificaciones de los técnicos
  const techIds = technicians?.map((t) => t.id) || [];
  const { data: certifications } = await supabase
    .from('certifications')
    .select('user_id, level')
    .in('user_id', techIds);

  // 4. Obtener todos los intentos de los técnicos
  const { data: attempts } = await supabase
    .from('attempts')
    .select('user_id, is_correct')
    .in('user_id', techIds);

  const getCertificationLevel = (userId: string) => {
    if (!certifications) return 'Sin certificar';
    const cert = certifications.find((c) => c.user_id === userId);
    return cert ? `Nivel ${cert.level}` : 'Sin certificar';
  };

  const getRiskStatus = (userId: string) => {
    if (!attempts) return { text: 'Sin Intentos', colorClass: 'bg-slate-900 border-slate-800 text-slate-400' };

    const userAttempts = attempts.filter((a) => a.user_id === userId);
    if (userAttempts.length === 0) {
      return { text: 'Sin Intentos', colorClass: 'bg-slate-900 border-slate-800 text-slate-400' };
    }

    const correctCount = userAttempts.filter((a) => a.is_correct).length;
    const successRate = (correctCount / userAttempts.length) * 100;

    if (successRate > 80) {
      return { text: `${successRate.toFixed(0)}% (Bajo)`, colorClass: 'bg-green-950/40 border-green-800 text-green-300' };
    } else if (successRate >= 50) {
      return { text: `${successRate.toFixed(0)}% (Medio)`, colorClass: 'bg-yellow-950/40 border-yellow-800 text-yellow-300' };
    } else {
      return { text: `${successRate.toFixed(0)}% (Alto)`, colorClass: 'bg-red-950/40 border-red-800 text-red-300' };
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-white">Reporte de Riesgo del Equipo</h1>
        <p className="text-sm text-slate-400">Analiza el nivel de preparación técnica y la tasa de acierto de tus operarios.</p>
      </div>

      <div className="overflow-hidden border border-slate-800 bg-slate-900 rounded-xl shadow-lg">
        <table className="min-w-full divide-y divide-slate-800 text-left text-sm text-slate-300">
          <thead className="bg-slate-950 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <tr>
              <th className="px-6 py-4">Técnico</th>
              <th className="px-6 py-4">Correo</th>
              <th className="px-6 py-4">Certificación</th>
              <th className="px-6 py-4">Tasa de Aciertos (Riesgo)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {technicians && technicians.length > 0 ? (
              technicians.map((tech) => {
                const risk = getRiskStatus(tech.id);
                return (
                  <tr key={tech.id} className="hover:bg-slate-850 transition">
                    <td className="px-6 py-4 font-semibold text-white">
                      {tech.full_name || 'Sin Nombre'}
                    </td>
                    <td className="px-6 py-4">{tech.email}</td>
                    <td className="px-6 py-4">{getCertificationLevel(tech.id)}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${risk.colorClass}`}>
                        {risk.text}
                      </span>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                  No hay técnicos registrados para evaluar el riesgo.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
