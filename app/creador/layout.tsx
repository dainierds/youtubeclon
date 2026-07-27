import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function CreatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  
  // Verificación estricta de seguridad server-side
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'creator') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white p-6">
        <div className="text-center p-8 border border-red-900 bg-red-950/20 rounded-2xl shadow-xl max-w-md">
          <h1 className="text-2xl font-bold text-red-500 mb-2">Acceso Denegado</h1>
          <p className="text-sm text-slate-400">Esta sección es exclusiva para Creadores autorizados.</p>
          <Link href="/login" className="mt-4 inline-block bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg text-sm transition">
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      {/* Barra lateral de navegación */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col">
        <div className="p-6 border-b border-slate-800">
          <h2 className="text-lg font-bold text-white tracking-wider">AccessTech</h2>
          <span className="text-[10px] text-emerald-400 uppercase tracking-widest font-mono">Creador / Fabricante</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          <Link 
            href="/creador" 
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-800 transition"
          >
            Dashboard
          </Link>
          <Link 
            href="/creador/escenarios" 
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-800 transition"
          >
            Escenarios
          </Link>
          <Link 
            href="/creador/marketplace" 
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-800 transition"
          >
            Publicar Marketplace
          </Link>
          <Link 
            href="/creador/ventas" 
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-800 transition"
          >
            Mis Ventas
          </Link>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <form action={async () => {
            'use server';
            const client = await createClient();
            await client.auth.signOut();
            redirect('/login');
          }}>
            <button className="w-full bg-slate-850 hover:bg-red-950/30 hover:text-red-400 border border-slate-800 text-xs font-semibold py-2 rounded-lg transition">
              Cerrar Sesión
            </button>
          </form>
        </div>
      </aside>

      {/* Área de contenido principal */}
      <main className="flex-1 overflow-y-auto p-8">
        {children}
      </main>
    </div>
  );
}
