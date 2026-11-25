export const AGENT_TOOLS = ['claude', 'codex', 'antigravity', 'other'] as const;
export type AgentTool = (typeof AGENT_TOOLS)[number];

export const AGENT_ACTION_CATEGORIES = ['intake', 'triage', 'client_work', 'internal', 'noise'] as const;
export type AgentActionCategory = (typeof AGENT_ACTION_CATEGORIES)[number];

export const AGENT_ACTION_CHANNELS = [
  'google_ads',
  'meta',
  'seo',
  'dv360',
  'analytics',
  'email',
  'crm',
  'chatgpt_ads',
  'internal',
  'reporting',
  'other',
] as const;
export type AgentActionChannel = (typeof AGENT_ACTION_CHANNELS)[number];

export const AGENT_ACTION_STATUSES = ['requested', 'in_progress', 'completed', 'cancelled'] as const;
export type AgentActionStatus = (typeof AGENT_ACTION_STATUSES)[number];

export const AGENT_ATTENTIONS = ['exclusive', 'shared', 'background'] as const;
export type AgentAttention = (typeof AGENT_ATTENTIONS)[number];

export const AGENT_WORK_MODES = ['rapida', 'cliente', 'critica', 'repetible'] as const;
export type AgentWorkMode = (typeof AGENT_WORK_MODES)[number];

export const AGENT_MATCH_STATUSES = ['matched', 'unmatched', 'ambiguous', 'not_required'] as const;
export type AgentMatchStatus = (typeof AGENT_MATCH_STATUSES)[number];

/** Fila de `agent_actions` tal como la devuelve PostgREST. */
export interface AgentActionRow {
  id: string;
  agency_id: string;
  parent_id: string | null;
  root_id: string | null;
  depth: number;
  external_id: string | null;
  employee_id: string | null;
  client_id: string | null;
  project_id: string | null;
  allocation_id: string | null;
  tool: AgentTool;
  category: AgentActionCategory;
  channel: AgentActionChannel | null;
  status: AgentActionStatus;
  attention: AgentAttention;
  work_mode: AgentWorkMode | null;
  match_status: AgentMatchStatus;
  title: string;
  outcome: string | null;
  client_label: string | null;
  project_label: string | null;
  employee_label: string | null;
  client_tier: string | null;
  history_ref: string | null;
  started_at: string;
  finished_at: string | null;
  reported_minutes: number | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface AgentAction {
  id: string;
  agencyId: string;
  parentId: string | null;
  rootId: string | null;
  depth: number;
  externalId: string | null;
  employeeId: string | null;
  clientId: string | null;
  projectId: string | null;
  allocationId: string | null;
  tool: AgentTool;
  category: AgentActionCategory;
  channel: AgentActionChannel | null;
  status: AgentActionStatus;
  attention: AgentAttention;
  workMode: AgentWorkMode | null;
  matchStatus: AgentMatchStatus;
  title: string;
  outcome: string | null;
  clientLabel: string | null;
  projectLabel: string | null;
  employeeLabel: string | null;
  clientTier: string | null;
  historyRef: string | null;
  startedAt: string;
  finishedAt: string | null;
  reportedMinutes: number | null;
}

export function mapAgentAction(row: AgentActionRow): AgentAction {
  return {
    id: row.id,
    agencyId: row.agency_id,
    parentId: row.parent_id,
    rootId: row.root_id,
    depth: row.depth,
    externalId: row.external_id,
    employeeId: row.employee_id,
    clientId: row.client_id,
    projectId: row.project_id,
    allocationId: row.allocation_id,
    tool: row.tool,
    category: row.category,
    channel: row.channel,
    status: row.status,
    attention: row.attention,
    workMode: row.work_mode,
    matchStatus: row.match_status,
    title: row.title,
    outcome: row.outcome,
    clientLabel: row.client_label,
    projectLabel: row.project_label,
    employeeLabel: row.employee_label,
    clientTier: row.client_tier,
    historyRef: row.history_ref,
    startedAt: row.started_at,
    finishedAt: row.finished_at,
    reportedMinutes: row.reported_minutes,
  };
}
