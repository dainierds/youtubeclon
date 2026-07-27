import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { updateCompanyDetails } from './actions';

export default async function CompanyDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // 1. Cargar datos de la empresa
  const { data: company } = await supabase
    .from('companies')
    .select('*')
    .eq('id', id)
    .single();

  if (!company) {
    notFound();
  }

  // 2. Cargar técnicos asociados a la empresa
  const { data: relations } = await supabase
    .from('company_technicians')
    .select(`
      status,
      invited_at,
      user:profiles (
        id,
        full_name,
        email,
        role
      )
    `)
    .eq('company_id', id);

  return (
    <div className="space-y-8">
      <div>
        <Link href="/admin/empresas" className="text-sm text-slate-400 hover:text-white transition">
          &larr; Volver a Empresas
        </Link>
        <h1 className="text-3xl font-extrabold text-white mt-2">{company.name}</h1>
        <p className="text-sm text-slate-400">Detalles de suscripción y lista de técnicos activos.</p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Panel de administración del plan */}
        <div className="lg:col-span-1 bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-lg space-y-6">
          <h3 className="text-base font-bold text-white border-b border-slate-800 pb-2">Plan y Límites</h3>
          
          <form action={updateCompanyDetails} className="space-y-4">
            <input type="hidden" name="companyId" value={company.id} />
            
            <div>
              <label htmlFor="plan" className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Plan de Suscripción
              </label>
              <select
                id="plan"
                name="plan"
                defaultValue={company.plan}
                className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="trial">Trial</option>
                <option value="starter">Starter</option>
                <option value="business">Business</option>
              </select>
            </div>

            <div>
              <label htmlFor="seats_limit" className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Límite de Asientos (Técnicos)
              </label>
              <input
                id="seats_limit"
                name="seats_limit"
                type="number"
                defaultValue={company.seats_limit}
                className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs py-2.5 rounded-lg transition"
            >
              Guardar Cambios
            </button>
          </form>
        </div>

        {/* Tabla de técnicos de la empresa */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-base font-bold text-white">Técnicos Asignados</h3>
          
          <div className="overflow-hidden border border-slate-800 bg-slate-900 rounded-xl shadow-lg">
            <table className="min-w-full divide-y divide-slate-800 text-left text-sm text-slate-300">
              <thead className="bg-slate-950 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-6 py-4">Nombre</th>
                  <th className="px-6 py-4">Correo</th>
                  <th className="px-6 py-4">Rol</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4">Fecha de Invitación</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {relations && relations.length > 0 ? (
                  relations.map((relation: any) => (
                    <tr key={relation.user.id} className="hover:bg-slate-850 transition">
                      <td className="px-6 py-4 font-semibold text-white">{relation.user.full_name || 'Sin Nombre'}</td>
                      <td className="px-6 py-4">{relation.user.email}</td>
                      <td className="px-6 py-4">
                        <span className="capitalize text-xs font-mono">{relation.user.role}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize ${
                          relation.status === 'active' 
                            ? 'bg-green-950/50 border-green-800 text-green-300' 
                            : relation.status === 'suspended'
                            ? 'bg-red-950/50 border-red-800 text-red-300'
                            : 'bg-yellow-950/50 border-yellow-800 text-yellow-300'
                        }`}>
                          {relation.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {new Date(relation.invited_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                      No hay técnicos registrados para esta empresa.
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
