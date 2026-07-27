import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import SimulatorSessionWrapper from '@/components/simulator/SimulatorSessionWrapper';

export default async function PracticeSessionPage({
  params,
}: {
  params: Promise<{ scenarioId: string }>;
}) {
  const { scenarioId } = await params;
  const supabase = await createClient();

  // 1. Obtener usuario autenticado
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id || '';

  // 2. Traer escenario de Supabase
  const { data: scenario } = await supabase
    .from('scenarios')
    .select('*')
    .eq('id', scenarioId)
    .single();

  if (!scenario) {
    notFound();
  }

  return (
    <SimulatorSessionWrapper
      userId={userId}
      scenario={scenario}
    />
  );
}
