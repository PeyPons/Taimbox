import { describe, expect, it } from 'vitest';
import { formatDeadlineHoursForDisplay, roundDeadlineHours } from '@/utils/deadlineUtils';

describe('deadline hours display', () => {
  it('redondea errores de coma flotante', () => {
    expect(roundDeadlineHours(11.599999999999998)).toBe(11.6);
    expect(formatDeadlineHoursForDisplay(93.19999999999996)).toBe('93.2');
  });

  it('omite decimal .0 en enteros', () => {
    expect(formatDeadlineHoursForDisplay(10)).toBe('10');
  });
});
