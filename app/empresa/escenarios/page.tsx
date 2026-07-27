import { createClient } from '@/lib/supabase/server';
import { assignScenarioAction } from './actions';

export default async function ScenariosAssignmentPage() {
  const supabase = await createClient();

  // 1. Obtener datos del admin autenticado
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user?.id)
    .single();

  const companyId = profile?.company_id || '';

  // 2. Cargar escenarios globales/públicos
  const { data: globalScenarios } = await supabase
    .from('scenarios')
    .select('*')
    .eq('is_published', true);

  // Cargar accesos a escenarios comprados por esta empresa
  const { data: purchasedAccess } = await supabase
    .from('company_scenario_access')
    .select('scenario:scenarios(*)')
    .eq('company_id', companyId);

  const purchasedScenarios = purchasedAccess?.map((pa: any) => pa.scenario).filter(Boolean) || [];

  // Consolidar catálogo final eliminando duplicados si existieran
  const allScenariosMap = new Map();
  globalScenarios?.forEach((s) => allScenariosMap.set(s.id, s));
  purchasedScenarios.forEach((s) => allScenariosMap.set(s.id, s));
  const scenarios = Array.from(allScenariosMap.values());

  // 3. Cargar técnicos de la empresa
  const { data: technicians } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .eq('company_id', companyId)
    .eq('role', 'technician');

  // 4. Cargar asignaciones activas para visualización
  const { data: assignments } = await supabase
    .from('scenario_assignments')
    .select(`
      id,
      assigned_at,
      due_date,
      scenario:scenarios (
        title
      ),
      technician:profiles (
        full_name,
        email
      )
    `)
    .order('assigned_at', { ascending: false });

  // Filtrar asignaciones que pertenezcan a los técnicos de esta empresa
  const techIds = technicians?.map((t) => t.id) || [];
  const filteredAssignments = assignments?.filter((a: any) => 
    a.technician && techIds.includes(a.technician.id)
  ) || [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-white">Escenarios</h1>
        <p className="text-sm text-slate-400">Asigna escenarios de cableado y prácticas a tu equipo técnico.</p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Panel Asignación */}
        <div className="lg:col-span-1 bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-lg h-fit space-y-4">
          <h3 className="text-base font-bold text-white border-b border-slate-800 pb-2">Asignar Tarea</h3>
          
          {scenarios && scenarios.length > 0 && technicians && technicians.length > 0 ? (
            <form action={assignScenarioAction} className="space-y-4">
              <div>
                <label htmlFor="scenarioId" className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Seleccionar Escenario
                </label>
                <select
                  id="scenarioId"
                  name="scenarioId"
                  required
                  className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  {scenarios.map((s) => (
                    <option key={s.id} value={s.id}>{s.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Seleccionar Técnicos
                </label>
                <div className="space-y-2 max-h-40 overflow-y-auto border border-slate-800 p-3 rounded-lg bg-slate-950">
                  {technicians.map((t) => (
                    <label key={t.id} className="flex items-center gap-2 text-sm text-slate-300 hover:text-white cursor-pointer">
                      <input
                        type="checkbox"
                        name="technicianIds"
                        value={t.id}
                        className="rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-950"
                      />
                      <span>{t.full_name || t.email}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="dueDate" className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Fecha Límite (Opcional)
                </label>
                <input
                  id="dueDate"
                  name="dueDate"
                  type="date"
                  className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs py-2.5 rounded-lg transition"
              >
                Asignar Tarea
              </button>
            </form>
          ) : (
            <div className="text-center py-6 text-xs text-slate-500 font-medium">
              {!scenarios || scenarios.length === 0 
                ? 'No hay escenarios publicados en la plataforma.' 
                : 'Debes registrar al menos un técnico para asignar tareas.'}
            </div>
          )}
        </div>

        {/* Listado de Asignaciones */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-base font-bold text-white">Tareas Asignadas</h3>

          <div className="overflow-hidden border border-slate-800 bg-slate-900 rounded-xl shadow-lg">
            <table className="min-w-full divide-y divide-slate-800 text-left text-sm text-slate-300">
              <thead className="bg-slate-950 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-6 py-4">Técnico</th>
                  <th className="px-6 py-4">Escenario</th>
                  <th className="px-6 py-4">Asignado el</th>
                  <th className="px-6 py-4">Límite</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredAssignments.length > 0 ? (
                  filteredAssignments.map((assignment: any) => (
                    <tr key={assignment.id} className="hover:bg-slate-850 transition">
                      <td className="px-6 py-4 font-semibold text-white">
                        {assignment.technician?.full_name || assignment.technician?.email}
                      </td>
                      <td className="px-6 py-4">{assignment.scenario?.title}</td>
                      <td className="px-6 py-4 text-xs text-slate-400">
                        {new Date(assignment.assigned_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-455">
                        {assignment.due_date ? new Date(assignment.due_date).toLocaleDateString() : 'Sin límite'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                      No hay tareas asignadas actualmente.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
