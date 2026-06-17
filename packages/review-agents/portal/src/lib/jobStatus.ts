export type JobStatusBadgeVariant = 'queued' | 'active' | 'done' | 'error' | 'cancelled';

const STATUS_LABELS: Record<string, string> = {
  queued: 'En cola',
  preprocessing: 'Preparando',
  chunking: 'Preparando',
  mapping: 'Analizando',
  reducing: 'Redactando informe',
  completed: 'Completada',
  failed: 'Error',
  cancelled: 'Cancelada',
};

const STATUS_VARIANTS: Record<string, JobStatusBadgeVariant> = {
  queued: 'queued',
  preprocessing: 'active',
  chunking: 'active',
  mapping: 'active',
  reducing: 'active',
  completed: 'done',
  failed: 'error',
  cancelled: 'cancelled',
};

export const TERMINAL_STATUSES = ['completed', 'failed', 'cancelled'] as const;

export const ACTIVE_STATUSES = [
  'queued',
  'preprocessing',
  'chunking',
  'mapping',
  'reducing',
] as const;

export function getJobStatusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status;
}

export function getJobStatusVariant(status: string): JobStatusBadgeVariant {
  return STATUS_VARIANTS[status] ?? 'queued';
}

export function isTerminalStatus(status: string): boolean {
  return (TERMINAL_STATUSES as readonly string[]).includes(status);
}

export function isActiveStatus(status: string): boolean {
  return (ACTIVE_STATUSES as readonly string[]).includes(status);
}
