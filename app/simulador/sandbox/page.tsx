import { createClient } from '@/lib/supabase/server';
import SimulatorSessionWrapper from '@/components/simulator/SimulatorSessionWrapper';

export default async function SandboxPracticePage() {
  const supabase = await createClient();

  // 1. Obtener usuario autenticado
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id || '';

  return (
    <SimulatorSessionWrapper
      userId={userId}
      scenario={null} // null indica modo Sandbox libre
    />
  );
}
