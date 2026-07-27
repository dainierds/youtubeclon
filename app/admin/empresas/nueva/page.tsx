import Link from 'next/link';
import { createCompanyAction } from '../actions';

export default function NewCompanyPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Link href="/admin/empresas" className="text-sm text-slate-400 hover:text-white transition">
          &larr; Volver a Empresas
        </Link>
        <h1 className="text-3xl font-extrabold text-white mt-2">Nueva Empresa</h1>
        <p className="text-sm text-slate-400">Registra una empresa cliente e inicializa su cuenta de administrador.</p>
      </div>

      <form action={createCompanyAction} className="space-y-6 bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-lg">
        {/* Datos de la empresa */}
        <div className="space-y-4">
          <h3 className="text-base font-bold text-white border-b border-slate-800 pb-2">1. Datos Corporativos</h3>
          
          <div>
            <label htmlFor="name" className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Nombre de la Empresa
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="Ej: Seguridad Alfa S.A."
            />
          </div>

          {/* Plan y asientos autogenerados por Stripe (Trial por defecto) */}
          <input type="hidden" name="plan" value="trial" />
          <input type="hidden" name="seats_limit" value="5" />
        </div>

        {/* Administrador */}
        <div className="space-y-4">
          <h3 className="text-base font-bold text-white border-b border-slate-800 pb-2">2. Administrador de la Empresa</h3>

          <div>
            <label htmlFor="adminFullName" className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Nombre Completo
            </label>
            <input
              id="adminFullName"
              name="adminFullName"
              type="text"
              required
              className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="Ej: Carlos Mendoza"
            />
          </div>

          <div>
            <label htmlFor="adminEmail" className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Correo Electrónico del Administrador
            </label>
            <input
              id="adminEmail"
              name="adminEmail"
              type="email"
              required
              className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="carlos@alfa.com"
            />
          </div>

          <div>
            <label htmlFor="adminPassword" className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Contraseña Temporal
            </label>
            <input
              id="adminPassword"
              name="adminPassword"
              type="password"
              required
              minLength={6}
              className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="••••••••"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Link
            href="/admin/empresas"
            className="px-4 py-2.5 text-xs font-medium text-slate-350 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs px-5 py-2.5 rounded-lg shadow-lg hover:shadow-blue-500/20 transition"
          >
            Crear Empresa y Administrador
          </button>
        </div>
      </form>
    </div>
  );
}
