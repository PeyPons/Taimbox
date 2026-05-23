export type ReviewJobStatus =
  | 'queued'
  | 'preprocessing'
  | 'chunking'
  | 'mapping'
  | 'reducing'
  | 'completed'
  | 'failed'
  | 'cancelled';

export type SkillType = 'document' | 'url' | 'mixed';

export interface ReviewChecklistItem {
  id: string;
  label: string;
  severity: 'low' | 'medium' | 'high';
  hints?: string;
}

export interface ReviewOutputSchema {
  summary: string;
  score: number;
  findings: Array<{
    id: string;
    title: string;
    severity: string;
    detail: string;
    source?: string;
  }>;
  recommendations: string[];
}

export interface ReviewSkillRow {
  id: string;
  agency_id: string | null;
  slug: string;
  name: string;
  description: string;
  skill_type: SkillType;
  system_prompt: string;
  review_checklist: ReviewChecklistItem[];
  output_schema: ReviewOutputSchema;
  visibility_roles: string[];
  allowed_input_types: string[];
  is_system_template: boolean;
  version: number;
}

export interface JobInputPayload {
  type: 'file' | 'url' | 'paste';
  storagePath?: string;
  sourceUrl?: string;
  text?: string;
  filename?: string;
}

export interface CreateJobBody {
  agencyId: string;
  skillId: string;
  inputs: JobInputPayload[];
  notifyOnComplete?: boolean;
}

export const JOB_QUEUE_NAME = 'review-jobs';

export const LIMITS = {
  maxFileBytes: 50 * 1024 * 1024,
  maxFilesPerJob: 10,
  maxCharsTotal: 2_000_000,
  chunkChars: 12_000,
  chunkOverlap: 800,
  maxConcurrentJobsPerUser: 3,
  chunkTimeoutMs: 5 * 60 * 1000,
  chunkRetries: 3,
} as const;

export const DEFAULT_OLLAMA_MODEL = 'qwen2.5:7b-instruct';
export const DEFAULT_OLLAMA_MODEL_MAP = 'llama3.2:3b';
export const DEFAULT_OLLAMA_MODEL_REDUCE = 'qwen2.5:7b-instruct';
