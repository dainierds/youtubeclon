'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export async function saveCertificationLevelAction(formData: FormData) {
  const id = formData.get('id') as string;
  const level_number = parseInt(formData.get('level_number') as string, 10);
  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const time_limit_minutes = parseInt(formData.get('time_limit_minutes') as string, 10);
  const passing_score_percent = parseInt(formData.get('passing_score_percent') as string, 10);
  const scenariosJson = formData.get('scenariosJson') as string;

  if (isNaN(level_number) || !title || !scenariosJson) {
    throw new Error('Número de Nivel, Título y Escenarios asociados son requeridos.');
  }

  const selectedScenarios = JSON.parse(scenariosJson); // Array de ids de escenarios en orden
  const supabase = await createClient();

  const payload = {
    level_number,
    title,
    description,
    time_limit_minutes,
    passing_score_percent,
  };

  let levelId = id;

  if (id) {
    // Editar nivel existente
    const { error } = await supabase
      .from('certification_levels')
      .update(payload)
      .eq('id', id);

    if (error) {
      throw new Error(`Error al actualizar nivel: ${error.message}`);
    }

    // Borrar escenarios asignados anteriores
    await supabase
      .from('certification_level_scenarios')
      .delete()
      .eq('certification_level_id', id);
  } else {
    // Crear nuevo nivel
    const { data: newLvl, error } = await supabase
      .from('certification_levels')
      .insert(payload)
      .select('id')
      .single();

    if (error) {
      throw new Error(`Error al guardar nivel: ${error.message}`);
    }

    levelId = newLvl.id;
  }

  // Insertar las nuevas relaciones ordenadas de escenarios
  const relations = selectedScenarios.map((scenarioId: string, index: number) => ({
    certification_level_id: levelId,
    scenario_id: scenarioId,
    order_index: index,
  }));

  const { error: relError } = await supabase
    .from('certification_level_scenarios')
    .insert(relations);

  if (relError) {
    throw new Error(`Error al vincular escenarios al nivel: ${relError.message}`);
  }

  revalidatePath('/admin/certificaciones');
  redirect('/admin/certificaciones');
}
