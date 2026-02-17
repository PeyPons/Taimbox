import type { ChangelogEntry } from './types';

// Orden: más reciente primero (reverse chronological)
export const CHANGELOG_ENTRIES: ChangelogEntry[] = [
  {
    date: '2026-02-17',
    type: 'new',
    title: 'Documentación API v1',
    description:
      'Primera versión de la documentación pública de la API de integración. Incluye referencia de recursos, tutoriales, SDK JavaScript, suscripciones Realtime, ejemplos de respuestas y permisos readonly/readwrite.',
  },
  {
    date: '2026-02-15',
    type: 'new',
    title: 'Tokens API por agencia',
    description:
      'Los administradores pueden generar y revocar tokens JWT desde API & Integraciones. Cada token está vinculado a un agency_id, admite permisos de solo lectura o lectura/escritura, y está protegido por políticas RLS.',
  },
];
