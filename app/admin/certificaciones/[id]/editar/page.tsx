import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import CertificationLevelEditorForm from '@/components/simulator/CertificationLevelEditorForm';

export default async function EditCertificationLevelPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // 1. Obtener nivel
  const { data: level } = await supabase
    .from('certification_levels')
    .select('*')
    .eq('id', id)
    .single();

  if (!level) {
    notFound();
  }

  // 2. Obtener escenarios publicados
  const { data: scenarios } = await supabase
    .from('scenarios')
    .select('id, title, type, difficulty_level')
    .eq('is_published', true);

  // 3. Obtener escenarios asociados al nivel
  const { data: associatedScenarios } = await supabase
    .from('certification_level_scenarios')
    .select('scenario_id, order_index')
    .eq('certification_level_id', id);

  return (
    <CertificationLevelEditorForm
      level={level}
      scenarios={scenarios || []}
      associatedScenarios={associatedScenarios || []}
    />
  );
}
