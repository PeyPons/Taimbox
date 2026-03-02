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
    description: 'Gestiona tareas abiertas y transferencias semanales',
    category: 'workflow',
    requiresConfig: false,
  },
  crm_export: {
    id: 'crm_export',
    name: 'Exportación de Tareas al CRM',
    description: 'Permite exportar tareas planificadas en formato CSV para importar al CRM',
    category: 'crm',
    requiresConfig: false,
    dependencies: ['crm_user_id'], // Requiere que crm_user_id esté activo
  },
  crm_user_id: {
    id: 'crm_user_id',
    name: 'ID Usuario CRM',
    description: 'Muestra el campo ID Usuario CRM en los perfiles de empleados. Necesario para exportar tareas al CRM',
    category: 'crm',
    requiresConfig: false,
  },
  anonymize_ads_for_video: {
    id: 'anonymize_ads_for_video',
    name: 'Modo demostración (ocultar datos sensibles)',
    description: 'Sustituye nombres por etiquetas genéricas (Cliente A - Retail, Campaña Ecommerce 01) y mantiene los IDs visibles. Útil para grabaciones de vídeo o verificaciones ante Google Trust & Safety.',
    category: 'other',
    requiresConfig: false,
  },
};

