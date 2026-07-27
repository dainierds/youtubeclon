'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function assignScenarioAction(formData: FormData) {
  const scenarioId = formData.get('scenarioId') as string;
  const technicianIds = formData.getAll('technicianIds') as string[];
  const dueDateString = formData.get('dueDate') as string;

  if (!scenarioId || technicianIds.length === 0) {
    throw new Error('Debes seleccionar un escenario y al menos un técnico.');
  }

  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  const dueDate = dueDateString ? new Date(dueDateString).toISOString() : null;

  // Insertar las asignaciones correspondientes
  const assignments = technicianIds.map((techId) => ({
    scenario_id: scenarioId,
    technician_id: techId,
    assigned_by: user?.id || null,
    due_date: dueDate,
  }));

  const { error } = await supabase
    .from('scenario_assignments')
    .insert(assignments);

  if (error) {
    throw new Error(`Error al asignar escenario: ${error.message}`);
  }

  revalidatePath('/empresa/escenarios');
}
