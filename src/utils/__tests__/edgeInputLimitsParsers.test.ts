/**
 * Parsers compartidos por Edge Functions (validación de entrada en servidor).
 * Import relativos desde tests para no duplicar lógica en el bundle de la app.
 */
import { describe, expect, it } from 'vitest';
import { INPUT_LIMITS as EDGE_INPUT_LIMITS, parseBoundedString, parseEmail, parseOptionalBoundedString, parsePassword } from '../../../supabase/functions/_shared/input-limits';
import { INPUT_LIMITS as APP_INPUT_LIMITS } from '@/constants/inputLimits';

describe('edge input-limits parsers', () => {
  it('INPUT_LIMITS coincide con el módulo del frontend (evita desvío deploy)', () => {
    expect(APP_INPUT_LIMITS).toEqual(EDGE_INPUT_LIMITS);
  });

  describe('parseBoundedString', () => {
    it('rechaza no-string y cadena vacía tras trim', () => {
      expect(() => parseBoundedString(1, { max: 10, fieldName: 'Nombre' })).toThrow('Nombre inválido.');
      expect(() => parseBoundedString('   ', { max: 10, fieldName: 'Nombre' })).toThrow('Nombre es obligatorio.');
    });

    it('rechaza longitud por encima del máximo', () => {
      expect(() => parseBoundedString('abcde', { max: 4, fieldName: 'Código' })).toThrow('supera el máximo de 4 caracteres');
    });

    it('devuelve el string recortado', () => {
      expect(parseBoundedString('  ok  ', { max: 10, fieldName: 'X' })).toBe('ok');
    });
  });

  describe('parseOptionalBoundedString', () => {
    it('acepta null, cadena vacía y solo espacios como vacío', () => {
      expect(parseOptionalBoundedString(null, { max: 5, fieldName: 'Nota' })).toBe('');
      expect(parseOptionalBoundedString('', { max: 5, fieldName: 'Nota' })).toBe('');
      expect(parseOptionalBoundedString('   ', { max: 5, fieldName: 'Nota' })).toBe('');
    });

    it('rechaza tipos no string cuando hay valor', () => {
      expect(() => parseOptionalBoundedString(99, { max: 5, fieldName: 'Nota' })).toThrow('Nota inválido.');
    });
  });

  describe('parseEmail', () => {
    it('normaliza a minúsculas y valida formato básico', () => {
      expect(parseEmail('  User@EXAMPLE.com ')).toBe('user@example.com');
    });

    it('rechaza email sin dominio válido', () => {
      expect(() => parseEmail('sin-arroba')).toThrow('Email inválido.');
    });
  });

  describe('parsePassword', () => {
    it('exige mínimo 6 caracteres y máximo según INPUT_LIMITS', () => {
      expect(() => parsePassword('12345')).toThrow('al menos 6');
      const long = 'a'.repeat(EDGE_INPUT_LIMITS.password + 1);
      expect(() => parsePassword(long)).toThrow(`máximo de ${EDGE_INPUT_LIMITS.password}`);
    });

    it('acepta contraseña dentro de rango', () => {
      expect(parsePassword('secreto')).toBe('secreto');
    });
  });
});
