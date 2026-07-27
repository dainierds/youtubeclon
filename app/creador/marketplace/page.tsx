import { createClient } from '@/lib/supabase/server';
import { publishToMarketplaceAction, toggleListingStatusAction } from './actions';

export default async function CreatorMarketplacePage() {
  const supabase = await createClient();

  // 1. Obtener datos del creador autenticado
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_connect_onboarded')
    .eq('id', user?.id)
    .single();

  const isConnectActive = profile?.stripe_connect_onboarded || false;

  // 2. Traer todos sus escenarios publicados internamente (is_published = true)
  const { data: scenarios } = await supabase
    .from('scenarios')
    .select('id, title, type')
    .eq('created_by', user?.id || '')
    .eq('is_published', true);

  // 3. Traer listados actuales en el Marketplace
  const { data: listings } = await supabase
    .from('marketplace_listings')
    .select(`
      id,
      price_cents,
      is_active,
      scenario:scenarios (
        title,
        type
      )
    `)
    .eq('creator_id', user?.id || '');

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-white">Marketplace de Escenarios</h1>
        <p className="text-sm text-slate-400">Publica tus simuladores de cableado al catálogo global para empresas asociadas.</p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Formulario de Publicación */}
        <div className="lg:col-span-1 bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-lg h-fit space-y-4">
          <h3 className="text-base font-bold text-white border-b border-slate-800 pb-2">Publicar Escenario</h3>
          
          {!isConnectActive ? (
            <div className="rounded-lg border border-yellow-800/40 bg-yellow-950/20 p-4 text-xs text-yellow-300">
              Debes configurar tu cuenta de pagos de Stripe Connect Express en el Dashboard principal antes de poder listar escenarios en el marketplace.
            </div>
          ) : scenarios && scenarios.length > 0 ? (
            <form action={publishToMarketplaceAction} className="space-y-4">
              <div>
                <label htmlFor="scenarioId" className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Seleccionar Escenario
                </label>
                <select
                  id="scenarioId"
                  name="scenarioId"
                  required
                  className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white text-sm"
                >
                  {scenarios.map((s) => (
                    <option key={s.id} value={s.id}>{s.title} ({s.type})</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="priceDollars" className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Precio (USD)
                </label>
                <div className="relative mt-1 rounded-md shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <span className="text-slate-500 text-sm">$</span>
                  </div>
                  <input
                    type="number"
                    name="priceDollars"
                    id="priceDollars"
                    required
                    min="1.00"
                    step="0.01"
                    className="block w-full rounded-lg border border-slate-700 bg-slate-800 pl-7 pr-3 py-2 text-white text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs py-2.5 rounded-lg transition"
              >
                Publicar en Marketplace
              </button>
            </form>
          ) : (
            <div className="text-center py-8 text-xs text-slate-500 font-medium">
              No tienes escenarios publicados en tu catálogo. Créalos primero en la pestaña "Escenarios".
            </div>
          )}
        </div>

        {/* Listado en Venta */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-base font-bold text-white">Tus Ofertas Activas</h3>

          <div className="overflow-hidden border border-slate-800 bg-slate-900 rounded-xl shadow-lg">
            <table className="min-w-full divide-y divide-slate-800 text-left text-sm text-slate-300">
              <thead className="bg-slate-950 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-6 py-4">Escenario</th>
                  <th className="px-6 py-4">Tipo</th>
                  <th className="px-6 py-4">Precio</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {listings && listings.length > 0 ? (
                  listings.map((list: any) => (
                    <tr key={list.id} className="hover:bg-slate-850 transition">
                      <td className="px-6 py-4 font-semibold text-white">
                        {list.scenario?.title}
                      </td>
                      <td className="px-6 py-4 capitalize">{list.scenario?.type}</td>
                      <td className="px-6 py-4 font-mono font-bold text-emerald-400">
                        ${(list.price_cents / 100).toFixed(2)} USD
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                          list.is_active 
                            ? 'bg-green-950/50 border-green-800 text-green-300' 
                            : 'bg-red-950/50 border-red-800 text-red-300'
                        }`}>
                          {list.is_active ? 'Activo' : 'Pausado'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <form action={toggleListingStatusAction}>
                          <input type="hidden" name="listingId" value={list.id} />
                          <input type="hidden" name="currentStatus" value={list.is_active.toString()} />
                          <button
                            type="submit"
                            className={`text-xs font-semibold hover:underline ${
                              list.is_active ? 'text-red-400' : 'text-green-400'
                            }`}
                          >
                            {list.is_active ? 'Pausar' : 'Activar'}
                          </button>
                        </form>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                      No tienes ofertas cargadas en el marketplace.
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
