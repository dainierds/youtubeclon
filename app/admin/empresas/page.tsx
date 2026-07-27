import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export default async function CompaniesList() {
  const supabase = await createClient();

  // Obtener todas las empresas
  const { data: companies } = await supabase
    .from('companies')
    .select('*')
    .order('created_at', { ascending: false });

  // Obtener conteo de usuarios por empresa para calcular asientos ocupados
  const { data: profiles } = await supabase
    .from('profiles')
    .select('company_id');

  const getSeatsUsed = (companyId: string) => {
    if (!profiles) return 0;
    return profiles.filter((p) => p.company_id === companyId).length;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Empresas</h1>
          <p className="text-sm text-slate-400">Gestiona las cuentas de clientes corporativos y sus límites.</p>
        </div>
        <Link
          href="/admin/empresas/nueva"
          className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm px-4 py-2.5 rounded-lg shadow-lg hover:shadow-blue-500/20 transition"
        >
          Nueva Empresa
        </Link>
      </div>

      <div className="overflow-hidden border border-slate-800 bg-slate-900 rounded-xl shadow-lg">
        <table className="min-w-full divide-y divide-slate-800 text-left text-sm text-slate-300">
          <thead className="bg-slate-950 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <tr>
              <th className="px-6 py-4">Nombre</th>
              <th className="px-6 py-4">Plan</th>
              <th className="px-6 py-4">Asientos Ocupados</th>
              <th className="px-6 py-4">Fecha de Creación</th>
              <th className="px-6 py-4">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {companies && companies.length > 0 ? (
              companies.map((company) => (
                <tr key={company.id} className="hover:bg-slate-850 transition">
                  <td className="px-6 py-4 font-semibold text-white">{company.name}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700 capitalize">
                      {company.plan}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {getSeatsUsed(company.id)} / {company.seats_limit}
                  </td>
                  <td className="px-6 py-4">
                    {new Date(company.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/admin/empresas/${company.id}`}
                      className="text-blue-400 hover:text-blue-300 font-semibold"
                    >
                      Administrar
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                  No hay empresas registradas en el sistema.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
