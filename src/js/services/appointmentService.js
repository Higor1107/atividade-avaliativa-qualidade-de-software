import { supabase } from '../supabaseClient.js';
import { sanitizeInput } from '../utils/validators.js';

/**
 * Cria novo agendamento usando RPC para atomicidade
 * Usa uma função no banco para evitar race conditions
 */
export async function createAppointment(data) {
  // Sanitiza notas do usuário
  const sanitizedData = {
    ...data,
    notes: sanitizeInput(data.notes || ''),
  };

  // Execução atômica obrigatória
  const { data: result, error: rpcError } = await supabase
    .rpc('book_appointment', {
      p_visitor_id: sanitizedData.visitor_id,
      p_establishment_id: sanitizedData.establishment_id,
      p_time_slot_id: sanitizedData.time_slot_id,
      p_status: sanitizedData.status || 'pending',
      p_notes: sanitizedData.notes,
      p_service_type: sanitizedData.service_type || ''
    });

  if (rpcError) {
    throw rpcError;
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

