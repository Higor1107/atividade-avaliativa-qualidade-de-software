import { supabase } from '../supabaseClient.js';

/**
 * Cria novo time slot
 */
export async function createTimeSlot(data) {
  const { data: result, error } = await supabase
    .from('time_slots')
    .insert([data])
    .select()
    .single();
  if (error) throw error;
  return result;
}

/**
 * Lista slots de um estabelecimento por data
 */
export async function getSlotsByEstablishment(establishmentId, date) {
  let query = supabase
    .from('time_slots')
    .select('*')
    .eq('establishment_id', establishmentId)
    .order('start_time');

  if (date) {
    query = query.eq('slot_date', date);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

/**
 * Atualiza disponibilidade de um slot
 */
export async function updateSlotAvailability(slotId, isAvailable) {
  const { data, error } = await supabase
    .from('time_slots')
    .update({ is_available: isAvailable })
    .eq('id', slotId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

/**
 * Remove time slot
 */
export async function deleteTimeSlot(slotId) {
  const { error } = await supabase
    .from('time_slots')
    .delete()
    .eq('id', slotId);
  if (error) throw error;
}

/**
 * Cria múltiplos time slots de uma vez
 */
export async function createBulkTimeSlots(slots) {
  const { data, error } = await supabase
    .from('time_slots')
    .insert(slots)
    .select();
  if (error) throw error;
  return data || [];
}
