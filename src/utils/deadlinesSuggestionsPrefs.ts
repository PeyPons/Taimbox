/**
 * Preferencias del asistente de recomendaciones en Deadlines (localStorage por agencia + usuario).
 * Se validan al cargar para evitar estados que bloqueen todas las sugerencias (p. ej. todos los cedentes excluidos).
 */

export const DEADLINES_SUGGESTIONS_PREFS_VERSION = 1;

export type SuggestionsFlowMode = 'team' | 'give' | 'take';

export type SuggestionsFlowPreset = 'prudent' | 'heavy' | 'explore';

/** Valores recomendados al iniciar flujos guiados o presets en la pantalla de intención. */
export function getSuggestionsFlowPresetValues(
  preset: SuggestionsFlowPreset
): Pick<
  DeadlinesSuggestionsPrefs,
  | 'onlySharedProjects'
  | 'minSenderLoadPct'
  | 'maxReceiverLoadPct'
  | 'minSuggestedTransferHours'
  | 'excludedDonorIds'
  | 'includedProjectIds'
> {
  switch (preset) {
    case 'heavy':
      return {
        onlySharedProjects: true,
        minSenderLoadPct: 65,
        maxReceiverLoadPct: 100,
        minSuggestedTransferHours: 1,
        excludedDonorIds: [],
        includedProjectIds: [],
      };
    case 'explore':
      return {
        onlySharedProjects: false,
        minSenderLoadPct: 30,
        maxReceiverLoadPct: 100,
        minSuggestedTransferHours: DEFAULT_MIN_SUGGESTED_TRANSFER_HOURS,
        excludedDonorIds: [],
        includedProjectIds: [],
      };
    case 'prudent':
    default:
      return {
        onlySharedProjects: true,
        minSenderLoadPct: 30,
        maxReceiverLoadPct: 100,
        minSuggestedTransferHours: DEFAULT_MIN_SUGGESTED_TRANSFER_HOURS,
        excludedDonorIds: [],
        includedProjectIds: [],
      };
  }
}

/** Panel cerrado pero el usuario sigue en un flujo guiado (p. ej. tras «Ir al proyecto»). */
export function isSuggestionsWizardPaused(isPanelOpen: boolean, flowView: string): boolean {
  return !isPanelOpen && flowView !== 'intent';
}

export function getSuggestionsWizardResumeLabel(
  flowView: SuggestionsFlowMode | 'intent',
  wizardStep: number,
  focusEmployeeName?: string
): string {
  const who = focusEmployeeName ? ` · ${focusEmployeeName}` : '';
  switch (flowView) {
    case 'give':
      if (wizardStep <= 1) return 'Dar horas — elegir persona';
      if (wizardStep === 2) return `Dar horas — reglas${who}`;
      if (wizardStep === 3) return `Dar horas — proyectos${who}`;
      return `Dar horas — resumen${who}`;
    case 'take':
      if (wizardStep <= 1) return 'Quitar carga — elegir persona';
      if (wizardStep === 2) return `Quitar carga — reglas${who}`;
      if (wizardStep === 3) return `Quitar carga — destinos${who}`;
      return `Quitar carga — resumen${who}`;
    case 'team':
      return 'Equilibrar equipo';
    default:
      return 'Continuar asistente';
  }
}

export const DEFAULT_MIN_SUGGESTED_TRANSFER_HOURS = 0.5;

/** Umbral mínimo de horas por transferencia sugerida (pasos de 0,5 h, entre 0,5 y 8). */
export function clampMinSuggestedTransferHours(n: unknown): number {
  const parsed = typeof n === 'number' ? n : parseFloat(String(n ?? '').replace(',', '.'));
  if (!Number.isFinite(parsed) || parsed < 0.5) return DEFAULT_MIN_SUGGESTED_TRANSFER_HOURS;
  return Math.min(8, Math.round(parsed * 2) / 2);
}

export type DeadlinesSuggestionsPrefs = {
  v: number;
  excludedDonorIds: string[];
  maxReceiverLoadPct: number;
  minSenderLoadPct: number;
  minSuggestedTransferHours: number;
  onlySharedProjects: boolean;
  includedProjectIds: string[];
  lastFlowMode?: SuggestionsFlowMode;
};

export function defaultDeadlinesSuggestionsPrefs(): DeadlinesSuggestionsPrefs {
  return {
    v: DEADLINES_SUGGESTIONS_PREFS_VERSION,
    excludedDonorIds: [],
    maxReceiverLoadPct: 100,
    minSenderLoadPct: 30,
    minSuggestedTransferHours: DEFAULT_MIN_SUGGESTED_TRANSFER_HOURS,
    onlySharedProjects: false,
    includedProjectIds: [],
  };
}

export function deadlinesSuggestionsPrefsStorageKey(
  agencyId: string,
  userId: string
): string {
  return `tb_deadlines_suggestions_v${DEADLINES_SUGGESTIONS_PREFS_VERSION}_${agencyId}_${userId}`;
}

function clampInt(n: unknown, min: number, max: number, fallback: number): number {
  const parsed = typeof n === 'number' ? n : parseInt(String(n ?? ''), 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.round(parsed)));
}

export function sanitizeDeadlinesSuggestionsPrefs(
  raw: Partial<DeadlinesSuggestionsPrefs> | null | undefined,
  ctx?: {
    validDonorIds?: Set<string>;
    validProjectIds?: Set<string>;
  }
): DeadlinesSuggestionsPrefs {
  const base = defaultDeadlinesSuggestionsPrefs();
  if (!raw || typeof raw !== 'object') return base;

  let excludedDonorIds = Array.isArray(raw.excludedDonorIds)
    ? raw.excludedDonorIds.filter((id): id is string => typeof id === 'string' && id.length > 0)
    : [];

  if (ctx?.validDonorIds) {
    excludedDonorIds = excludedDonorIds.filter((id) => ctx.validDonorIds!.has(id));
    const donorCount = ctx.validDonorIds.size;
    if (donorCount > 0 && excludedDonorIds.length >= donorCount) {
      excludedDonorIds = [];
    }
  }

  let includedProjectIds = Array.isArray(raw.includedProjectIds)
    ? raw.includedProjectIds.filter((id): id is string => typeof id === 'string' && id.length > 0)
    : [];

  if (ctx?.validProjectIds) {
    includedProjectIds = includedProjectIds.filter((id) => ctx.validProjectIds!.has(id));
  }

  return {
    v: DEADLINES_SUGGESTIONS_PREFS_VERSION,
    excludedDonorIds,
    maxReceiverLoadPct: clampInt(raw.maxReceiverLoadPct, 1, 100, 100),
    minSenderLoadPct: clampInt(raw.minSenderLoadPct, 0, 100, 30),
    minSuggestedTransferHours: clampMinSuggestedTransferHours(raw.minSuggestedTransferHours),
    onlySharedProjects: Boolean(raw.onlySharedProjects),
    includedProjectIds,
  };
}

export function loadDeadlinesSuggestionsPrefs(
  agencyId: string | undefined,
  userId: string | undefined
): DeadlinesSuggestionsPrefs | null {
  if (!agencyId || !userId || typeof localStorage === 'undefined') return null;
  try {
    const key = deadlinesSuggestionsPrefsStorageKey(agencyId, userId);
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<DeadlinesSuggestionsPrefs>;
    if (parsed.v !== DEADLINES_SUGGESTIONS_PREFS_VERSION) return null;
    return sanitizeDeadlinesSuggestionsPrefs(parsed);
  } catch {
    return null;
  }
}

export function saveDeadlinesSuggestionsPrefs(
  agencyId: string | undefined,
  userId: string | undefined,
  prefs: DeadlinesSuggestionsPrefs
): void {
  if (!agencyId || !userId || typeof localStorage === 'undefined') return;
  try {
    const key = deadlinesSuggestionsPrefsStorageKey(agencyId, userId);
    localStorage.setItem(key, JSON.stringify(sanitizeDeadlinesSuggestionsPrefs(prefs)));
  } catch {
    // quota / private mode
  }
}

export function clearDeadlinesSuggestionsPrefs(
  agencyId: string | undefined,
  userId: string | undefined
): void {
  if (!agencyId || !userId || typeof localStorage === 'undefined') return;
  try {
    localStorage.removeItem(deadlinesSuggestionsPrefsStorageKey(agencyId, userId));
  } catch {
    // ignore
  }
}

export type SuggestionsBlockReason =
  | 'no_team'
  | 'no_donors'
  | 'no_receivers'
  | 'all_donors_excluded'
  | 'project_filter_empty'
  | 'only_shared_no_overlap'
  | 'thresholds';

const MIN_SUGGESTED_HOURS = 0.05;

export function projectHasSuggestedTransfers(
  project: { transfers: { suggestedHours: number }[] }
): boolean {
  return project.transfers.some((t) => (Number(t.suggestedHours) || 0) > MIN_SUGGESTED_HOURS);
}

export function totalSuggestedHoursForGroup(group: {
  projects: { transfers: { suggestedHours: number }[] }[];
}): number {
  let total = 0;
  for (const p of group.projects) {
    for (const t of p.transfers) {
      const h = Number(t.suggestedHours) || 0;
      if (h > MIN_SUGGESTED_HOURS) total += h;
    }
  }
  return Math.round(total * 10) / 10;
}

export function countProjectsWithTransfers(group: {
  projects: { transfers: { suggestedHours: number }[] }[];
}): number {
  return group.projects.filter((p) => projectHasSuggestedTransfers(p)).length;
}

export function describeSuggestionsBlockReason(reason: SuggestionsBlockReason): string {
  switch (reason) {
    case 'no_team':
      return 'Hace falta al menos dos personas con carga en el mes para calcular repartos.';
    case 'no_donors':
      return 'Nadie supera el % mínimo de carga de quien cede o no tiene horas en proyectos visibles.';
    case 'no_receivers':
      return 'Nadie tiene margen bajo el tope de carga del receptor. Prueba subir el % del receptor.';
    case 'all_donors_excluded':
      return 'Has excluido a todas las personas que pueden ceder horas.';
    case 'project_filter_empty':
      return 'Los proyectos seleccionados no generan transferencias con los filtros actuales.';
    case 'only_shared_no_overlap':
      return 'Con «solo proyectos en común» no hay proyectos compartidos entre quien cede y quien recibe.';
    case 'thresholds':
      return 'Los porcentajes actuales no permiten ninguna transferencia. Prueba valores más flexibles.';
    default:
      return 'No hay sugerencias con la configuración actual.';
  }
}
