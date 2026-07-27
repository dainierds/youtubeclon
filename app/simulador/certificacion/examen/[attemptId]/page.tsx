import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import CertificationExamWrapper from '@/components/simulator/CertificationExamWrapper';

export default async function CertificationExamPage({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const { attemptId } = await params;
  const supabase = await createClient();

  // 1. Obtener datos del intento de examen
  const { data: attempt } = await supabase
    .from('certification_attempts')
    .select(`
      *,
      level:certification_levels (
        id,
        title,
        time_limit_minutes,
        passing_score_percent
      )
    `)
    .eq('id', attemptId)
    .single();

  if (!attempt) {
    notFound();
  }

  // Validar de forma explícita que la sesión esté pagada y activa
  if (attempt.payment_status !== 'paid' || attempt.submitted_at !== null) {
    redirect('/simulador/certificacion');
  }

  const levelInfo = attempt.level as any;

  // 2. Obtener escenarios vinculados a este nivel ordenados
  const { data: levelScenarios } = await supabase
    .from('certification_level_scenarios')
    .select(`
      order_index,
      scenario:scenarios (
        id,
        title,
        description,
        type,
        difficulty_level,
        hardware_config,
        correct_wiring
      )
    `)
    .eq('certification_level_id', attempt.certification_level_id)
    .order('order_index', { ascending: true });

  const scenarios = levelScenarios?.map((ls) => ls.scenario).filter(Boolean) || [];

  if (scenarios.length === 0) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-white text-center">
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-xl max-w-sm">
          <h2 className="text-lg font-bold text-red-500 mb-2">Error de Configuración</h2>
          <p className="text-xs text-slate-400">Este nivel no tiene escenarios asociados para la evaluación.</p>
        </div>
      </div>
    );
  }

  return (
    <CertificationExamWrapper
      attemptId={attemptId}
      level={levelInfo}
      scenarios={scenarios}
    />
  );
}
