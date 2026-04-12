/**
 * Valores almacenados en `projects.project_type` cuando se elige un tipo predefinido.
 * Lista única para onboarding y formularios; si en el futuro la agencia define tipos
 * propios en settings, los selectores deberían leer de ahí y usar esto solo como fallback.
 */
export const PROJECT_TYPE_PRESET_VALUES = ['PPC', 'Entregable', 'Mensual'] as const;

export type ProjectTypePreset = (typeof PROJECT_TYPE_PRESET_VALUES)[number];
