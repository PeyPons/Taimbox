export interface BlogPost {
  slug: string;
  slugEn: string;
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
  date: string;
  href: string;
  hrefEn: string;
  readingMinutes: number;
  relatedSlug?: string;
}

export const blogPosts: BlogPost[] = [
  {
    slug: "por-que-tu-agencia-pierde-rentabilidad-equipo-ocupado",
    slugEn: "why-agency-loses-profitability-busy-team",
    title: "Por qué tu agencia pierde rentabilidad aunque el equipo esté siempre ocupado",
    titleEn: "Why your agency loses profitability even when the team is always busy",
    description:
      "Ocupación alta vs margen real: utilización, context switching, presencialismo digital, horas no facturables, scope creep y métricas que sí predicen rentabilidad. Sin venderte herramientas: datos, tablas y qué hacer esta semana.",
    descriptionEn:
      "High utilization vs real margin: utilization, context switching, digital presenteeism, non-billable hours, scope creep, and metrics that actually predict profitability. Data, tables, and what to do this week.",
    date: "2026-03-26",
    href: "/blog/por-que-tu-agencia-pierde-rentabilidad-equipo-ocupado",
    hrefEn: "/en/blog/why-agency-loses-profitability-busy-team",
    readingMinutes: 14,
    relatedSlug: "kpis-agencias-marketing-2026",
  },
  {
    slug: "como-medir-rentabilidad-proyecto-agencia-dejar-vender-horas",
    slugEn: "measure-project-profitability-stop-selling-hours",
    title: "Cómo medir la rentabilidad real por proyecto en tu agencia (y dejar de vender horas)",
    titleEn: "How to measure real per-project profitability (and stop selling hours)",
    description:
      "Modelos de pricing (horas, retainer, valor, híbrido), margen bruto por proyecto, protocolo de alcance en tres pasos y sprints para proteger márgenes. Enlace natural con planificación y timeboxing.",
    descriptionEn:
      "Pricing models (hourly, retainer, value, hybrid), gross margin per project, a three-step scope protocol, and sprints to protect margins. Ties naturally to planning and timeboxing.",
    date: "2026-03-26",
    href: "/blog/como-medir-rentabilidad-proyecto-agencia-dejar-vender-horas",
    hrefEn: "/en/blog/measure-project-profitability-stop-selling-hours",
    readingMinutes: 12,
    relatedSlug: "planificacion-proyectos-cronograma-recursos",
  },
  {
    slug: "gestion-carga-trabajo-equipo-sin-burnout",
    slugEn: "workload-management-without-burnout",
    title: "Cómo gestionar la carga de trabajo de tu equipo sin burnout",
    titleEn: "How to manage team workload without burnout",
    description:
      "Guía 2026: workload management, señales de sobrecarga, framework en 6 pasos, métricas (utilización, plazos, criticidad) y herramientas por categorías. Cultura, límites y visibilidad para equipos y agencias.",
    descriptionEn:
      "2026 guide: workload management, overload signals, a 6-step framework, metrics (utilization, deadlines, criticality), and tools by category. Culture, boundaries, and visibility for teams and agencies.",
    date: "2026-03-26",
    href: "/blog/gestion-carga-trabajo-equipo-sin-burnout",
    hrefEn: "/en/blog/workload-management-without-burnout",
    readingMinutes: 24,
    relatedSlug: "kpis-agencias-marketing-2026",
  },
  {
    slug: "plantilla-planificacion-recursos-agencia",
    slugEn: "agency-resource-planning-template",
    title: "Plantilla gratuita de planificación de recursos para agencias",
    titleEn: "Free agency resource planning template",
    description:
      "Descarga gratis una plantilla de planificación de recursos para agencias en Excel o Google Sheets: 5 hojas con fórmulas, formato condicional, desplegables y protección de celdas. Calcula capacidad neta, utilización y margen.",
    descriptionEn:
      "Download a free agency resource planning template for Excel or Google Sheets: 5 sheets with formulas, conditional formatting, dropdowns, and protected cells. Net capacity, utilization, and margin.",
    date: "2026-03-24",
    href: "/blog/plantilla-planificacion-recursos-agencia",
    hrefEn: "/en/blog/agency-resource-planning-template",
    readingMinutes: 22,
    relatedSlug: "planificacion-proyectos-cronograma-recursos",
  },
  {
    slug: "kpis-agencias-marketing-2026",
    slugEn: "marketing-agency-kpis-2026",
    title: "KPIs para agencias de marketing: 5 métricas que sí importan en 2026",
    titleEn: "Marketing agency KPIs: 5 metrics that matter in 2026",
    description:
      "Utilización, rentabilidad y pacing, estimación vs real, capacidad por departamento y OKRs: métricas accionables, qué hacer si el número falla y por qué medir bien no debería ser arqueología en Excel.",
    descriptionEn:
      "Utilization, profitability and pacing, estimate vs actual, capacity by department, and OKRs: actionable metrics, what to do when a number fails, and why measuring well should not be Excel archaeology.",
    date: "2026-03-23",
    href: "/blog/kpis-agencias-marketing-2026",
    hrefEn: "/en/blog/marketing-agency-kpis-2026",
    readingMinutes: 16,
    relatedSlug: "planificacion-proyectos-cronograma-recursos",
  },
  {
    slug: "planificacion-proyectos-cronograma-recursos",
    slugEn: "project-planning-schedule-resources",
    title: "Planificación de proyectos: cronograma, presupuesto y recursos",
    titleEn: "Project planning: schedule, budget, and resources",
    description:
      "Guía práctica para unir cronograma, presupuesto y capacidad del equipo. Incluye diagrama de Gantt, fases del proyecto, KPIs y herramientas.",
    descriptionEn:
      "Practical guide to align schedule, budget, and team capacity. Gantt diagram, project phases, KPIs, and tools.",
    date: "2026-03-18",
    href: "/blog/planificacion-proyectos-cronograma-recursos",
    hrefEn: "/en/blog/project-planning-schedule-resources",
    readingMinutes: 10,
    relatedSlug: "que-es-timeboxing",
  },
  {
    slug: "que-es-timeboxing",
    slugEn: "what-is-timeboxing",
    title: "Qué es el timeboxing: guía definitiva de productividad",
    titleEn: "What is timeboxing: the definitive productivity guide",
    description:
      "Descubre la técnica de gestión del tiempo por cajas: qué es, cómo implementarla y cómo llevarla a todo el equipo para aumentar la rentabilidad.",
    descriptionEn:
      "Timeboxing explained: what it is, how to implement it, and how to roll it out across the team to improve profitability.",
    date: "2026-03-10",
    href: "/blog/que-es-timeboxing",
    hrefEn: "/en/blog/what-is-timeboxing",
    readingMinutes: 12,
    relatedSlug: "planificacion-proyectos-cronograma-recursos",
  },
  {
    slug: "ley-parkinson",
    slugEn: "parkinsons-law",
    title: "Ley de Parkinson: qué es, ejemplos y cómo combatirla",
    titleEn: "Parkinson's law: what it is, examples, and how to fight it",
    description:
      "Ley del tiempo, origen burocrático (Marina británica), segunda ley de gastos e ingresos, ley de la trivialidad en reuniones, evidencia y antídotos (timeboxing, plazos).",
    descriptionEn:
      "Work expands to fill the time available, bureaucratic origin, expenses vs revenue, triviality in meetings, evidence, and antidotes (timeboxing, deadlines).",
    date: "2026-03-14",
    href: "/blog/ley-parkinson",
    hrefEn: "/en/blog/parkinsons-law",
    readingMinutes: 24,
    relatedSlug: "que-es-timeboxing",
  },
];

export function findBlogPostByPath(pathname: string): BlogPost | undefined {
  const p = pathname.split("?")[0] ?? pathname;
  return blogPosts.find((post) => post.href === p || post.hrefEn === p);
}

export function getBlogPostLocaleFields(post: BlogPost, lng: string) {
  const en = lng.startsWith("en");
  return {
    title: en ? post.titleEn : post.title,
    description: en ? post.descriptionEn : post.description,
    href: en ? post.hrefEn : post.href,
  };
}
