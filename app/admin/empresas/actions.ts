'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function createCompanyAction(formData: FormData) {
  const name = formData.get('name') as string;
  const plan = formData.get('plan') as any;
  const seats_limit = parseInt(formData.get('seats_limit') as string, 10);
  const adminEmail = formData.get('adminEmail') as string;
  const adminFullName = formData.get('adminFullName') as string;
  const adminPassword = formData.get('adminPassword') as string;

  if (!name || !plan || !seats_limit || !adminEmail || !adminPassword) {
    throw new Error('Todos los campos son requeridos.');
  }

  const supabase = await createClient();
  const supabaseAdmin = createAdminClient();

  // 1. Crear la empresa
  const { data: company, error: companyError } = await supabase
    .from('companies')
    .insert({
      name,
      plan: 'trial',
      seats_limit: 5,
    })
    .select()
    .single();

  if (companyError) {
    throw new Error(`Error al crear la empresa: ${companyError.message}`);
  }

  // 2. Crear el usuario administrador de empresa (company_admin)
  // Usamos la API de Supabase Auth Admin para crearlo directamente y asignarle contraseña
  const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: adminEmail,
    password: adminPassword,
    email_confirm: true,
    user_metadata: {
      role: 'company_admin',
      full_name: adminFullName,
    },
  });

  if (authError) {
    // Si falla el usuario, limpiamos la empresa para consistencia
    await supabase.from('companies').delete().eq('id', company.id);
    throw new Error(`Error al crear el administrador: ${authError.message}`);
  }

  if (authUser?.user) {
    // 3. Asignar el company_id al perfil creado
    // Nota: El trigger handle_new_user creará el perfil al registrarse el usuario en auth.
    // Hacemos un update del perfil para relacionarlo a la empresa.
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        company_id: company.id,
        role: 'company_admin',
      })
      .eq('id', authUser.user.id);

    if (profileError) {
      throw new Error(`Error al vincular el perfil a la empresa: ${profileError.message}`);
    }

    // Registrar en la tabla company_technicians
    const { error: relationError } = await supabaseAdmin
      .from('company_technicians')
      .insert({
        company_id: company.id,
        user_id: authUser.user.id,
        status: 'active',
      });

    if (relationError) {
      throw new Error(`Error al registrar el técnico de la empresa: ${relationError.message}`);
    }
  }

  redirect('/admin/empresas');
}
