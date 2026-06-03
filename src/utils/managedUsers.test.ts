import { describe, it, expect } from 'vitest';
import { countManagedUsers, isManagedUser } from './managedUsers';
import type { Employee } from '@/types';

const base = (overrides: Partial<Employee>): Employee => ({
  id: '1',
  agencyId: 'a',
  name: 'Ana',
  role: 'Consultor',
  defaultWeeklyCapacity: 40,
  workSchedule: { monday: 8, tuesday: 8, wednesday: 8, thursday: 8, friday: 8, saturday: 0, sunday: 0 },
  isActive: true,
  ...overrides,
});

describe('managedUsers', () => {
  it('excluye inactivos y placeholders', () => {
    const employees = [
      base({}),
      base({ id: '2', isActive: false }),
      base({ id: '3', name: 'Placeholder vacante' }),
      base({ id: '4', role: 'Soporte' }),
    ];
    expect(countManagedUsers(employees)).toBe(1);
    expect(isManagedUser(base({ name: '[vacante] Dev' }))).toBe(false);
  });
});
