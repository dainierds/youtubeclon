import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function PublicMarketplaceCatalogPage() {
  const supabase = await createClient();

  // 1. Cargar listados de Marketplace activos
  const { data: listings } = await supabase
    .from('marketplace_listings')
    .select(`
      id,
      price_cents,
      scenario:scenarios (
        id,
        title,
        description,
        type,
        difficulty_level
      ),
      creator:profiles (
        full_name
      )
    `)
    .eq('is_active', true);

  // 2. Obtener datos de la empresa vinculada al admin actual para verificar compras previas
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user?.id)
    .single();

  const companyId = profile?.company_id || '';

  // 3. Traer accesos de escenarios aprobados para esta empresa
  const { data: purchasedAccess } = await supabase
    .from('company_scenario_access')
    .select('scenario_id')
    .eq('company_id', companyId);

  const purchasedScenarioIds = purchasedAccess?.map((a) => a.scenario_id) || [];

  return (
    <div className="min-h-screen bg-slate-950 p-8 text-white flex flex-col items-center">
      <div className="w-full max-w-5xl space-y-8">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-6">
          <div>
            <Link href="/empresa" className="text-xs text-slate-400 hover:text-white transition">
              &larr; Volver al Dashboard
            </Link>
            <h1 className="text-3xl font-extrabold text-blue-400 mt-1">Marketplace de Escenarios</h1>
            <p className="text-sm text-slate-400">Adquiere escenarios avanzados diseñados por fabricantes e instructores líderes.</p>
          </div>
        </div>

        {/* Listado Catálogo */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {listings && listings.length > 0 ? (
            listings.map((list: any) => {
              const s = list.scenario;
              if (!s) return null;
              const alreadyPurchased = purchasedScenarioIds.includes(s.id);

              return (
                <div key={list.id} className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl flex flex-col justify-between space-y-4 hover:border-slate-700 transition">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-mono uppercase tracking-wider font-semibold border bg-slate-850 border-slate-700 text-slate-300 px-2 py-0.5 rounded">
                        {s.type}
                      </span>
                      <span className="text-sm font-mono font-bold text-emerald-400">
                        ${(list.price_cents / 100).toFixed(2)} USD
                      </span>
                    </div>
                    
                    <h4 className="text-lg font-bold text-white">{s.title}</h4>
                    <p className="text-xs text-slate-400 line-clamp-2">{s.description || 'Sin descripción disponible.'}</p>
                    
                    <div className="pt-2 text-[10px] text-slate-500 font-medium">
                      Creador: <span className="text-slate-350">{list.creator?.full_name || 'Instructor Certificado'}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t border-slate-800/60">
                    <span className="text-xs text-slate-500">
                      Nivel de Dificultad: {s.difficulty_level}
                    </span>
                    
                    {alreadyPurchased ? (
                      <span className="text-xs font-semibold bg-emerald-950/40 border border-emerald-800 text-emerald-300 px-4 py-2 rounded-lg">
                        Adquirido
                      </span>
                    ) : (
                      <form action={async () => {
                        'use server';
                        // Llamada al route handler de Checkout Marketplace
                        const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/api/stripe/checkout/marketplace`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ listingId: list.id, companyId }),
                        });
                        const data = await res.json();
                        if (data.url) {
                          // Redirigir a checkout en el lado del servidor
                          redirect(data.url);
                        }
                      }}>
                        <button
                          type="submit"
                          className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs px-4 py-2.5 rounded-lg transition"
                        >
                          Comprar Escenario
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-2 bg-slate-900 border border-slate-850 p-8 rounded-xl text-center text-sm text-slate-500 font-medium">
              No hay escenarios listados en el marketplace actualmente.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
