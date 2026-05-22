import { describe, expect, it } from 'vitest';
import type { Allocation, TaskTransfer } from '@/types';
import {
  getAllocationTransferUiState,
  isSenderTransferShell,
  shouldShowWeeklyBadge,
} from './allocationTransferUtils';

const baseAlloc = (overrides: Partial<Allocation> = {}): Allocation => ({
  id: 'alloc-1',
  employeeId: 'emp-sender',
  projectId: 'proj-1',
  weekStartDate: '2026-05-18',
  hoursAssigned: 4,
  status: 'planned',
  ...overrides,
});

const pendingTransfer: TaskTransfer = {
  id: 'tr-1',
  allocationId: 'alloc-1',
  fromEmployeeId: 'emp-sender',
  toEmployeeId: 'emp-receiver',
  status: 'pending',
  hours: 4,
  hoursTransferred: 4,
  requestedAt: '2026-05-20T10:00:00Z',
  agencyId: 'agency-1',
};

describe('allocationTransferUtils', () => {
  it('bloquea edición con transferencia pendiente', () => {
    const ui = getAllocationTransferUiState(
      baseAlloc(),
      'emp-sender',
      [pendingTransfer],
      []
    );
    expect(ui.isReadOnly).toBe(true);
    expect(ui.showTransferBadge).toBe(true);
    expect(ui.showWeeklyBadge).toBe(false);
  });

  it('detecta cascarón del emisor tras distribute aceptado', () => {
    const accepted: TaskTransfer = {
      ...pendingTransfer,
      status: 'accepted',
      acceptanceMode: 'distribute',
      respondedAt: '2026-05-20T11:00:00Z',
    };
    const alloc = baseAlloc({
      hoursAssigned: 0,
      isLocked: true,
      originalTransferredTaskName: 'Diseño landing',
      transferSourceEmployeeId: 'emp-sender',
    });
    expect(
      isSenderTransferShell(alloc, 'emp-sender', [accepted])
    ).toBe(true);
    const ui = getAllocationTransferUiState(alloc, 'emp-sender', [accepted], []);
    expect(ui.isReadOnly).toBe(true);
    expect(ui.showTransferBadge).toBe(true);
    expect(shouldShowWeeklyBadge(alloc, 'emp-sender', [])).toBe(false);
  });

  it('muestra badge Weekly solo con feedback weekly', () => {
    const alloc = baseAlloc({ hoursAssigned: 0, hoursActual: 0, hoursComputed: 0, status: 'completed' });
    expect(shouldShowWeeklyBadge(alloc, 'emp-sender', [{ allocationId: 'alloc-1' } as never])).toBe(true);
  });
});
