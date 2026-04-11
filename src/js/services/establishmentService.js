import { supabase } from '../supabaseClient.js';

/**
 * Cria novo estabelecimento
 */
export async function createEstablishment(data) {
  const { data: result, error } = await supabase
    .from('establishments')
    .insert([data])
    .select()
    .single();
  if (error) throw error;
  return result;
}

/**
 * Busca estabelecimento do usuário logado
 */
export async function getMyEstablishment(userId) {
  const { data, error } = await supabase
    .from('establishments')
    .select('*')
    .eq('owner_id', userId)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

/**
 * Atualiza estabelecimento
 */
export async function updateEstablishment(id, data) {
  const { data: result, error } = await supabase
    .from('establishments')
    .update(data)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return result;
}

/**
 * Lista estabelecimentos filtrados por cidade
 */
export async function getEstablishmentsByCity(city) {
  let query = supabase.from('establishments').select('*');
  if (city) {
    query = query.ilike('city', `%${city}%`);
  }
  const { data, error } = await query.order('name');
  if (error) throw error;
  return data || [];
}

/**
 * Lista todos os estabelecimentos
 */
export async function getAllEstablishments() {
  const { data, error } = await supabase
    .from('establishments')
    .select('*')
    .order('name');
  if (error) throw error;
  return data || [];
}

/**
 * Busca estabelecimento por ID
 */
export async function getEstablishmentById(id) {
  const { data, error } = await supabase
    .from('establishments')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

/**
 * Registra visitante em um estabelecimento
 */
export async function registerVisitor(establishmentId, visitorId) {
  const { data, error } = await supabase
    .from('visitor_registrations')
    .insert([{ establishment_id: establishmentId, visitor_id: visitorId }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

/**
 * Lista visitantes registrados em um estabelecimento
 */
export async function getRegisteredVisitors(establishmentId) {
  const { data, error } = await supabase
    .from('visitor_registrations')
    .select('*, profiles:visitor_id(id, full_name, phone, city)')
    .eq('establishment_id', establishmentId)
    .order('registered_at', { ascending: false });
  if (error) throw error;
  return data || [];
}
