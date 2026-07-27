import { createClient } from '@/lib/supabase/server';
import { updateUserRoleAction } from './actions';

export default async function UsersManagementPage() {
  const supabase = await createClient();

  // 1. Cargar perfiles de usuario
  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  // 2. Cargar lista de empresas para el selector
  const { data: companies } = await supabase
    .from('companies')
    .select('id, name');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-white">Usuarios del Sistema</h1>
        <p className="text-sm text-slate-400">Administra los roles globales y la asignación a empresas.</p>
      </div>

      <div className="overflow-hidden border border-slate-800 bg-slate-900 rounded-xl shadow-lg">
        <table className="min-w-full divide-y divide-slate-800 text-left text-sm text-slate-300">
          <thead className="bg-slate-950 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <tr>
              <th className="px-6 py-4">Usuario</th>
              <th className="px-6 py-4">Correo</th>
              <th className="px-6 py-4">Rol Global</th>
              <th className="px-6 py-4">Empresa Asignada</th>
              <th className="px-6 py-4">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {profiles && profiles.length > 0 ? (
              profiles.map((profile) => (
                <tr key={profile.id} className="hover:bg-slate-850 transition">
                  <td className="px-6 py-4 font-semibold text-white">
                    {profile.full_name || 'Sin nombre'}
                  </td>
                  <td className="px-6 py-4">{profile.email}</td>
                  
                  {/* Formulario de actualización en línea */}
                  <td colSpan={3} className="px-6 py-4">
                    <form action={updateUserRoleAction} className="flex items-center gap-4">
                      <input type="hidden" name="userId" value={profile.id} />
                      
                      <select
                        name="role"
                        defaultValue={profile.role}
                        className="rounded-lg border border-slate-700 bg-slate-800 px-2 py-1 text-white text-xs"
                      >
                        <option value="super_admin">Super Admin</option>
                        <option value="company_admin">Company Admin</option>
                        <option value="technician">Technician</option>
                      </select>

                      <select
                        name="companyId"
                        defaultValue={profile.company_id || 'none'}
                        className="rounded-lg border border-slate-700 bg-slate-800 px-2 py-1 text-white text-xs max-w-xs"
                      >
                        <option value="none">Sin Empresa</option>
                        {companies && companies.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>

                      <button
                        type="submit"
                        className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-[10px] px-3 py-1 rounded transition"
                      >
                        Actualizar
                      </button>
                    </form>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                  No hay perfiles registrados en el sistema.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
