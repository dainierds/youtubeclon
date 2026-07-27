'use server';

import { createClient } from '@/lib/supabase/server';

export async function saveAttemptAction(
  userId: string,
  scenarioId: string | null,
  wiringState: any,
  isCorrect: boolean,
  errors: any,
  timeSpentSeconds: number
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('attempts')
    .insert({
      user_id: userId,
      scenario_id: scenarioId,
      wiring_state: wiringState,
      is_correct: isCorrect,
      errors: errors || [],
      time_spent_seconds: timeSpentSeconds,
    });

  if (error) {
    throw new Error(`Error al guardar el intento: ${error.message}`);
  }
}
