/**
 * @module filters
 * Funções puras de filtragem e ordenação de dados
 */

/**
 * Filtra itens por cidade (case-insensitive, parcial)
 * @param {Array<object>} items - objetos com propriedade 'city'
 * @param {string} city - cidade para filtrar
 * @returns {Array<object>}
 */
export function filterByCity(items, city) {
  if (!Array.isArray(items)) return [];
  if (!city || typeof city !== 'string' || city.trim() === '') return items;
  const search = city.trim().toLowerCase();
  return items.filter(
    (item) => item.city && item.city.toLowerCase().includes(search)
  );
}

/**
 * Filtra itens por data exata
 * @param {Array<object>} items - objetos com propriedade 'slot_date' ou 'date'
 * @param {string} date - data YYYY-MM-DD
 * @returns {Array<object>}
 */
export function filterByDate(items, date) {
  if (!Array.isArray(items)) return [];
  if (!date || typeof date !== 'string') return items;
  return items.filter(
    (item) => (item.slot_date || item.date) === date
  );
}

/**
 * Filtra itens por status
 * @param {Array<object>} items - objetos com propriedade 'status'
 * @param {string} status - status para filtrar
 * @returns {Array<object>}
 */
export function filterByStatus(items, status) {
  if (!Array.isArray(items)) return [];
  if (!status || typeof status !== 'string' || status.trim() === '') return items;
  return items.filter(
    (item) => item.status && item.status.toLowerCase() === status.toLowerCase()
  );
}

/**
 * Filtra apenas horários disponíveis
 * @param {Array<object>} slots - objetos com propriedade 'is_available'
 * @returns {Array<object>}
 */
export function filterAvailableSlots(slots) {
  if (!Array.isArray(slots)) return [];
  return slots.filter((slot) => slot.is_available === true);
}

/**
 * Ordena itens por data (slot_date ou date)
 * @param {Array<object>} items
 * @param {boolean} ascending - true para crescente, false para decrescente
 * @returns {Array<object>}
 */
export function sortByDate(items, ascending = true) {
  if (!Array.isArray(items)) return [];
  return [...items].sort((a, b) => {
    const dateA = a.slot_date || a.date || '';
    const dateB = b.slot_date || b.date || '';
    const cmp = dateA.localeCompare(dateB);
    return ascending ? cmp : -cmp;
  });
}

/**
 * Busca itens por nome (case-insensitive, parcial)
 * @param {Array<object>} items - objetos com propriedade 'name'
 * @param {string} query - termo de busca
 * @returns {Array<object>}
 */
export function searchByName(items, query) {
  if (!Array.isArray(items)) return [];
  if (!query || typeof query !== 'string' || query.trim() === '') return items;
  const search = query.trim().toLowerCase();
  return items.filter(
    (item) => item.name && item.name.toLowerCase().includes(search)
  );
}

/**
 * Filtra agendamentos por estabelecimento
 * @param {Array<object>} appointments
 * @param {string} establishmentId
 * @returns {Array<object>}
 */
export function filterByEstablishment(appointments, establishmentId) {
  if (!Array.isArray(appointments)) return [];
  if (!establishmentId || typeof establishmentId !== 'string') return appointments;
  return appointments.filter(
    (apt) => apt.establishment_id === establishmentId
  );
}
