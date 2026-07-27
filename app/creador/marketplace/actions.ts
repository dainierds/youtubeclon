'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function publishToMarketplaceAction(formData: FormData) {
  const scenarioId = formData.get('scenarioId') as string;
  const priceDollars = parseFloat(formData.get('priceDollars') as string);

  if (!scenarioId || isNaN(priceDollars) || priceDollars < 0) {
    throw new Error('Escenario y un precio válido en dólares son requeridos.');
  }

  const priceCents = Math.round(priceDollars * 100);
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  // Validar si ya está publicado
  const { data: existing } = await supabase
    .from('marketplace_listings')
    .select('id')
    .eq('scenario_id', scenarioId)
    .single();

  if (existing) {
    // Actualizar precio
    const { error } = await supabase
      .from('marketplace_listings')
      .update({ price_cents: priceCents, is_active: true })
      .eq('id', existing.id);

    if (error) throw new Error(`Error al actualizar listado: ${error.message}`);
  } else {
    // Crear listado
    const { error } = await supabase
      .from('marketplace_listings')
      .insert({
        scenario_id: scenarioId,
        creator_id: user?.id,
        price_cents: priceCents,
        is_active: true,
      });

    if (error) throw new Error(`Error al publicar listado: ${error.message}`);
  }

  revalidatePath('/creador/marketplace');
}

export async function toggleListingStatusAction(formData: FormData) {
  const listingId = formData.get('listingId') as string;
  const currentStatus = formData.get('currentStatus') === 'true';

  const supabase = await createClient();
  const { error } = await supabase
    .from('marketplace_listings')
    .update({ is_active: !currentStatus })
    .eq('id', listingId);

  if (error) throw new Error(`Error al cambiar estado: ${error.message}`);

  revalidatePath('/creador/marketplace');
}
