/** Límites de longitud para campos de formulario (Edge Functions). Deben coincidir con src/constants/inputLimits.ts */
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

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function parseBoundedString(
  value: unknown,
  options: { min?: number; max: number; fieldName: string },
): string {
  const { min = 1, max, fieldName } = options;
  if (typeof value !== "string") {
    throw new Error(`${fieldName} inválido.`);
  }
  const trimmed = value.trim();
  if (trimmed.length < min) {
    throw new Error(`${fieldName} es obligatorio.`);
  }
  if (trimmed.length > max) {
    throw new Error(`${fieldName} supera el máximo de ${max} caracteres.`);
  }
  return trimmed;
}

export function parseOptionalBoundedString(
  value: unknown,
  options: { max: number; fieldName: string },
): string {
  if (value == null || value === "") return "";
  if (typeof value !== "string") {
    throw new Error(`${options.fieldName} inválido.`);
  }
  const trimmed = value.trim();
  if (trimmed.length > options.max) {
    throw new Error(`${options.fieldName} supera el máximo de ${options.max} caracteres.`);
  }
  return trimmed;
}

export function parseEmail(value: unknown): string {
  const email = parseBoundedString(value, {
    max: INPUT_LIMITS.email,
    fieldName: "Email",
  }).toLowerCase();
  if (!EMAIL_RE.test(email)) {
    throw new Error("Email inválido.");
  }
  return email;
}

export function parsePassword(value: unknown): string {
  if (typeof value !== "string") {
    throw new Error("La contraseña es obligatoria.");
  }
  if (value.length < 8) {
    throw new Error("La contraseña debe tener al menos 8 caracteres.");
  }
  if (value.length > INPUT_LIMITS.password) {
    throw new Error(`La contraseña supera el máximo de ${INPUT_LIMITS.password} caracteres.`);
  }
  return value;
}
