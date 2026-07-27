'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export async function saveScenarioAction(formData: FormData) {
  const id = formData.get('id') as string;
  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const type = formData.get('type') as any;
  const difficulty_level = parseInt(formData.get('difficulty_level') as string, 10);
  const is_published = formData.get('is_published') === 'true';
  
  const nodesJson = formData.get('nodesJson') as string;
  const edgesJson = formData.get('edgesJson') as string;
  const faultWiringJson = formData.get('faultWiringJson') as string;

  if (!title || !type || !nodesJson) {
    throw new Error('Título, Tipo y Hardware son requeridos.');
  }

  const nodes = JSON.parse(nodesJson);
  const edges = JSON.parse(edgesJson);

  // Formatear correct_wiring como lista simple de origen/destino
  const correct_wiring = edges.map((e: any) => ({
    sourcePort: e.sourceHandle,
    targetPort: e.targetHandle,
  }));

  // Crear la configuración del hardware
  const hardware_config: any = { nodes };

  // Si hay inyección de fallas configurada (modo diagnóstico)
  let fault_injection = null;
  if (type === 'diagnostic' && faultWiringJson) {
    const faultEdges = JSON.parse(faultWiringJson);
    hardware_config.initial_wiring = faultEdges;
    
    // Identificar el cable dañado
    const correctWiringIds = edges.map((e: any) => `${e.sourceHandle}-${e.targetHandle}`);
    const faultEdge = faultEdges.find((e: any) => 
      !correctWiringIds.includes(`${e.sourceHandle}-${e.targetHandle}`)
    );
    if (faultEdge) {
      fault_injection = {
        wiring: faultEdges,
        incorrect_connection: {
          sourcePort: faultEdge.sourceHandle,
          targetPort: faultEdge.targetHandle
        }
      };
    }
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const payload: any = {
    title,
    description,
    type,
    difficulty_level,
    hardware_config,
    correct_wiring,
    fault_injection,
    is_published,
    created_by: user?.id,
  };

  if (id) {
    // Modo Editar
    const { error } = await supabase
      .from('scenarios')
      .update(payload)
      .eq('id', id);

    if (error) {
      throw new Error(`Error al actualizar escenario: ${error.message}`);
    }
  } else {
    // Modo Crear
    const { error } = await supabase
      .from('scenarios')
      .insert(payload);

    if (error) {
      throw new Error(`Error al guardar escenario: ${error.message}`);
    }
  }

  revalidatePath('/admin/escenarios');
  redirect('/admin/escenarios');
}
