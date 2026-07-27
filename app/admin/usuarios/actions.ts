'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function updateUserRoleAction(formData: FormData) {
  const userId = formData.get('userId') as string;
  const role = formData.get('role') as any;
  const companyId = formData.get('companyId') as string;

  if (!userId || !role) {
    throw new Error('Parámetros de actualización inválidos.');
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from('profiles')
    .update({
      role,
      company_id: companyId === 'none' ? null : companyId,
    })
    .eq('id', userId);

  if (error) {
    throw new Error(`Error al actualizar el usuario: ${error.message}`);
  }

  revalidatePath('/admin/usuarios');
}
