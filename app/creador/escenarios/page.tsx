import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export default async function CreatorScenariosPage() {
  const supabase = await createClient();

  // 1. Obtener usuario autenticado
  const { data: { user } } = await supabase.auth.getUser();

  // 2. Obtener escenarios creados por este creador
  const { data: scenarios } = await supabase
    .from('scenarios')
    .select('*')
    .eq('created_by', user?.id || '')
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Mis Escenarios Diseñados</h1>
          <p className="text-sm text-slate-400">Diseña, edita y gestiona las prácticas lógicas de cableado creadas por ti.</p>
        </div>
        <Link
          href="/admin/escenarios/nuevo" // Reutiliza el mismo editor de escenarios
          className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm px-4 py-2.5 rounded-lg shadow-lg"
        >
          Crear Escenario
        </Link>
      </div>

      <div className="overflow-hidden border border-slate-800 bg-slate-900 rounded-xl shadow-lg">
        <table className="min-w-full divide-y divide-slate-800 text-left text-sm text-slate-300">
          <thead className="bg-slate-950 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <tr>
              <th className="px-6 py-4">Título</th>
              <th className="px-6 py-4">Tipo</th>
              <th className="px-6 py-4">Dificultad</th>
              <th className="px-6 py-4">Estado</th>
              <th className="px-6 py-4">Fecha de Creación</th>
              <th className="px-6 py-4">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {scenarios && scenarios.length > 0 ? (
              scenarios.map((scenario) => (
                <tr key={scenario.id} className="hover:bg-slate-850 transition">
                  <td className="px-6 py-4 font-semibold text-white">{scenario.title}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700 capitalize">
                      {scenario.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs">Nivel {scenario.difficulty_level}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                      scenario.is_published 
                        ? 'bg-green-950/50 border-green-800 text-green-300' 
                        : 'bg-yellow-950/50 border-yellow-800 text-yellow-300'
                    }`}>
                      {scenario.is_published ? 'Publicado' : 'Borrador'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {new Date(scenario.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 flex gap-3">
                    <Link
                      href={`/admin/escenarios/${scenario.id}/editar`} // Reutiliza el editor existente
                      className="text-blue-400 hover:text-blue-300 font-semibold"
                    >
                      Editar
                    </Link>
                    <span className="text-slate-700">|</span>
                    <Link
                      href={`/simulador/${scenario.id}`}
                      target="_blank"
                      className="text-emerald-400 hover:text-emerald-300 font-semibold"
                    >
                      Probar
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                  Aún no has diseñado ningún escenario. ¡Crea tu primer prototipo!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
