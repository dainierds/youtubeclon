import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Cliente con la clave de servicio (Secret Key) para operaciones administrativas
export const createAdminClient = () => {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:3000',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-secret-key',
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
};
