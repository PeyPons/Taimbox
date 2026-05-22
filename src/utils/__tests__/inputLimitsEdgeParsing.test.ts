import { describe, it, expect } from 'vitest';
import {
  INPUT_LIMITS,
  parseBoundedString,
  parseOptionalBoundedString,
  parseEmail,
  parsePassword,
} from '../../../supabase/functions/_shared/input-limits';

describe('parseBoundedString (Edge shared)', () => {
  it('rechaza no-string y longitud fuera de rango', () => {
    expect(() => parseBoundedString(1 as unknown as string, { max: 10, fieldName: 'Campo' })).toThrow(/inválido/);
    expect(() => parseBoundedString('   ', { max: 10, fieldName: 'Campo' })).toThrow(/obligatorio/);
    expect(() => parseBoundedString('abcdefghijk', { max: 10, fieldName: 'Campo' })).toThrow(/máximo de 10/);
  });

  it('devuelve el string recortado cuando es válido', () => {
    expect(parseBoundedString('  hola  ', { max: 10, fieldName: 'Campo' })).toBe('hola');
  });
});

describe('parseOptionalBoundedString', () => {
  it('null, vacío o solo espacios devuelven cadena vacía', () => {
    expect(parseOptionalBoundedString(null, { max: 5, fieldName: 'X' })).toBe('');
    expect(parseOptionalBoundedString('', { max: 5, fieldName: 'X' })).toBe('');
    expect(parseOptionalBoundedString('   ', { max: 5, fieldName: 'X' })).toBe('');
  });

  it('respeta el máximo tras trim', () => {
    expect(() => parseOptionalBoundedString('  123456  ', { max: 5, fieldName: 'X' })).toThrow(/máximo de 5/);
  });
});

describe('parseEmail', () => {
  it('valida formato y longitud máxima de email', () => {
    expect(parseEmail('  User@Example.COM  ')).toBe('user@example.com');
    expect(() => parseEmail('no-arroba')).toThrow(/inválido/);
    const longLocal = `${'a'.repeat(250)}@x.co`;
    expect(longLocal.length).toBeGreaterThan(INPUT_LIMITS.email);
    expect(() => parseEmail(longLocal)).toThrow(/máximo/);
  });
});

describe('parsePassword', () => {
  it('longitud mínima 6 y máxima según INPUT_LIMITS', () => {
    expect(() => parsePassword('12345')).toThrow(/6 caracteres/);
    const tooLong = 'a'.repeat(INPUT_LIMITS.password + 1);
    expect(() => parsePassword(tooLong)).toThrow(new RegExp(String(INPUT_LIMITS.password)));
    expect(parsePassword('abcdef')).toBe('abcdef');
  });
});
