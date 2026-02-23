import type { ChangelogEntry } from './types';

// Orden: más reciente primero (reverse chronological)
export const CHANGELOG_ENTRIES: ChangelogEntry[] = [
  {
    date: '2026-02-21',
    type: 'improved',
    title: 'Tablas de tiempos con agency_id y RPCs documentadas',
    description:
      'Se añade agency_id a time_entries, active_timers y timer_sessions para poder filtrar por agencia en la API. Se documentan las tablas active_timers y timer_sessions en la referencia de recursos, y las RPCs log_timer_hours (registrar horas al parar el cronómetro) y get_team_active_timers (listar cronómetros activos del equipo) en la sección API REST.',
  },
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
