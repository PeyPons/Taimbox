import { describe, expect, it } from 'vitest';
import { presentRoas } from '@/utils/adsPerformance';
import { repairUtf8Mojibake } from '@/utils/repairUtf8Mojibake';

describe('repairUtf8Mojibake', () => {
  it('recupera tildes guardadas como Latin-1', () => {
    const broken = 'IG-Org\u00C3\u00A1nico-Interacci\u00C3\u00B3n';
    expect(repairUtf8Mojibake(broken)).toBe('IG-Orgánico-Interacción');
  });

  it('no toca texto que ya está bien', () => {
    expect(repairUtf8Mojibake('Campaña Alcance Brunelli\'s')).toBe('Campaña Alcance Brunelli\'s');
    expect(repairUtf8Mojibake('TRÁFICO')).toBe('TRÁFICO');
  });
});

describe('presentRoas', () => {
  it('oculta el ROAS si la cuenta no es de ventas', () => {
    expect(presentRoas({ isSales: false, cost: 100, conversionValue: 400 })).toEqual({ kind: 'hidden' });
  });

  it('no pinta un 0 cuando no hay valor de conversión', () => {
    expect(presentRoas({ isSales: true, cost: 95.54, conversionValue: 0 })).toEqual({ kind: 'empty' });
    expect(presentRoas({ isSales: true, cost: 0, conversionValue: 0 })).toEqual({ kind: 'empty' });
  });

  it('calcula el ROAS cuando hay gasto y valor', () => {
    expect(presentRoas({ isSales: true, cost: 100, conversionValue: 250 })).toEqual({ kind: 'value', roas: 2.5 });
  });
});
