import { createClient } from '@/lib/supabase/server';
import CertificationLevelEditorForm from '@/components/simulator/CertificationLevelEditorForm';

export default async function NewCertificationLevelPage() {
  const supabase = await createClient();

  // Obtener escenarios publicados para seleccionar
  const { data: scenarios } = await supabase
    .from('scenarios')
    .select('id, title, type, difficulty_level')
    .eq('is_published', true);

  return (
    <CertificationLevelEditorForm
      level={null}
      scenarios={scenarios || []}
      associatedScenarios={[]}
    />
  );
}
