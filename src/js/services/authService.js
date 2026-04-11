import { supabase } from '../supabaseClient.js';

/**
 * Registra novo usuário com perfil
 */
export async function signUp(email, password, userData) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: userData.fullName,
        role: userData.role,
        city: userData.city || '',
        phone: userData.phone || '',
      },
    },
  });
  if (error) throw error;
  return data;
}

/**
 * Login com e-mail e senha
 */
export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

/**
 * Logout
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/**
 * Retorna usuário atual
 */
export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

/**
 * Busca perfil do usuário logado
 */
export async function getUserProfile() {
  const user = await getCurrentUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Listener de mudanças de auth
 */
export function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });
}
