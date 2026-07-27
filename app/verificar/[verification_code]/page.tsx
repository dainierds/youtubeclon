import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';

export default async function PublicVerificationPage({
  params,
}: {
  params: Promise<{ verification_code: string }>;
}) {
  const { verification_code } = await params;
  
  // Usar cliente administrador para saltar restricciones RLS en consulta pública segura
  const supabase = createAdminClient();

  // 1. Obtener certificado por código
  const { data: certification } = await supabase
    .from('certifications')
    .select(`
      issued_at,
      level,
      user:profiles (
        full_name,
        email
      )
    `)
    .eq('verification_code', verification_code)
    .single();

  if (!certification) {
    notFound();
  }

  const profile = certification.user as any;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center space-y-8 shadow-2xl relative overflow-hidden">
        
        {/* Adorno holográfico simple */}
        <div className="absolute -top-12 -left-12 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Insignia Credencial */}
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-emerald-950/45 border-2 border-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/10">
            <svg className="w-10 h-10 text-emerald-450" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          </div>
        </div>

        {/* Textos */}
        <div className="space-y-4">
          <span className="text-[10px] tracking-widest text-emerald-450 uppercase font-mono font-bold">
            Certificación Verificada
          </span>
          <h1 className="text-3xl font-extrabold text-white">
            Credencial Oficial AccessTech
          </h1>
          <div className="max-w-md mx-auto border-t border-b border-slate-800 py-6 my-4 space-y-4 text-left">
            <div>
              <span className="block text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Técnico Acreditado</span>
              <span className="text-base font-bold text-white">{profile?.full_name || 'Nombre no disponible'}</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="block text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Nivel Certificación</span>
                <span className="text-sm font-bold text-blue-400">Nivel {certification.level}</span>
              </div>
              <div>
                <span className="block text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Fecha de Emisión</span>
                <span className="text-sm font-bold text-slate-350">{new Date(certification.issued_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Pie */}
        <div className="pt-2">
          <span className="block text-[10px] text-slate-650 font-mono">ID de Verificación: {verification_code}</span>
        </div>

      </div>
    </div>
  );
}
