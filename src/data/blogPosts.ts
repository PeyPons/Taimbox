export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  href: string;
  /** Tiempo de lectura estimado en minutos (base común para todos los posts). */
  readingMinutes: number;
  /** Slug del artículo recomendado como "Siguiente lectura" (opcional). */
  relatedSlug?: string;
}

export const blogPosts: BlogPost[] = [
  {
    slug: 'plantilla-planificacion-recursos-agencia',
    title: 'Plantilla gratuita de planificación de recursos para agencias',
    description:
      'Descarga gratis una plantilla de planificación de recursos para agencias en Excel o Google Sheets: 5 hojas con fórmulas, formato condicional, desplegables y protección de celdas. Calcula capacidad neta, utilización y margen.',
    date: '2026-03-24',
    href: '/blog/plantilla-planificacion-recursos-agencia',
    readingMinutes: 22,
    relatedSlug: 'planificacion-proyectos-cronograma-recursos',
  },
  {
    slug: 'kpis-agencias-marketing-2026',
    title: 'KPIs para agencias de marketing: 5 métricas que sí importan en 2026',
    description:
      'Utilización, rentabilidad y pacing, estimación vs real, capacidad por departamento y OKRs: métricas accionables, qué hacer si el número falla y por qué medir bien no debería ser arqueología en Excel.',
    date: '2026-03-23',
    href: '/blog/kpis-agencias-marketing-2026',
    readingMinutes: 16,
    relatedSlug: 'planificacion-proyectos-cronograma-recursos',
  },
  {
    slug: 'planificacion-proyectos-cronograma-recursos',
    title: 'Planificación de proyectos: cronograma, presupuesto y recursos',
    description: 'Guía práctica para unir cronograma, presupuesto y capacidad del equipo. Incluye diagrama de Gantt, fases del proyecto, KPIs y herramientas.',
    date: '2025-03-17',
    href: '/blog/planificacion-proyectos-cronograma-recursos',
    readingMinutes: 10,
    relatedSlug: 'que-es-timeboxing',
  },
  {
    slug: 'que-es-timeboxing',
    title: 'Qué es el timeboxing: guía definitiva de productividad',
    description: 'Descubre la técnica de gestión del tiempo por cajas: qué es, cómo implementarla y cómo llevarla a todo el equipo para aumentar la rentabilidad.',
    date: '2024-01-15',
    href: '/blog/que-es-timeboxing',
    readingMinutes: 12,
    relatedSlug: 'planificacion-proyectos-cronograma-recursos',
  },
  {
    slug: 'ley-parkinson',
    title: 'Ley de Parkinson: qué es, ejemplos y cómo combatirla',
    description: 'Guía completa sobre la Ley de Parkinson: origen, formulación, evidencia, consecuencias en negocio y antídotos (timeboxing, plazos y gestión del tiempo).',
    date: '2025-03-18',
    href: '/blog/ley-parkinson',
    readingMinutes: 18,
    relatedSlug: 'que-es-timeboxing',
  },
];
