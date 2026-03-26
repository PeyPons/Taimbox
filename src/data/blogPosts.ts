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
    slug: 'por-que-tu-agencia-pierde-rentabilidad-equipo-ocupado',
    title: 'Por qué tu agencia pierde rentabilidad aunque el equipo esté siempre ocupado',
    description:
      'Ocupación alta vs margen real: utilización, context switching, presencialismo digital, horas no facturables, scope creep y métricas que sí predicen rentabilidad. Sin venderte herramientas: datos, tablas y qué hacer esta semana.',
    date: '2026-03-26',
    href: '/blog/por-que-tu-agencia-pierde-rentabilidad-equipo-ocupado',
    readingMinutes: 14,
    relatedSlug: 'kpis-agencias-marketing-2026',
  },
  {
    slug: 'como-medir-rentabilidad-proyecto-agencia-dejar-vender-horas',
    title: 'Cómo medir la rentabilidad real por proyecto en tu agencia (y dejar de vender horas)',
    description:
      'Modelos de pricing (horas, retainer, valor, híbrido), margen bruto por proyecto, protocolo de alcance en tres pasos y sprints para proteger márgenes. Enlace natural con planificación y timeboxing.',
    date: '2026-03-26',
    href: '/blog/como-medir-rentabilidad-proyecto-agencia-dejar-vender-horas',
    readingMinutes: 12,
    relatedSlug: 'planificacion-proyectos-cronograma-recursos',
  },
  {
    slug: 'gestion-carga-trabajo-equipo-sin-burnout',
    title: 'Cómo gestionar la carga de trabajo de tu equipo sin burnout',
    description:
      'Guía 2026: workload management, señales de sobrecarga, framework en 6 pasos, métricas (utilización, plazos, criticidad) y herramientas por categorías. Cultura, límites y visibilidad para equipos y agencias.',
    date: '2026-03-26',
    href: '/blog/gestion-carga-trabajo-equipo-sin-burnout',
    readingMinutes: 24,
    relatedSlug: 'kpis-agencias-marketing-2026',
  },
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
    date: '2026-03-18',
    href: '/blog/planificacion-proyectos-cronograma-recursos',
    readingMinutes: 10,
    relatedSlug: 'que-es-timeboxing',
  },
  {
    slug: 'que-es-timeboxing',
    title: 'Qué es el timeboxing: guía definitiva de productividad',
    description: 'Descubre la técnica de gestión del tiempo por cajas: qué es, cómo implementarla y cómo llevarla a todo el equipo para aumentar la rentabilidad.',
    date: '2026-03-10',
    href: '/blog/que-es-timeboxing',
    readingMinutes: 12,
    relatedSlug: 'planificacion-proyectos-cronograma-recursos',
  },
  {
    slug: 'ley-parkinson',
    title: 'Ley de Parkinson: qué es, ejemplos y cómo combatirla',
    description:
      'Ley del tiempo, origen burocrático (Marina británica), segunda ley de gastos e ingresos, ley de la trivialidad en reuniones, evidencia y antídotos (timeboxing, plazos).',
    date: '2026-03-14',
    href: '/blog/ley-parkinson',
    readingMinutes: 24,
    relatedSlug: 'que-es-timeboxing',
  },
];
