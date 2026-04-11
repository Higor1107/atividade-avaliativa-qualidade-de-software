import { supabase } from '../supabaseClient.js';

/**
 * Cria novo agendamento
 */
export async function createAppointment(data) {
  const { data: result, error } = await supabase
    .from('appointments')
    .insert([data])
    .select()
    .single();
  if (error) throw error;

  // Marca o slot como indisponível
  if (data.time_slot_id) {
    await supabase
      .from('time_slots')
      .update({ is_available: false })
      .eq('id', data.time_slot_id);
  }

  return result;
}

/**
 * Lista agendamentos do visitante
 */
export async function getMyAppointments(visitorId) {
  const { data, error } = await supabase
    .from('appointments')
    .select('*, establishments:establishment_id(name, city, address), time_slots:time_slot_id(slot_date, start_time, end_time)')
    .eq('visitor_id', visitorId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

/**
 * Lista agendamentos de um estabelecimento
 */
export async function getEstablishmentAppointments(establishmentId) {
  const { data, error } = await supabase
    .from('appointments')
    .select('*, profiles:visitor_id(full_name, phone, city), time_slots:time_slot_id(slot_date, start_time, end_time)')
    .eq('establishment_id', establishmentId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

/**
 * Atualiza status do agendamento
 */
export async function updateAppointmentStatus(id, status) {
  const { data, error } = await supabase
    .from('appointments')
    .update({ status })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;

  // Se cancelado, libera o slot
  if (status === 'cancelled' && data.time_slot_id) {
    await supabase
      .from('time_slots')
      .update({ is_available: true })
      .eq('id', data.time_slot_id);
  }

  return data;
}

/**
 * Cancela agendamento
 */
export async function cancelAppointment(id) {
  return updateAppointmentStatus(id, 'cancelled');
}
