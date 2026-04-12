/**
 * @module formatters
 * Funções puras de formatação de dados para exibição
 */

/**
 * Formata telefone para (XX) XXXXX-XXXX
 * @param {string} phone - telefone com ou sem máscara
 * @returns {string}
 */
export function formatPhone(phone) {
  if (!phone || typeof phone !== 'string') return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return phone;
}

/**
 * Traduz status de agendamento para PT-BR
 * @param {string} status
 * @returns {string}
 */
export function formatStatus(status) {
  const map = {
    pending: 'Pendente',
    confirmed: 'Confirmado',
    cancelled: 'Cancelado',
    completed: 'Concluído',
  };
  if (!status || typeof status !== 'string') return '';
  return map[status.toLowerCase()] || status;
}

/**
 * Traduz role de usuário para PT-BR
 * @param {string} role
 * @returns {string}
 */
export function formatRole(role) {
  const map = {
    establishment: 'Estabelecimento',
    visitor: 'Visitante / Paciente',
  };
  if (!role || typeof role !== 'string') return '';
  return map[role.toLowerCase()] || role;
}

/**
 * Trunca texto com "..." se exceder maxLength
 * @param {string} text
 * @param {number} maxLength
 * @returns {string}
 */
export function truncateText(text, maxLength) {
  if (!text || typeof text !== 'string') return '';
  if (typeof maxLength !== 'number' || maxLength <= 0) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Capitaliza a primeira letra de cada palavra
 * @param {string} str
 * @returns {string}
 */
export function capitalizeWords(str) {
  if (!str || typeof str !== 'string') return '';
  return str
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Gera iniciais a partir do nome (máximo 2 letras)
 * @param {string} name
 * @returns {string}
 */
export function generateInitials(name) {
  if (!name || typeof name !== 'string') return '';
  const parts = name.trim().split(/\s+/).filter((p) => p.length > 0);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

/**
 * Retorna a cor do badge baseada no status
 * @param {string} status
 * @returns {string} classe CSS
 */
export function getStatusColor(status) {
  const map = {
    pending: 'status-pending',
    confirmed: 'status-confirmed',
    cancelled: 'status-cancelled',
    completed: 'status-completed',
  };
  if (!status || typeof status !== 'string') return 'status-default';
  return map[status.toLowerCase()] || 'status-default';
}

/**
 * Formata contagem com plural correto em PT-BR
 * @param {number} count
 * @param {string} singular
 * @param {string} plural
 * @returns {string}
 */
export function formatCount(count, singular, plural) {
  if (typeof count !== 'number') return '';
  if (!singular || !plural) return String(count);
  return `${count} ${count === 1 ? singular : plural}`;
}
