export interface IntegrationDefinition {
  id: string;                    // Identificador único (ej: 'crm_export')
  name: string;                  // Nombre para mostrar (ej: 'Exportación CRM')
  description: string;           // Descripción de la funcionalidad
  category: 'workflow' | 'crm' | 'ads' | 'other';
  requiresConfig?: boolean;       // Si requiere configuración adicional
  dependencies?: string[];       // IDs de integraciones requeridas
}

export const AVAILABLE_INTEGRATIONS: Record<string, IntegrationDefinition> = {
  weekly_feedback: {
    id: 'weekly_feedback',
    name: 'Weekly',
    description:
      'Tras el día de cierre, las semanas pasadas no se editan en el planificador: el equipo cierra pendientes desde Weekly (horas, posponer, transferir, desglosar…).',
    category: 'workflow',
    requiresConfig: false,
  },
  crm_export: {
    id: 'crm_export',
    name: 'Exportación de tareas al CRM',
    description:
      'Exporta la planificación a CSV y muestra en cada proyecto el campo de ID externo (CRM) para alinearlo con tu sistema.',
    category: 'crm',
    requiresConfig: false,
    dependencies: ['crm_user_id'], // Requiere que crm_user_id esté activo
  },
  crm_user_id: {
    id: 'crm_user_id',
    name: 'ID de usuario en el CRM',
    description:
      'Activa en el perfil de cada empleado un campo para su ID en el sistema externo; la exportación CSV lo usa para enlazar personas y tareas.',
    category: 'crm',
    requiresConfig: false,
  },
  anonymize_ads_for_video: {
    id: 'anonymize_ads_for_video',
    name: 'Modo demostración (ocultar datos sensibles)',
    description: 'En toda la aplicación, sustituye visualmente nombres de personas, clientes, proyectos y tareas por etiquetas genéricas (mismo criterio que en Google/Meta Ads). Los IDs reales se mantienen donde ya se mostraban. Útil para demos a clientes o verificaciones Trust & Safety.',
    category: 'other',
    requiresConfig: false,
  },
};

