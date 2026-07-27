import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import ScenarioEditorForm from '@/components/simulator/ScenarioEditorForm';

export default async function EditScenarioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: scenario } = await supabase
    .from('scenarios')
    .select('*')
    .eq('id', id)
    .single();

  if (!scenario) {
    notFound();
  }

  return (
    <ScenarioEditorForm scenario={scenario} />
  );
}
