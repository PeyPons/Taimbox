export type NotificationTriggerType = 'scheduled' | 'task_transfer_pending';

export type NotificationRecipientPolicy =
  | 'transfer_target'
  | 'transfer_source'
  | 'all_with_hours_in_month'
  | 'role_name'
  | 'agency_admins'
  | 'custom_emails';

export type NotificationIssueFlag =
  | 'needs_planning'
  | 'behind_schedule'
  | 'over_budget'
  | 'no_activity';

/** Salud mensual tipo ProjectsPage vs coherencia deadlines / radar operativo */
export type NotificationEvaluationMode = 'project_month_health' | 'deadline_coherence';

export type CoherenceDeliveryMode = 'per_project' | 'digest';

/** Alineado con etiquetas del radar operativo */
export type CoherenceOpStatus =
  | 'over-budget'
  | 'behind-schedule'
  | 'needs-planning'
  | 'no-activity'
  | 'in-rule';

export interface NotificationRuleConditions {
  /** Solo reglas `scheduled`. Por defecto `project_month_health`. */
  evaluation?: NotificationEvaluationMode;
  match_any?: NotificationIssueFlag[];
  project_ids?: string[];
  client_ids?: string[];
  /** Umbral mínimo (valor absoluto) en horas para avisar (total o por empleado). */
  coherence_min_abs_hours?: number;
  /** Estados operativos que disparan el correo (coherencia). Por defecto todos salvo en regla. */
  coherence_op_status_in?: CoherenceOpStatus[];
  coherence_delivery_mode?: CoherenceDeliveryMode;
  coherence_digest_max?: number;
}

export interface NotificationRule {
  id: string;
  agencyId: string;
  name: string;
  enabled: boolean;
  triggerType: NotificationTriggerType;
  scheduleHourUtc: number | null;
  conditions: NotificationRuleConditions;
  recipientPolicy: NotificationRecipientPolicy;
  recipientRoleName: string | null;
  extraEmails: string[];
  createdAt: string;
  updatedAt: string;
}

export function mapNotificationRuleFromDb(row: Record<string, unknown>): NotificationRule {
  return {
    id: String(row.id),
    agencyId: String(row.agency_id),
    name: String(row.name ?? ''),
    enabled: Boolean(row.enabled),
    triggerType: row.trigger_type as NotificationTriggerType,
    scheduleHourUtc:
      row.schedule_hour_utc === null || row.schedule_hour_utc === undefined
        ? null
        : Number(row.schedule_hour_utc),
    conditions: (row.conditions as NotificationRuleConditions) || {},
    recipientPolicy: row.recipient_policy as NotificationRecipientPolicy,
    recipientRoleName: (row.recipient_role_name as string) || null,
    extraEmails: Array.isArray(row.extra_emails) ? (row.extra_emails as string[]) : [],
    createdAt: String(row.created_at ?? ''),
    updatedAt: String(row.updated_at ?? ''),
  };
}
