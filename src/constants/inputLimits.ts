/** Límites de longitud para campos de formulario (frontend). Deben coincidir con supabase/functions/_shared/input-limits.ts */
export const INPUT_LIMITS = {
  personName: 120,
  agencyName: 120,
  clientName: 120,
  projectName: 200,
  roleName: 80,
  departmentName: 80,
  email: 254,
  password: 128,
  contactSubject: 200,
  contactMessage: 5000,
  supportSubject: 200,
  supportMessage: 8000,
  description: 2000,
  keyword: 100,
  assignmentName: 200,
  goalTitle: 200,
  goalKeyResultText: 300,
  goalTrainingUrl: 500,
  projectType: 80,
  okrTitle: 300,
  absenceDescription: 500,
} as const;

export type InputLimitKey = keyof typeof INPUT_LIMITS;
