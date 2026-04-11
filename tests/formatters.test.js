import { describe, it, expect } from 'vitest';
import {
  formatPhone,
  formatStatus,
  formatRole,
  truncateText,
  capitalizeWords,
  generateInitials,
  getStatusColor,
  formatCount,
} from '../src/js/utils/formatters.js';

// ────────────── formatPhone ──────────────
describe('formatPhone', () => {
  it('deve formatar celular com 11 dígitos', () => {
    expect(formatPhone('11999998888')).toBe('(11) 99999-8888');
  });

  it('deve formatar fixo com 10 dígitos', () => {
    expect(formatPhone('1133334444')).toBe('(11) 3333-4444');
  });

  it('deve retornar original se não tem 10 ou 11 dígitos', () => {
    expect(formatPhone('1234')).toBe('1234');
  });

  it('deve retornar vazio para null', () => {
    expect(formatPhone(null)).toBe('');
  });

  it('deve retornar vazio para string vazia', () => {
    expect(formatPhone('')).toBe('');
  });
});

// ────────────── formatStatus ──────────────
describe('formatStatus', () => {
  it('deve traduzir pending', () => {
    expect(formatStatus('pending')).toBe('Pendente');
  });

  it('deve traduzir confirmed', () => {
    expect(formatStatus('confirmed')).toBe('Confirmado');
  });

  it('deve traduzir cancelled', () => {
    expect(formatStatus('cancelled')).toBe('Cancelado');
  });

  it('deve traduzir completed', () => {
    expect(formatStatus('completed')).toBe('Concluído');
  });

  it('deve ser case-insensitive', () => {
    expect(formatStatus('PENDING')).toBe('Pendente');
  });

  it('deve retornar original para status desconhecido', () => {
    expect(formatStatus('other')).toBe('other');
  });

  it('deve retornar vazio para null', () => {
    expect(formatStatus(null)).toBe('');
  });
});

// ────────────── formatRole ──────────────
describe('formatRole', () => {
  it('deve traduzir developer', () => {
    expect(formatRole('developer')).toBe('Desenvolvedor');
  });

  it('deve traduzir establishment', () => {
    expect(formatRole('establishment')).toBe('Estabelecimento');
  });

  it('deve traduzir visitor', () => {
    expect(formatRole('visitor')).toBe('Visitante');
  });

  it('deve ser case-insensitive', () => {
    expect(formatRole('DEVELOPER')).toBe('Desenvolvedor');
  });

  it('deve retornar vazio para null', () => {
    expect(formatRole(null)).toBe('');
  });
});

// ────────────── truncateText ──────────────
describe('truncateText', () => {
  it('deve truncar texto longo', () => {
    expect(truncateText('Um texto muito longo para caber', 15)).toBe('Um texto mui...');
  });

  it('deve manter texto curto intacto', () => {
    expect(truncateText('Curto', 10)).toBe('Curto');
  });

  it('deve manter texto exatamente no limite', () => {
    expect(truncateText('12345', 5)).toBe('12345');
  });

  it('deve retornar vazio para null', () => {
    expect(truncateText(null, 10)).toBe('');
  });

  it('deve retornar vazio para maxLength 0', () => {
    expect(truncateText('Hello', 0)).toBe('');
  });
});

// ────────────── capitalizeWords ──────────────
describe('capitalizeWords', () => {
  it('deve capitalizar cada palavra', () => {
    expect(capitalizeWords('gabriel sanches')).toBe('Gabriel Sanches');
  });

  it('deve funcionar com texto já capitalizado', () => {
    expect(capitalizeWords('GABRIEL SANCHES')).toBe('Gabriel Sanches');
  });

  it('deve lidar com espaços extras', () => {
    expect(capitalizeWords('  hello   world  ')).toBe('Hello World');
  });

  it('deve retornar vazio para null', () => {
    expect(capitalizeWords(null)).toBe('');
  });
});

// ────────────── generateInitials ──────────────
describe('generateInitials', () => {
  it('deve gerar iniciais de nome completo', () => {
    expect(generateInitials('Gabriel Sanches')).toBe('GS');
  });

  it('deve usar primeira e última palavra', () => {
    expect(generateInitials('Higo da Silva Monteiro')).toBe('HM');
  });

  it('deve gerar 1 inicial para nome simples', () => {
    expect(generateInitials('Gabriel')).toBe('G');
  });

  it('deve retornar vazio para string vazia', () => {
    expect(generateInitials('')).toBe('');
  });

  it('deve retornar vazio para null', () => {
    expect(generateInitials(null)).toBe('');
  });
});

// ────────────── getStatusColor ──────────────
describe('getStatusColor', () => {
  it('deve retornar classe para pending', () => {
    expect(getStatusColor('pending')).toBe('status-pending');
  });

  it('deve retornar classe para confirmed', () => {
    expect(getStatusColor('confirmed')).toBe('status-confirmed');
  });

  it('deve retornar default para desconhecido', () => {
    expect(getStatusColor('other')).toBe('status-default');
  });

  it('deve retornar default para null', () => {
    expect(getStatusColor(null)).toBe('status-default');
  });
});

// ────────────── formatCount ──────────────
describe('formatCount', () => {
  it('deve usar singular para 1', () => {
    expect(formatCount(1, 'agendamento', 'agendamentos')).toBe('1 agendamento');
  });

  it('deve usar plural para 0', () => {
    expect(formatCount(0, 'agendamento', 'agendamentos')).toBe('0 agendamentos');
  });

  it('deve usar plural para 5', () => {
    expect(formatCount(5, 'horário', 'horários')).toBe('5 horários');
  });

  it('deve retornar vazio para tipo errado', () => {
    expect(formatCount('five', 'a', 'b')).toBe('');
  });
});
