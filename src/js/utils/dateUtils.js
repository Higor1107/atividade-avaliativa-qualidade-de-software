/**
 * @module dateUtils
 * Funções puras para manipulação de datas e horários
 */

const DIAS_SEMANA = [
  'Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira',
  'Quinta-feira', 'Sexta-feira', 'Sábado'
];

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

/**
 * Formata data de YYYY-MM-DD para DD/MM/AAAA
 * @param {string} dateStr - formato YYYY-MM-DD
 * @returns {string} formato DD/MM/AAAA
 */
export function formatDate(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return '';
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

/**
 * Formata horário garantindo HH:MM
 * @param {string} time - formato HH:MM ou HH:MM:SS
 * @returns {string} formato HH:MM
 */
export function formatTime(time) {
  if (!time || typeof time !== 'string') return '';
  const parts = time.split(':');
  if (parts.length < 2) return '';
  return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
}

/**
 * Combina data e hora em formato legível
 * @param {string} dateStr - YYYY-MM-DD
 * @param {string} time - HH:MM
 * @returns {string} "DD/MM/AAAA às HH:MM"
 */
export function formatDateTime(dateStr, time) {
  const d = formatDate(dateStr);
  const t = formatTime(time);
  if (!d || !t) return '';
  return `${d} às ${t}`;
}

/**
 * Verifica se a data (YYYY-MM-DD) é no passado (antes de hoje)
 * @param {string} dateStr
 * @returns {boolean}
 */
export function isDateInPast(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = new Date(dateStr + 'T00:00:00');
  if (isNaN(date.getTime())) return false;
  return date < today;
}

/**
 * Verifica se a data é hoje
 * @param {string} dateStr - YYYY-MM-DD
 * @returns {boolean}
 */
export function isDateToday(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return false;
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  return dateStr === todayStr;
}

/**
 * Retorna dia da semana em PT-BR
 * @param {string} dateStr - YYYY-MM-DD
 * @returns {string}
 */
export function getDayOfWeek(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return '';
  const date = new Date(dateStr + 'T12:00:00');
  if (isNaN(date.getTime())) return '';
  return DIAS_SEMANA[date.getDay()];
}

/**
 * Retorna nome do mês em PT-BR (1-12)
 * @param {number} month - 1-indexed
 * @returns {string}
 */
export function getMonthName(month) {
  if (typeof month !== 'number' || month < 1 || month > 12) return '';
  return MESES[month - 1];
}

/**
 * Gera array com os dias do mês para montar calendário
 * Cada item: { day, dayOfWeek, dateStr, isCurrentMonth }
 * @param {number} year
 * @param {number} month - 1-indexed
 * @returns {Array<object>}
 */
export function generateCalendarDays(year, month) {
  if (typeof year !== 'number' || typeof month !== 'number') return [];
  if (month < 1 || month > 12) return [];

  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  const daysInMonth = lastDay.getDate();
  const startWeekday = firstDay.getDay();

  const days = [];

  // Dias do mês anterior (preencher início)
  const prevMonthLast = new Date(year, month - 1, 0).getDate();
  for (let i = startWeekday - 1; i >= 0; i--) {
    const d = prevMonthLast - i;
    const m = month - 1 < 1 ? 12 : month - 1;
    const y = month - 1 < 1 ? year - 1 : year;
    days.push({
      day: d,
      dateStr: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
      isCurrentMonth: false,
    });
  }

  // Dias do mês atual
  for (let d = 1; d <= daysInMonth; d++) {
    days.push({
      day: d,
      dateStr: `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
      isCurrentMonth: true,
    });
  }

  // Dias do próximo mês (preencher final até completar 42 = 6 semanas)
  const remaining = 42 - days.length;
  for (let d = 1; d <= remaining; d++) {
    const m = month + 1 > 12 ? 1 : month + 1;
    const y = month + 1 > 12 ? year + 1 : year;
    days.push({
      day: d,
      dateStr: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
      isCurrentMonth: false,
    });
  }

  return days;
}

/**
 * Gera slots de horário entre início e fim com intervalo em minutos
 * @param {string} start - HH:MM
 * @param {string} end - HH:MM
 * @param {number} intervalMin - intervalo em minutos
 * @returns {Array<string>} lista de horários HH:MM
 */
export function generateTimeSlots(start, end, intervalMin) {
  if (!start || !end || typeof intervalMin !== 'number' || intervalMin <= 0) return [];
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  if (isNaN(sh) || isNaN(sm) || isNaN(eh) || isNaN(em)) return [];

  const startMinutes = sh * 60 + sm;
  const endMinutes = eh * 60 + em;
  if (startMinutes >= endMinutes) return [];

  const slots = [];
  for (let m = startMinutes; m < endMinutes; m += intervalMin) {
    const h = Math.floor(m / 60);
    const min = m % 60;
    slots.push(`${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`);
  }
  return slots;
}

/**
 * Retorna a data de hoje no formato YYYY-MM-DD
 * @returns {string}
 */
export function getTodayStr() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
}
