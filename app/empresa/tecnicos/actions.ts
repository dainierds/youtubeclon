'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// Acción para invitar un técnico
export async function inviteTechnicianAction(formData: FormData) {
  const email = formData.get('email') as string;
  const fullName = formData.get('fullName') as string;
  const password = formData.get('password') as string;
  const companyId = formData.get('companyId') as string;

  if (!email || !fullName || !password || !companyId) {
    throw new Error('Todos los campos son requeridos.');
  }

  const supabase = await createClient();
  const supabaseAdmin = createAdminClient();

  // 1. Validar límite de asientos de la empresa
  const { data: company } = await supabase
    .from('companies')
    .select('seats_limit')
    .eq('id', companyId)
    .single();

  const { count: currentTechs } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('company_id', companyId)
    .eq('role', 'technician');

  if (company && currentTechs !== null && currentTechs >= company.seats_limit) {
    throw new Error('Se ha alcanzado el límite máximo de asientos contratados para técnicos.');
  }

  // 2. Crear usuario de autenticación
  const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      role: 'technician',
      full_name: fullName,
    },
  });

  if (authError) {
    throw new Error(`Error de autenticación: ${authError.message}`);
  }

  if (authUser?.user) {
    // 3. Modificar perfil público
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        company_id: companyId,
        role: 'technician',
      })
      .eq('id', authUser.user.id);

    if (profileError) {
      throw new Error(`Error en perfil: ${profileError.message}`);
    }

    // 4. Registrar relación company_technician
    const { error: relationError } = await supabaseAdmin
      .from('company_technicians')
      .insert({
        company_id: companyId,
        user_id: authUser.user.id,
        status: 'active',
      });

    if (relationError) {
      throw new Error(`Error en relación: ${relationError.message}`);
    }
  }

  revalidatePath('/empresa/tecnicos');
}

// Acción para actualizar el estado del técnico (Suspender / Activar)
export async function toggleTechnicianStatus(formData: FormData) {
  const companyId = formData.get('companyId') as string;
  const userId = formData.get('userId') as string;
  const currentStatus = formData.get('currentStatus') as string;

  const nextStatus = currentStatus === 'active' ? 'suspended' : 'active';

  const supabase = await createClient();

  const { error } = await supabase
    .from('company_technicians')
    .update({ status: nextStatus as any })
    .eq('company_id', companyId)
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Error al cambiar el estado del técnico: ${error.message}`);
  }

  revalidatePath('/empresa/tecnicos');
}
