import { createClient } from '@/lib/supabase/server';

export default async function CreatorSalesPage() {
  const supabase = await createClient();

  // 1. Obtener usuario autenticado
  const { data: { user } } = await supabase.auth.getUser();

  // 2. Cargar ofertas del creador para cruzar compras
  const { data: listings } = await supabase
    .from('marketplace_listings')
    .select('id, scenario:scenarios(title)')
    .eq('creator_id', user?.id || '');

  const listingMap = new Map(listings?.map((l: any) => [l.id, l.scenario?.title]) || []);
  const listingIds = listings?.map((l) => l.id) || [];

  // 3. Obtener compras de sus listados
  let purchases: any[] = [];
  if (listingIds.length > 0) {
    const { data: dbPurchases } = await supabase
      .from('marketplace_purchases')
      .select(`
        id,
        listing_id,
        amount_cents,
        creator_payout_cents,
        purchased_at,
        company:companies (
          name
        )
      `)
      .in('listing_id', listingIds)
      .order('purchased_at', { ascending: false });

    purchases = dbPurchases || [];
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-white">Historial de Ventas</h1>
        <p className="text-sm text-slate-400">Verifica las transacciones de compra de tus escenarios y el detalle de tus cobros.</p>
      </div>

      <div className="overflow-hidden border border-slate-800 bg-slate-900 rounded-xl shadow-lg">
        <table className="min-w-full divide-y divide-slate-800 text-left text-sm text-slate-300">
          <thead className="bg-slate-950 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <tr>
              <th className="px-6 py-4">Escenario</th>
              <th className="px-6 py-4">Cliente (Empresa)</th>
              <th className="px-6 py-4">Monto Total</th>
              <th className="px-6 py-4">Tu Comisión (Connect)</th>
              <th className="px-6 py-4">Fecha</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {purchases.length > 0 ? (
              purchases.map((purchase) => (
                <tr key={purchase.id} className="hover:bg-slate-850 transition">
                  <td className="px-6 py-4 font-semibold text-white">
                    {listingMap.get(purchase.listing_id) || 'Escenario Desconocido'}
                  </td>
                  <td className="px-6 py-4">{purchase.company?.name || 'Cliente sin nombre'}</td>
                  <td className="px-6 py-4 font-mono">${(purchase.amount_cents / 100).toFixed(2)} USD</td>
                  <td className="px-6 py-4 font-mono font-bold text-emerald-400">
                    ${(purchase.creator_payout_cents / 100).toFixed(2)} USD
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-400">
                    {new Date(purchase.purchased_at).toLocaleString()}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                  No has registrado ventas todavía.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
