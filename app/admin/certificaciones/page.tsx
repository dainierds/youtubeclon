import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export default async function AdminCertificationsPage() {
  const supabase = await createClient();

  // 1. Obtener niveles de certificación
  const { data: levels } = await supabase
    .from('certification_levels')
    .select('*')
    .order('level_number', { ascending: true });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Niveles de Certificación</h1>
          <p className="text-sm text-slate-400">Configura los exámenes, tiempos límites y asignación de escenarios por nivel.</p>
        </div>
        <Link
          href="/admin/certificaciones/nuevo"
          className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm px-4 py-2.5 rounded-lg shadow-lg hover:shadow-blue-500/20 transition"
        >
          Crear Nivel
        </Link>
      </div>

      <div className="overflow-hidden border border-slate-800 bg-slate-900 rounded-xl shadow-lg">
        <table className="min-w-full divide-y divide-slate-800 text-left text-sm text-slate-300">
          <thead className="bg-slate-950 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <tr>
              <th className="px-6 py-4">Nivel</th>
              <th className="px-6 py-4">Título</th>
              <th className="px-6 py-4">Límite de Tiempo</th>
              <th className="px-6 py-4">Aprobación (%)</th>
              <th className="px-6 py-4">Fecha de Creación</th>
              <th className="px-6 py-4">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {levels && levels.length > 0 ? (
              levels.map((lvl) => (
                <tr key={lvl.id} className="hover:bg-slate-850 transition">
                  <td className="px-6 py-4 font-mono font-bold text-blue-400 text-xs">Nivel {lvl.level_number}</td>
                  <td className="px-6 py-4 font-semibold text-white">{lvl.title}</td>
                  <td className="px-6 py-4">{lvl.time_limit_minutes} minutos</td>
                  <td className="px-6 py-4">{lvl.passing_score_percent}%</td>
                  <td className="px-6 py-4">
                    {new Date(lvl.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/admin/certificaciones/${lvl.id}/editar`}
                      className="text-blue-400 hover:text-blue-300 font-semibold"
                    >
                      Editar
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                  No hay niveles de certificación registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
