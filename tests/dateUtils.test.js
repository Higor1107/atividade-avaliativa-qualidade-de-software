import { describe, it, expect } from 'vitest';
import {
  formatDate,
  formatTime,
  formatDateTime,
  isDateInPast,
  isDateToday,
  getDayOfWeek,
  getMonthName,
  generateCalendarDays,
  generateTimeSlots,
  getTodayStr,
} from '../src/js/utils/dateUtils.js';

// ────────────── formatDate ──────────────
describe('formatDate', () => {
  it('deve formatar YYYY-MM-DD para DD/MM/AAAA', () => {
    expect(formatDate('2026-04-10')).toBe('10/04/2026');
  });

  it('deve formatar corretamente mês e dia com zero', () => {
    expect(formatDate('2026-01-05')).toBe('05/01/2026');
  });

  it('deve retornar string vazia para input inválido', () => {
    expect(formatDate('')).toBe('');
  });

  it('deve retornar string vazia para null', () => {
    expect(formatDate(null)).toBe('');
  });

  it('deve retornar string vazia para formato incorreto', () => {
    expect(formatDate('10-04-2026')).toBe('2026/04/10');
  });
});

// ────────────── formatTime ──────────────
describe('formatTime', () => {
  it('deve formatar HH:MM corretamente', () => {
    expect(formatTime('08:30')).toBe('08:30');
  });

  it('deve formatar HH:MM:SS para HH:MM', () => {
    expect(formatTime('14:30:00')).toBe('14:30');
  });

  it('deve adicionar zero à esquerda', () => {
    expect(formatTime('8:5')).toBe('08:05');
  });

  it('deve retornar vazio para null', () => {
    expect(formatTime(null)).toBe('');
  });

  it('deve retornar vazio para string sem :', () => {
    expect(formatTime('0830')).toBe('');
  });
});

// ────────────── formatDateTime ──────────────
describe('formatDateTime', () => {
  it('deve combinar data e hora', () => {
    expect(formatDateTime('2026-04-10', '14:30')).toBe('10/04/2026 às 14:30');
  });

  it('deve retornar vazio se data inválida', () => {
    expect(formatDateTime('', '14:30')).toBe('');
  });

  it('deve retornar vazio se hora inválida', () => {
    expect(formatDateTime('2026-04-10', '')).toBe('');
  });
});

// ────────────── isDateInPast ──────────────
describe('isDateInPast', () => {
  it('deve retornar true para data passada', () => {
    expect(isDateInPast('2020-01-01')).toBe(true);
  });

  it('deve retornar false para data futura', () => {
    expect(isDateInPast('2099-12-31')).toBe(false);
  });

  it('deve retornar false para input inválido', () => {
    expect(isDateInPast(null)).toBe(false);
  });

  it('deve retornar false para string não-data', () => {
    expect(isDateInPast('abc')).toBe(false);
  });
});

// ────────────── isDateToday ──────────────
describe('isDateToday', () => {
  it('deve retornar true para hoje', () => {
    const today = getTodayStr();
    expect(isDateToday(today)).toBe(true);
  });

  it('deve retornar false para ontem', () => {
    expect(isDateToday('2020-01-01')).toBe(false);
  });

  it('deve retornar false para null', () => {
    expect(isDateToday(null)).toBe(false);
  });
});

// ────────────── getDayOfWeek ──────────────
describe('getDayOfWeek', () => {
  it('deve retornar Quarta-feira para 2026-04-01', () => {
    expect(getDayOfWeek('2026-04-01')).toBe('Quarta-feira');
  });

  it('deve retornar Domingo para 2026-04-05', () => {
    expect(getDayOfWeek('2026-04-05')).toBe('Domingo');
  });

  it('deve retornar vazio para input inválido', () => {
    expect(getDayOfWeek('')).toBe('');
  });

  it('deve retornar vazio para null', () => {
    expect(getDayOfWeek(null)).toBe('');
  });
});

// ────────────── getMonthName ──────────────
describe('getMonthName', () => {
  it('deve retornar Janeiro para 1', () => {
    expect(getMonthName(1)).toBe('Janeiro');
  });

  it('deve retornar Dezembro para 12', () => {
    expect(getMonthName(12)).toBe('Dezembro');
  });

  it('deve retornar Abril para 4', () => {
    expect(getMonthName(4)).toBe('Abril');
  });

  it('deve retornar vazio para 0', () => {
    expect(getMonthName(0)).toBe('');
  });

  it('deve retornar vazio para 13', () => {
    expect(getMonthName(13)).toBe('');
  });

  it('deve retornar vazio para string', () => {
    expect(getMonthName('abril')).toBe('');
  });
});

// ────────────── generateCalendarDays ──────────────
describe('generateCalendarDays', () => {
  it('deve gerar 42 dias (6 semanas)', () => {
    const days = generateCalendarDays(2026, 4);
    expect(days).toHaveLength(42);
  });

  it('deve ter dias do mês atual marcados', () => {
    const days = generateCalendarDays(2026, 4);
    const currentMonthDays = days.filter((d) => d.isCurrentMonth);
    expect(currentMonthDays).toHaveLength(30); // Abril tem 30 dias
  });

  it('deve gerar 28 dias para Fevereiro não-bissexto', () => {
    const days = generateCalendarDays(2026, 2);
    const febDays = days.filter((d) => d.isCurrentMonth);
    expect(febDays).toHaveLength(28);
  });

  it('deve retornar array vazio para mês inválido', () => {
    expect(generateCalendarDays(2026, 0)).toEqual([]);
    expect(generateCalendarDays(2026, 13)).toEqual([]);
  });

  it('deve retornar array vazio para tipo inválido', () => {
    expect(generateCalendarDays('2026', 4)).toEqual([]);
  });
});

// ────────────── generateTimeSlots ──────────────
describe('generateTimeSlots', () => {
  it('deve gerar slots de 30 minutos entre 08:00 e 12:00', () => {
    const slots = generateTimeSlots('08:00', '12:00', 30);
    expect(slots).toHaveLength(8);
    expect(slots[0]).toBe('08:00');
    expect(slots[1]).toBe('08:30');
    expect(slots[7]).toBe('11:30');
  });

  it('deve gerar slots de 60 minutos', () => {
    const slots = generateTimeSlots('09:00', '17:00', 60);
    expect(slots).toHaveLength(8);
    expect(slots[0]).toBe('09:00');
    expect(slots[7]).toBe('16:00');
  });

  it('deve retornar vazio para intervalo inválido', () => {
    expect(generateTimeSlots('08:00', '12:00', 0)).toEqual([]);
    expect(generateTimeSlots('08:00', '12:00', -30)).toEqual([]);
  });

  it('deve retornar vazio se início >= fim', () => {
    expect(generateTimeSlots('12:00', '08:00', 30)).toEqual([]);
  });

  it('deve retornar vazio se input faltando', () => {
    expect(generateTimeSlots(null, '12:00', 30)).toEqual([]);
  });
});
