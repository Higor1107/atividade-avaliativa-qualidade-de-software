/**
 * @module validators
 * Funções puras de validação para formulários do AgendaFácil
 */

/**
 * Valida formato de e-mail
 * @param {string} email
 * @returns {boolean}
 */
export function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email.trim());
}

/**
 * Valida telefone brasileiro (com ou sem máscara)
 * Aceita: (11) 99999-9999, 11999999999, +5511999999999
 * @param {string} phone
 * @returns {boolean}
 */
export function isValidPhone(phone) {
  if (!phone || typeof phone !== 'string') return false;
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 13;
}

/**
 * Valida nome completo (pelo menos 2 partes, mínimo 3 caracteres)
 * @param {string} name
 * @returns {boolean}
 */
export function isValidName(name) {
  if (!name || typeof name !== 'string') return false;
  const trimmed = name.trim();
  if (trimmed.length < 3) return false;
  const parts = trimmed.split(/\s+/).filter((p) => p.length > 0);
  return parts.length >= 2;
}

/**
 * Valida senha (mínimo 6 caracteres)
 * @param {string} password
 * @returns {boolean}
 */
export function isValidPassword(password) {
  if (!password || typeof password !== 'string') return false;
  return password.length >= 6;
}

/**
 * Valida cidade (não vazia, apenas letras e espaços)
 * @param {string} city
 * @returns {boolean}
 */
export function isValidCity(city) {
  if (!city || typeof city !== 'string') return false;
  const trimmed = city.trim();
  if (trimmed.length < 2) return false;
  return /^[a-zA-ZÀ-ÿ\s'-]+$/.test(trimmed);
}

/**
 * Valida string de data no formato YYYY-MM-DD
 * @param {string} dateStr
 * @returns {boolean}
 */
export function isValidDateStr(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return false;
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateStr)) return false;
  const date = new Date(dateStr + 'T00:00:00');
  return !isNaN(date.getTime());
}

/**
 * Valida que a data não está no passado (permite hoje)
 * @param {string} dateStr - formato YYYY-MM-DD
 * @returns {boolean}
 */
export function isDateNotInPast(dateStr) {
  if (!isValidDateStr(dateStr)) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = new Date(dateStr + 'T00:00:00');
  return date >= today;
}

/**
 * Valida range de horário (início antes do fim)
 * @param {string} startTime - formato HH:MM
 * @param {string} endTime - formato HH:MM
 * @returns {boolean}
 */
export function isValidTimeRange(startTime, endTime) {
  if (!startTime || !endTime) return false;
  if (typeof startTime !== 'string' || typeof endTime !== 'string') return false;
  const timeRegex = /^\d{2}:\d{2}$/;
  if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) return false;

  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);

  if (startH < 0 || startH > 23 || startM < 0 || startM > 59) return false;
  if (endH < 0 || endH > 23 || endM < 0 || endM > 59) return false;

  return startH * 60 + startM < endH * 60 + endM;
}

/**
 * Remove tags HTML e caracteres potencialmente perigosos
 * @param {string} str
 * @returns {string}
 */
export function sanitizeInput(str) {
  if (!str || typeof str !== 'string') return '';
  return str
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim();
}
