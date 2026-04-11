import { describe, it, expect } from 'vitest';
import {
  isValidEmail,
  isValidPhone,
  isValidName,
  isValidPassword,
  isValidCity,
  isValidDateStr,
  isDateNotInPast,
  isValidTimeRange,
  sanitizeInput,
} from '../src/js/utils/validators.js';

// ────────────── isValidEmail ──────────────
describe('isValidEmail', () => {
  it('deve aceitar e-mail válido simples', () => {
    expect(isValidEmail('usuario@email.com')).toBe(true);
  });

  it('deve aceitar e-mail com subdomínio', () => {
    expect(isValidEmail('user@mail.empresa.com.br')).toBe(true);
  });

  it('deve aceitar e-mail com espaços ao redor (trim)', () => {
    expect(isValidEmail('  user@email.com  ')).toBe(true);
  });

  it('deve rejeitar e-mail sem @', () => {
    expect(isValidEmail('useremail.com')).toBe(false);
  });

  it('deve rejeitar e-mail sem domínio', () => {
    expect(isValidEmail('user@')).toBe(false);
  });

  it('deve rejeitar string vazia', () => {
    expect(isValidEmail('')).toBe(false);
  });

  it('deve rejeitar null', () => {
    expect(isValidEmail(null)).toBe(false);
  });

  it('deve rejeitar undefined', () => {
    expect(isValidEmail(undefined)).toBe(false);
  });

  it('deve rejeitar número', () => {
    expect(isValidEmail(12345)).toBe(false);
  });
});

// ────────────── isValidPhone ──────────────
describe('isValidPhone', () => {
  it('deve aceitar telefone com máscara (11 dígitos)', () => {
    expect(isValidPhone('(11) 99999-9999')).toBe(true);
  });

  it('deve aceitar telefone sem máscara (11 dígitos)', () => {
    expect(isValidPhone('11999999999')).toBe(true);
  });

  it('deve aceitar telefone fixo (10 dígitos)', () => {
    expect(isValidPhone('(11) 3333-4444')).toBe(true);
  });

  it('deve aceitar telefone com +55', () => {
    expect(isValidPhone('+5511999999999')).toBe(true);
  });

  it('deve rejeitar telefone com poucos dígitos', () => {
    expect(isValidPhone('1234')).toBe(false);
  });

  it('deve rejeitar null', () => {
    expect(isValidPhone(null)).toBe(false);
  });

  it('deve rejeitar string vazia', () => {
    expect(isValidPhone('')).toBe(false);
  });
});

// ────────────── isValidName ──────────────
describe('isValidName', () => {
  it('deve aceitar nome completo', () => {
    expect(isValidName('Gabriel Sanches')).toBe(true);
  });

  it('deve aceitar nome com 3 partes', () => {
    expect(isValidName('Higo da Silva')).toBe(true);
  });

  it('deve rejeitar nome com apenas uma palavra', () => {
    expect(isValidName('Gabriel')).toBe(false);
  });

  it('deve rejeitar string com menos de 3 caracteres', () => {
    expect(isValidName('ab')).toBe(false);
  });

  it('deve rejeitar string vazia', () => {
    expect(isValidName('')).toBe(false);
  });

  it('deve rejeitar null', () => {
    expect(isValidName(null)).toBe(false);
  });
});

// ────────────── isValidPassword ──────────────
describe('isValidPassword', () => {
  it('deve aceitar senha com 6 caracteres', () => {
    expect(isValidPassword('123456')).toBe(true);
  });

  it('deve aceitar senha longa', () => {
    expect(isValidPassword('senhaForte@2026!')).toBe(true);
  });

  it('deve rejeitar senha com menos de 6 caracteres', () => {
    expect(isValidPassword('12345')).toBe(false);
  });

  it('deve rejeitar string vazia', () => {
    expect(isValidPassword('')).toBe(false);
  });

  it('deve rejeitar null', () => {
    expect(isValidPassword(null)).toBe(false);
  });
});

// ────────────── isValidCity ──────────────
describe('isValidCity', () => {
  it('deve aceitar cidade válida', () => {
    expect(isValidCity('São Paulo')).toBe(true);
  });

  it('deve aceitar cidade com acento', () => {
    expect(isValidCity('Goiânia')).toBe(true);
  });

  it('deve aceitar cidade com hífen', () => {
    expect(isValidCity("Ribeirão-Preto")).toBe(true);
  });

  it('deve rejeitar cidade com números', () => {
    expect(isValidCity('Cidade 123')).toBe(false);
  });

  it('deve rejeitar string muito curta', () => {
    expect(isValidCity('A')).toBe(false);
  });

  it('deve rejeitar string vazia', () => {
    expect(isValidCity('')).toBe(false);
  });
});

// ────────────── isValidDateStr ──────────────
describe('isValidDateStr', () => {
  it('deve aceitar data válida', () => {
    expect(isValidDateStr('2026-04-15')).toBe(true);
  });

  it('deve aceitar data limite de mês', () => {
    expect(isValidDateStr('2026-01-31')).toBe(true);
  });

  it('deve rejeitar formato inválido', () => {
    expect(isValidDateStr('15/04/2026')).toBe(false);
  });

  it('deve rejeitar string aleatória', () => {
    expect(isValidDateStr('abc')).toBe(false);
  });

  it('deve rejeitar null', () => {
    expect(isValidDateStr(null)).toBe(false);
  });
});

// ────────────── isDateNotInPast ──────────────
describe('isDateNotInPast', () => {
  it('deve aceitar data futura', () => {
    expect(isDateNotInPast('2099-12-31')).toBe(true);
  });

  it('deve rejeitar data passada', () => {
    expect(isDateNotInPast('2020-01-01')).toBe(false);
  });

  it('deve rejeitar data inválida', () => {
    expect(isDateNotInPast('invalid')).toBe(false);
  });
});

// ────────────── isValidTimeRange ──────────────
describe('isValidTimeRange', () => {
  it('deve aceitar range válido', () => {
    expect(isValidTimeRange('08:00', '12:00')).toBe(true);
  });

  it('deve aceitar range de 1 minuto', () => {
    expect(isValidTimeRange('08:00', '08:01')).toBe(true);
  });

  it('deve rejeitar início igual ao fim', () => {
    expect(isValidTimeRange('08:00', '08:00')).toBe(false);
  });

  it('deve rejeitar início depois do fim', () => {
    expect(isValidTimeRange('12:00', '08:00')).toBe(false);
  });

  it('deve rejeitar formato inválido', () => {
    expect(isValidTimeRange('8h', '12h')).toBe(false);
  });

  it('deve rejeitar null', () => {
    expect(isValidTimeRange(null, '12:00')).toBe(false);
  });
});

// ────────────── sanitizeInput ──────────────
describe('sanitizeInput', () => {
  it('deve escapar tags HTML', () => {
    expect(sanitizeInput('<script>alert("xss")</script>')).toBe(
      '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
    );
  });

  it('deve escapar aspas simples', () => {
    expect(sanitizeInput("test'value")).toBe("test&#x27;value");
  });

  it('deve fazer trim', () => {
    expect(sanitizeInput('  hello  ')).toBe('hello');
  });

  it('deve retornar string vazia para null', () => {
    expect(sanitizeInput(null)).toBe('');
  });

  it('deve retornar string vazia para undefined', () => {
    expect(sanitizeInput(undefined)).toBe('');
  });

  it('deve retornar string vazia para número', () => {
    expect(sanitizeInput(123)).toBe('');
  });
});
