import type { AgentAction, AgentActionCategory, AgentAttention } from '@/types/agentActions';

const MS_PER_MINUTE = 60_000;

export interface AttributionRange {
  start: Date;
  end: Date;
  now?: Date;
}

export interface ActionAttribution {
  imputableMinutes: number;
  presenceMinutes: number;
  imputable: boolean;
}

export interface ClientAttribution {
  clientKey: string;
  clientId: string | null;
  label: string;
  imputableMinutes: number;
  presenceMinutes: number;
  actionCount: number;
}

export interface EmployeeAttribution {
  employeeKey: string;
  employeeId: string | null;
  label: string;
  wallMinutes: number;
  imputableMinutes: number;
  unattributedMinutes: number;
  presenceMinutes: number;
  peakParallel: number;
}

export interface AttributionResult {
  byAction: Map<string, ActionAttribution>;
  byEmployee: EmployeeAttribution[];
  byClient: ClientAttribution[];
  totals: {
    wallMinutes: number;
    imputableMinutes: number;
    unattributedMinutes: number;
    presenceMinutes: number;
    peakParallel: number;
  };
}

interface Clip {
  action: AgentAction;
  start: number;
  end: number;
}

function employeeKey(action: AgentAction): string {
  return action.employeeId ?? `label:${(action.employeeLabel ?? 'sin-persona').trim().toLowerCase()}`;
}

function employeeLabel(action: AgentAction): string {
  return action.employeeLabel?.trim() || 'Sin persona';
}

export function clientKeyFor(action: AgentAction): string {
  if (action.category === 'internal') return 'internal';
  if (action.clientId) return action.clientId;
  return `label:${(action.clientLabel ?? 'sin-cliente').trim().toLowerCase()}`;
}

function clientLabelFor(action: AgentAction): string {
  if (action.category === 'internal' && !action.clientId) return 'Gestiones internas';
  return action.clientLabel?.trim() || 'Sin cliente';
}

function childrenByParent(actions: AgentAction[]): Map<string, AgentAction[]> {
  const map = new Map<string, AgentAction[]>();
  for (const action of actions) {
    if (!action.parentId) continue;
    const list = map.get(action.parentId) ?? [];
    list.push(action);
    map.set(action.parentId, list);
  }
  return map;
}

/** El nodo lleva tiempo propio si es trabajo de cliente resuelto o una gestión interna cerrada o en curso. */
export function carriesClientOrInternalTime(action: AgentAction): boolean {
  if (action.status === 'cancelled' || action.category === 'noise') return false;
  if (action.category === 'internal') return true;
  if (action.category !== 'client_work') return false;
  return action.matchStatus === 'matched' && Boolean(action.clientId);
}

function hasTimeCarryingDescendant(id: string, byParent: Map<string, AgentAction[]>): boolean {
  for (const child of byParent.get(id) ?? []) {
    if (carriesClientOrInternalTime(child) || hasTimeCarryingDescendant(child.id, byParent)) return true;
  }
  return false;
}

/**
 * Hoja imputable: trabajo de cliente con cliente único, o gestión interna,
 * siempre que un hijo no lleve ya ese tiempo. La petición y la detección no se suman encima.
 */
export function isImputableLeaf(action: AgentAction, byParent: Map<string, AgentAction[]>): boolean {
  if (!carriesClientOrInternalTime(action)) return false;
  return !hasTimeCarryingDescendant(action.id, byParent);
}

function intervalEnd(action: AgentAction, range: AttributionRange): number | null {
  const rangeEnd = range.end.getTime();
  const now = (range.now ?? new Date()).getTime();
  if (action.finishedAt) return Math.min(new Date(action.finishedAt).getTime(), rangeEnd);
  if (action.status === 'requested' || action.status === 'in_progress') return Math.min(now, rangeEnd);
  return null;
}

function clipAction(action: AgentAction, range: AttributionRange): Clip | null {
  if (action.status === 'cancelled' || action.category === 'noise') return null;
  const start = Math.max(new Date(action.startedAt).getTime(), range.start.getTime());
  const end = intervalEnd(action, range);
  if (end == null || end <= start) return null;
  return { action, start, end };
}

function distribute(sliceMs: number, active: AgentAction[], into: Map<string, number>): void {
  if (sliceMs <= 0 || active.length === 0) return;
  const exclusive = active.filter((action) => action.attention === 'exclusive');
  const shared = active.filter((action) => action.attention === 'shared');
  const receivers = exclusive.length > 0 ? exclusive : shared;
  if (receivers.length === 0) return;
  const share = sliceMs / receivers.length;
  for (const action of receivers) {
    into.set(action.id, (into.get(action.id) ?? 0) + share);
  }
}

function sweepImputable(clips: Clip[]): { minutes: Map<string, number>; peak: Map<string, number> } {
  const minutes = new Map<string, number>();
  const peak = new Map<string, number>();
  const byEmployee = new Map<string, Clip[]>();
  for (const clip of clips) {
    const key = employeeKey(clip.action);
    const list = byEmployee.get(key) ?? [];
    list.push(clip);
    byEmployee.set(key, list);
  }

  for (const [key, employeeClips] of byEmployee) {
    const points: { t: number; id: string; delta: number }[] = [];
    for (const clip of employeeClips) {
      points.push({ t: clip.start, id: clip.action.id, delta: 1 });
      points.push({ t: clip.end, id: clip.action.id, delta: -1 });
    }
    points.sort((a, b) => a.t - b.t || a.delta - b.delta);
    const active = new Map<string, AgentAction>();
    const byId = new Map(employeeClips.map((clip) => [clip.action.id, clip.action]));
    let last = points[0]?.t ?? 0;
    let localPeak = 0;
    for (const point of points) {
      if (point.t > last && active.size > 0) {
        distribute(point.t - last, [...active.values()], minutes);
      }
      if (point.delta > 0) {
        const action = byId.get(point.id);
        if (action) active.set(point.id, action);
      } else {
        active.delete(point.id);
      }
      localPeak = Math.max(localPeak, active.size);
      last = point.t;
    }
    peak.set(key, localPeak);
  }

  const asMinutes = new Map<string, number>();
  for (const [id, ms] of minutes) asMinutes.set(id, ms / MS_PER_MINUTE);
  return { minutes: asMinutes, peak };
}

function sweepWall(clips: Clip[]): Map<string, number> {
  const walls = new Map<string, number>();
  const byEmployee = new Map<string, Clip[]>();
  for (const clip of clips) {
    const key = employeeKey(clip.action);
    const list = byEmployee.get(key) ?? [];
    list.push(clip);
    byEmployee.set(key, list);
  }
  for (const [key, employeeClips] of byEmployee) {
    const points: { t: number; delta: number }[] = [];
    for (const clip of employeeClips) {
      points.push({ t: clip.start, delta: 1 });
      points.push({ t: clip.end, delta: -1 });
    }
    points.sort((a, b) => a.t - b.t || a.delta - b.delta);
    let count = 0;
    let last = points[0]?.t ?? 0;
    let wall = 0;
    for (const point of points) {
      if (point.t > last && count > 0) wall += point.t - last;
      count += point.delta;
      last = point.t;
    }
    walls.set(key, wall / MS_PER_MINUTE);
  }
  return walls;
}

export function attributeAgentActions(actions: AgentAction[], range: AttributionRange): AttributionResult {
  const byParent = childrenByParent(actions);
  const byAction = new Map<string, ActionAttribution>();
  const imputableClips: Clip[] = [];
  const wallClips: Clip[] = [];

  for (const action of actions) {
    const clip = clipAction(action, range);
    const imputable = isImputableLeaf(action, byParent);
    if (clip) wallClips.push(clip);
    if (imputable && clip) imputableClips.push(clip);
    byAction.set(action.id, {
      imputable,
      imputableMinutes: 0,
      presenceMinutes: clip && imputable ? (clip.end - clip.start) / MS_PER_MINUTE : 0,
    });
  }

  const swept = sweepImputable(imputableClips);
  for (const [id, minutes] of swept.minutes) {
    const current = byAction.get(id);
    if (current) current.imputableMinutes = minutes;
  }

  const walls = sweepWall(wallClips);
  const employeeLabels = new Map<string, { employeeId: string | null; label: string }>();
  const clientBuckets = new Map<string, ClientAttribution>();

  for (const action of actions) {
    const key = employeeKey(action);
    if (!employeeLabels.has(key)) {
      employeeLabels.set(key, { employeeId: action.employeeId, label: employeeLabel(action) });
    }
    const part = byAction.get(action.id);
    if (!part?.imputable) continue;
    const bucketKey = clientKeyFor(action);
    const bucket = clientBuckets.get(bucketKey) ?? {
      clientKey: bucketKey,
      clientId: action.category === 'internal' && !action.clientId ? null : action.clientId,
      label: clientLabelFor(action),
      imputableMinutes: 0,
      presenceMinutes: 0,
      actionCount: 0,
    };
    bucket.imputableMinutes += part.imputableMinutes;
    bucket.presenceMinutes += part.presenceMinutes;
    bucket.actionCount += 1;
    clientBuckets.set(bucketKey, bucket);
  }

  const byEmployee: EmployeeAttribution[] = [];
  const seen = new Set<string>();
  for (const action of actions) {
    const key = employeeKey(action);
    if (seen.has(key)) continue;
    seen.add(key);
    const info = employeeLabels.get(key)!;
    let imputableMinutes = 0;
    let presenceMinutes = 0;
    for (const item of actions) {
      if (employeeKey(item) !== key) continue;
      const part = byAction.get(item.id);
      if (!part?.imputable) continue;
      imputableMinutes += part.imputableMinutes;
      presenceMinutes += part.presenceMinutes;
    }
    const wallMinutes = walls.get(key) ?? 0;
    byEmployee.push({
      employeeKey: key,
      employeeId: info.employeeId,
      label: info.label,
      wallMinutes,
      imputableMinutes,
      unattributedMinutes: Math.max(0, wallMinutes - imputableMinutes),
      presenceMinutes,
      peakParallel: swept.peak.get(key) ?? 0,
    });
  }

  byEmployee.sort((a, b) => b.imputableMinutes - a.imputableMinutes || a.label.localeCompare(b.label));
  const byClient = [...clientBuckets.values()].sort(
    (a, b) => b.imputableMinutes - a.imputableMinutes || a.label.localeCompare(b.label),
  );

  const totals = byEmployee.reduce(
    (acc, row) => {
      acc.wallMinutes += row.wallMinutes;
      acc.imputableMinutes += row.imputableMinutes;
      acc.unattributedMinutes += row.unattributedMinutes;
      acc.presenceMinutes += row.presenceMinutes;
      acc.peakParallel = Math.max(acc.peakParallel, row.peakParallel);
      return acc;
    },
    { wallMinutes: 0, imputableMinutes: 0, unattributedMinutes: 0, presenceMinutes: 0, peakParallel: 0 },
  );

  return { byAction, byEmployee, byClient, totals };
}

export function formatMinutes(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes <= 0) return '0 min';
  const rounded = Math.round(minutes);
  const hours = Math.floor(rounded / 60);
  const rest = rounded % 60;
  if (hours === 0) return `${rest} min`;
  if (rest === 0) return `${hours} h`;
  return `${hours} h ${rest} min`;
}

export function categoryCounts(actions: AgentAction[]): Record<AgentActionCategory, number> {
  const counts: Record<AgentActionCategory, number> = {
    intake: 0,
    triage: 0,
    client_work: 0,
    internal: 0,
    noise: 0,
  };
  for (const action of actions) counts[action.category] += 1;
  return counts;
}

export function attentionOf(value: string | null | undefined): AgentAttention {
  if (value === 'exclusive' || value === 'background' || value === 'shared') return value;
  return 'shared';
}
