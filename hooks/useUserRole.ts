import { useEffect, useState } from 'react';
import { createClient } from '../lib/supabase/client';

export function useUserRole() {
  const [role, setRole] = useState<string | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    const supabase = createClient();

    async function fetchUserRole() {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError) throw authError;

        if (user) {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role, company_id')
            .eq('id', user.id)
            .single();

          if (profileError) throw profileError;

          if (profile) {
            setRole(profile.role);
            setCompanyId(profile.company_id);
          }
        }
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    }

    fetchUserRole();
  }, []);

  return { role, companyId, loading, error };
}
