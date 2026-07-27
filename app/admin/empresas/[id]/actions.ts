'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function updateCompanyDetails(formData: FormData) {
  const companyId = formData.get('companyId') as string;
  const plan = formData.get('plan') as any;
  const seats_limit = parseInt(formData.get('seats_limit') as string, 10);

  if (!companyId || !plan || !seats_limit) {
    throw new Error('Parámetros de actualización inválidos.');
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from('companies')
    .update({
      plan,
      seats_limit,
    })
    .eq('id', companyId);

  if (error) {
    throw new Error(`Error al actualizar la empresa: ${error.message}`);
  }

  revalidatePath(`/admin/empresas/${companyId}`);
}
