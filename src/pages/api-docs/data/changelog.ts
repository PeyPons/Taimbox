import type { ChangelogEntry } from './types';

export const CHANGELOG_ENTRIES: ChangelogEntry[] = [
  {
    date: '2026-02-17',
    type: 'new',
    title: 'Documentación API v1',
    description:
      'Primera versión de la documentación pública de la API de integración. Incluye referencia de 17 recursos, tutoriales, SDK JavaScript, suscripciones Realtime y ejemplos completos.',
  },
  {
    date: '2026-02-17',
    type: 'new',
    title: 'Tokens API por agencia',
    description:
      'Los administradores pueden generar tokens JWT desde API & Integraciones. Cada token está vinculado a un agency_id y protegido por políticas RLS.',
  },
];
