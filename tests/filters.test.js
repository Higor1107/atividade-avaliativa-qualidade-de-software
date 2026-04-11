import { describe, it, expect } from 'vitest';
import {
  filterByCity,
  filterByDate,
  filterByStatus,
  filterAvailableSlots,
  sortByDate,
  searchByName,
  filterByEstablishment,
} from '../src/js/utils/filters.js';

// ────────── Dados de teste ──────────
const establishments = [
  { name: 'Salão Bela Vista', city: 'São Paulo' },
  { name: 'Clínica Saúde', city: 'Rio de Janeiro' },
  { name: 'Barbearia Top', city: 'São Paulo' },
  { name: 'Studio Fitness', city: 'Curitiba' },
  { name: 'Pet Shop Amigo', city: 'são paulo' },
];

const slots = [
  { id: '1', slot_date: '2026-04-10', is_available: true },
  { id: '2', slot_date: '2026-04-10', is_available: false },
  { id: '3', slot_date: '2026-04-11', is_available: true },
  { id: '4', slot_date: '2026-04-12', is_available: true },
];

const appointments = [
  { id: '1', status: 'pending', date: '2026-04-10', establishment_id: 'est-1' },
  { id: '2', status: 'confirmed', date: '2026-04-11', establishment_id: 'est-2' },
  { id: '3', status: 'cancelled', date: '2026-04-09', establishment_id: 'est-1' },
  { id: '4', status: 'pending', date: '2026-04-12', establishment_id: 'est-3' },
];

// ────────────── filterByCity ──────────────
describe('filterByCity', () => {
  it('deve filtrar por cidade case-insensitive', () => {
    const result = filterByCity(establishments, 'são paulo');
    expect(result).toHaveLength(3);
  });

  it('deve filtrar por busca parcial', () => {
    const result = filterByCity(establishments, 'Rio');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Clínica Saúde');
  });

  it('deve retornar todos se cidade vazia', () => {
    expect(filterByCity(establishments, '')).toHaveLength(5);
  });

  it('deve retornar todos se cidade null', () => {
    expect(filterByCity(establishments, null)).toHaveLength(5);
  });

  it('deve retornar array vazio para lista inválida', () => {
    expect(filterByCity(null, 'SP')).toEqual([]);
  });

  it('deve retornar vazio se nenhum resultado', () => {
    expect(filterByCity(establishments, 'Manaus')).toHaveLength(0);
  });
});

// ────────────── filterByDate ──────────────
describe('filterByDate', () => {
  it('deve filtrar por data exata (slot_date)', () => {
    const result = filterByDate(slots, '2026-04-10');
    expect(result).toHaveLength(2);
  });

  it('deve filtrar appointments por date', () => {
    const result = filterByDate(appointments, '2026-04-11');
    expect(result).toHaveLength(1);
  });

  it('deve retornar todos se data null', () => {
    expect(filterByDate(slots, null)).toHaveLength(4);
  });

  it('deve retornar vazio para data sem resultados', () => {
    expect(filterByDate(slots, '2099-01-01')).toHaveLength(0);
  });
});

// ────────────── filterByStatus ──────────────
describe('filterByStatus', () => {
  it('deve filtrar por status pending', () => {
    const result = filterByStatus(appointments, 'pending');
    expect(result).toHaveLength(2);
  });

  it('deve filtrar case-insensitive', () => {
    const result = filterByStatus(appointments, 'CONFIRMED');
    expect(result).toHaveLength(1);
  });

  it('deve retornar todos se status vazio', () => {
    expect(filterByStatus(appointments, '')).toHaveLength(4);
  });

  it('deve retornar array vazio para lista inválida', () => {
    expect(filterByStatus(null, 'pending')).toEqual([]);
  });
});

// ────────────── filterAvailableSlots ──────────────
describe('filterAvailableSlots', () => {
  it('deve retornar apenas slots disponíveis', () => {
    const result = filterAvailableSlots(slots);
    expect(result).toHaveLength(3);
  });

  it('deve retornar vazio se nenhum disponível', () => {
    const unavailable = [{ is_available: false }, { is_available: false }];
    expect(filterAvailableSlots(unavailable)).toHaveLength(0);
  });

  it('deve retornar vazio para input inválido', () => {
    expect(filterAvailableSlots(null)).toEqual([]);
  });
});

// ────────────── sortByDate ──────────────
describe('sortByDate', () => {
  it('deve ordenar por data crescente', () => {
    const result = sortByDate(appointments, true);
    expect(result[0].date).toBe('2026-04-09');
    expect(result[3].date).toBe('2026-04-12');
  });

  it('deve ordenar por data decrescente', () => {
    const result = sortByDate(appointments, false);
    expect(result[0].date).toBe('2026-04-12');
    expect(result[3].date).toBe('2026-04-09');
  });

  it('deve não mutar array original', () => {
    const original = [...appointments];
    sortByDate(appointments, true);
    expect(appointments).toEqual(original);
  });

  it('deve retornar vazio para input inválido', () => {
    expect(sortByDate(null)).toEqual([]);
  });
});

// ────────────── searchByName ──────────────
describe('searchByName', () => {
  it('deve buscar por nome parcial', () => {
    const result = searchByName(establishments, 'salão');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Salão Bela Vista');
  });

  it('deve buscar case-insensitive', () => {
    const result = searchByName(establishments, 'TOP');
    expect(result).toHaveLength(1);
  });

  it('deve retornar todos se query vazia', () => {
    expect(searchByName(establishments, '')).toHaveLength(5);
  });

  it('deve retornar vazio se nenhum match', () => {
    expect(searchByName(establishments, 'xyz123')).toHaveLength(0);
  });
});

// ────────────── filterByEstablishment ──────────────
describe('filterByEstablishment', () => {
  it('deve filtrar por establishment_id', () => {
    const result = filterByEstablishment(appointments, 'est-1');
    expect(result).toHaveLength(2);
  });

  it('deve retornar todos se id null', () => {
    expect(filterByEstablishment(appointments, null)).toHaveLength(4);
  });

  it('deve retornar vazio para id inexistente', () => {
    expect(filterByEstablishment(appointments, 'est-999')).toHaveLength(0);
  });

  it('deve retornar vazio para lista inválida', () => {
    expect(filterByEstablishment(null, 'est-1')).toEqual([]);
  });
});
