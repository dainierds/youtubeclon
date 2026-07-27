'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

// 1. Iniciar un intento de certificación
export async function startCertificationAttemptAction(levelId: string, userId: string) {
  const supabase = await createClient();

  // Verificar si hay un intento fallido en las últimas 24 horas para este nivel
  const { data: lastAttempts } = await supabase
    .from('certification_attempts')
    .select('submitted_at, passed')
    .eq('user_id', userId)
    .eq('certification_level_id', levelId)
    .order('created_at', { ascending: false });

  if (lastAttempts && lastAttempts.length > 0) {
    const last = lastAttempts[0];
    if (last.submitted_at && !last.passed) {
      const hoursSinceLast = (Date.now() - new Date(last.submitted_at).getTime()) / (1000 * 60 * 60);
      if (hoursSinceLast < 24) {
        throw new Error(`Debes esperar 24 horas antes de volver a intentar este examen. Tiempo restante: ${Math.ceil(24 - hoursSinceLast)} horas.`);
      }
    }
  }

  // Obtener el número de intento actual
  const attemptNumber = (lastAttempts?.length || 0) + 1;

  const { data: attempt, error } = await supabase
    .from('certification_attempts')
    .insert({
      user_id: userId,
      certification_level_id: levelId,
      started_at: new Date().toISOString(),
      attempt_number: attemptNumber,
    })
    .select('id')
    .single();

  if (error) {
    throw new Error(`Error al iniciar intento de examen: ${error.message}`);
  }

  redirect(`/simulador/certificacion/examen/${attempt.id}`);
}

// 2. Finalizar/Enviar intento de certificación (calcula score y expide certificado si aprueba)
export async function submitCertificationAttemptAction(
  attemptId: string,
  results: { scenarioId: string; isCorrect: boolean; timeSpent: number }[]
) {
  const supabase = await createClient();

  // Obtener detalles del intento y del nivel
  const { data: attempt } = await supabase
    .from('certification_attempts')
    .select(`
      user_id,
      certification_level_id,
      level:certification_levels (
        level_number,
        passing_score_percent
      )
    `)
    .eq('id', attemptId)
    .single();

  if (!attempt) throw new Error('Intento de examen no encontrado.');

  const levelInfo = attempt.level as any;
  
  // Registrar los intentos individuales asociados en la tabla attempts tradicional
  const inserts = results.map((r) => ({
    user_id: attempt.user_id,
    scenario_id: r.scenarioId,
    wiring_state: { source: 'certification' },
    is_correct: r.isCorrect,
    errors: r.isCorrect ? [] : [{ message: 'Conexión incorrecta evaluada en examen de certificación.' }],
    time_spent_seconds: r.timeSpent,
  }));

  await supabase.from('attempts').insert(inserts);

  // Calcular score_percent
  const correctCount = results.filter((r) => r.isCorrect).length;
  const scorePercent = Math.round((correctCount / results.length) * 100);
  const passed = scorePercent >= levelInfo.passing_score_percent;

  // Actualizar el intento de certificación
  const { error: updateError } = await supabase
    .from('certification_attempts')
    .update({
      submitted_at: new Date().toISOString(),
      score_percent: scorePercent,
      passed,
    })
    .eq('id', attemptId);

  if (updateError) throw new Error(`Error al enviar examen: ${updateError.message}`);

  // Si aprobó, expedir el certificado oficial
  if (passed) {
    // Generar código de verificación aleatorio único
    const verificationCode = `CERT-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    await supabase
      .from('certifications')
      .insert({
        user_id: attempt.user_id,
        level: levelInfo.level_number,
        verification_code: verificationCode,
      });
  }

  revalidatePath('/simulador/certificacion');
  return { passed, scorePercent };
}
