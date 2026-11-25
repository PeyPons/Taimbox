import { describe, expect, it } from 'vitest';
import type { AgentAction } from '@/types/agentActions';
import { attributeAgentActions, isImputableLeaf } from '@/utils/agentActionAttribution';

function action(partial: Partial<AgentAction> & Pick<AgentAction, 'id' | 'category' | 'startedAt'>): AgentAction {
  return {
    agencyId: 'agency',
    parentId: null,
    rootId: partial.parentId ? 'root' : partial.id,
    depth: partial.parentId ? 1 : 0,
    externalId: partial.id,
    employeeId: 'alex',
    clientId: null,
    projectId: null,
    allocationId: null,
    tool: 'codex',
    status: 'completed',
    attention: 'shared',
    workMode: 'cliente',
    matchStatus: partial.category === 'client_work' ? 'matched' : 'not_required',
    title: partial.id,
    outcome: null,
    clientLabel: null,
    projectLabel: null,
    employeeLabel: 'Alex',
    clientTier: null,
    historyRef: null,
    finishedAt: null,
    reportedMinutes: null,
    channel: null,
    ...partial,
  };
}

const range = {
  start: new Date('2026-11-25T00:00:00Z'),
  end: new Date('2026-11-26T00:00:00Z'),
  now: new Date('2026-11-25T12:00:00Z'),
};

describe('attributeAgentActions', () => {
  it('no imputa la petición encima del trabajo de cliente', () => {
    const actions = [
      action({
        id: 'root',
        category: 'intake',
        startedAt: '2026-11-25T09:00:00Z',
        finishedAt: '2026-11-25T10:00:00Z',
      }),
      action({
        id: 'ads',
        parentId: 'root',
        category: 'client_work',
        clientId: 'avioa',
        clientLabel: 'Avioa',
        channel: 'google_ads',
        startedAt: '2026-11-25T09:00:00Z',
        finishedAt: '2026-11-25T10:00:00Z',
      }),
    ];
    const result = attributeAgentActions(actions, range);
    expect(result.byAction.get('root')?.imputable).toBe(false);
    expect(result.byAction.get('ads')?.imputableMinutes).toBeCloseTo(60);
    expect(result.totals.imputableMinutes).toBeCloseTo(60);
    expect(result.totals.wallMinutes).toBeCloseTo(60);
    expect(result.byClient[0]?.label).toBe('Avioa');
  });

  it('reparte el solape entre clientes y deja fuera la lectura que no es trabajo', () => {
    const actions = [
      action({
        id: 'root',
        category: 'intake',
        title: 'Revisa el Hangout de Pablo',
        startedAt: '2026-11-25T09:00:00Z',
        finishedAt: '2026-11-25T09:40:00Z',
      }),
      action({
        id: 'avioa-ads',
        parentId: 'root',
        category: 'client_work',
        clientId: 'avioa',
        clientLabel: 'Avioa',
        channel: 'google_ads',
        startedAt: '2026-11-25T09:10:00Z',
        finishedAt: '2026-11-25T09:25:00Z',
      }),
      action({
        id: 'avioa-mail',
        parentId: 'root',
        category: 'client_work',
        clientId: 'avioa',
        clientLabel: 'Avioa',
        channel: 'email',
        startedAt: '2026-11-25T09:25:00Z',
        finishedAt: '2026-11-25T09:35:00Z',
      }),
      action({
        id: 'otro',
        category: 'client_work',
        clientId: 'otro',
        clientLabel: 'Otro',
        channel: 'seo',
        startedAt: '2026-11-25T09:10:00Z',
        finishedAt: '2026-11-25T09:30:00Z',
      }),
    ];
    const result = attributeAgentActions(actions, range);
    const avioa = result.byClient.find((row) => row.clientId === 'avioa');
    const otro = result.byClient.find((row) => row.clientId === 'otro');
    expect(avioa?.imputableMinutes).toBeCloseTo(15);
    expect(otro?.imputableMinutes).toBeCloseTo(10);
    expect(result.totals.wallMinutes).toBeCloseTo(40);
    expect(result.totals.imputableMinutes).toBeCloseTo(25);
    expect(result.totals.unattributedMinutes).toBeCloseTo(15);
    expect(result.totals.presenceMinutes).toBeCloseTo(45);
    expect(result.byEmployee[0]?.peakParallel).toBe(2);
  });

  it('no imputa un trabajo de cliente si el nombre no resolvió a un único cliente', () => {
    const unmatched = action({
      id: 'loose',
      category: 'client_work',
      matchStatus: 'unmatched',
      clientId: null,
      clientLabel: 'Avio',
      startedAt: '2026-11-25T09:00:00Z',
      finishedAt: '2026-11-25T09:20:00Z',
    });
    const result = attributeAgentActions([unmatched], range);
    expect(isImputableLeaf(unmatched, new Map())).toBe(false);
    expect(result.totals.imputableMinutes).toBe(0);
    expect(result.totals.wallMinutes).toBeCloseTo(20);
    expect(result.totals.unattributedMinutes).toBeCloseTo(20);
  });

  it('una acción exclusiva se queda el tramo y la compartida no suma otra vez', () => {
    const actions = [
      action({
        id: 'ex',
        category: 'client_work',
        attention: 'exclusive',
        clientId: 'a',
        clientLabel: 'A',
        startedAt: '2026-11-25T09:00:00Z',
        finishedAt: '2026-11-25T10:00:00Z',
      }),
      action({
        id: 'sh',
        category: 'client_work',
        attention: 'shared',
        clientId: 'b',
        clientLabel: 'B',
        startedAt: '2026-11-25T09:00:00Z',
        finishedAt: '2026-11-25T10:00:00Z',
      }),
    ];
    const result = attributeAgentActions(actions, range);
    expect(result.byAction.get('ex')?.imputableMinutes).toBeCloseTo(60);
    expect(result.byAction.get('sh')?.imputableMinutes).toBeCloseTo(0);
    expect(result.totals.wallMinutes).toBeCloseTo(60);
  });

  it('las gestiones internas no caen en un cliente y el ruido no alarga el reloj', () => {
    const actions = [
      action({
        id: 'rrhh',
        category: 'internal',
        channel: 'internal',
        startedAt: '2026-11-25T08:00:00Z',
        finishedAt: '2026-11-25T08:30:00Z',
      }),
      action({
        id: 'noise',
        category: 'noise',
        startedAt: '2026-11-25T08:00:00Z',
        finishedAt: '2026-11-25T12:00:00Z',
      }),
    ];
    const result = attributeAgentActions(actions, range);
    expect(result.byClient.map((row) => row.label)).toEqual(['Gestiones internas']);
    expect(result.totals.wallMinutes).toBeCloseTo(30);
    expect(result.totals.imputableMinutes).toBeCloseTo(30);
  });

  it('no mezcla el reloj de dos personas', () => {
    const actions = [
      action({
        id: 'a',
        employeeId: 'one',
        employeeLabel: 'Uno',
        category: 'client_work',
        clientId: 'c',
        clientLabel: 'C',
        startedAt: '2026-11-25T09:00:00Z',
        finishedAt: '2026-11-25T10:00:00Z',
      }),
      action({
        id: 'b',
        employeeId: 'two',
        employeeLabel: 'Dos',
        category: 'client_work',
        clientId: 'c',
        clientLabel: 'C',
        startedAt: '2026-11-25T09:00:00Z',
        finishedAt: '2026-11-25T10:00:00Z',
      }),
    ];
    const result = attributeAgentActions(actions, range);
    expect(result.totals.imputableMinutes).toBeCloseTo(120);
    expect(result.byEmployee).toHaveLength(2);
    expect(result.byClient[0]?.imputableMinutes).toBeCloseTo(120);
  });
});
