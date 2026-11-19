export interface BlogPost {
  slug: string;
  slugEn: string;
  title: string;
  titleEn: string;
  /** Title de resultados, ya con la marca. Si falta, el SEO añade «| Taimbox» al H1. */
  seoTitle?: string;
  seoTitleEn?: string;
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
    slug: "capacidad-calendario-vs-capacidad-productiva-equipo",
    slugEn: "calendar-capacity-vs-shippable-team-capacity",
    title: "Capacidad calendario frente a capacidad productiva",
    titleEn: "Calendar capacity versus productive capacity",
    seoTitle: "Capacidad calendario y capacidad útil | Taimbox",
    seoTitleEn: "Calendar capacity versus useful capacity | Taimbox",
    description:
      "Cómo distinguir horas visibles de capacidad útil: señales, una lista semanal y reglas para no prometer fechas con un calendario engañoso.",
    descriptionEn:
      "How to separate visible hours from useful capacity: signals, a weekly checklist and rules that avoid promising dates from a misleading calendar.",
    date: "2026-05-06",
    href: "/blog/capacidad-calendario-vs-capacidad-productiva-equipo",
    hrefEn: "/en/blog/calendar-capacity-vs-shippable-team-capacity",
    readingMinutes: 11,
    relatedSlug: "planificacion-proyectos-cronograma-recursos",
  },
  {
    slug: "por-que-tu-agencia-pierde-rentabilidad-equipo-ocupado",
    slugEn: "why-agency-loses-profitability-busy-team",
    title: "Por qué tu agencia pierde margen con el equipo ocupado",
    titleEn: "Why your agency loses margin when the team is busy",
    seoTitle: "Por qué un equipo ocupado no es rentable | Taimbox",
    seoTitleEn: "A busy team can still miss the margin | Taimbox",
    description:
      "Ocupación alta y margen no siempre van juntos. Utilización, cambios de contexto, horas no facturables y señales para mirar el margen de tu agencia.",
    descriptionEn:
      "High utilization and margin do not always move together. Utilization, context switching, non-billable hours and signals to review your agency margin.",
    date: "2026-03-26",
    href: "/blog/por-que-tu-agencia-pierde-rentabilidad-equipo-ocupado",
    hrefEn: "/en/blog/why-agency-loses-profitability-busy-team",
    readingMinutes: 14,
    relatedSlug: "kpis-agencias-marketing-2026",
  },
  {
    slug: "como-medir-rentabilidad-proyecto-agencia-dejar-vender-horas",
    slugEn: "measure-project-profitability-stop-selling-hours",
    title: "Cómo medir la rentabilidad por proyecto en tu agencia",
    titleEn: "How to measure profitability per project in your agency",
    seoTitle: "Rentabilidad real por proyecto en agencia | Taimbox",
    seoTitleEn: "Per-project profitability in an agency | Taimbox",
    description:
      "Modelos de precio, margen bruto por proyecto y un protocolo de alcance en tres pasos para ver el coste y el margen de cada trabajo.",
    descriptionEn:
      "Pricing models, gross margin per project and a three-step scope protocol to see the cost and margin of each piece of work.",
    date: "2026-03-26",
    href: "/blog/como-medir-rentabilidad-proyecto-agencia-dejar-vender-horas",
    hrefEn: "/en/blog/measure-project-profitability-stop-selling-hours",
    readingMinutes: 12,
    relatedSlug: "planificacion-proyectos-cronograma-recursos",
  },
  {
    slug: "gestion-carga-trabajo-equipo-sin-burnout",
    slugEn: "workload-management-without-burnout",
    title: "Cómo gestionar la carga de trabajo de tu equipo",
    titleEn: "How to manage your team's workload",
    seoTitle: "Carga de trabajo del equipo sin burnout | Taimbox",
    seoTitleEn: "Team workload management without burnout | Taimbox",
    description:
      "Señales de sobrecarga, un marco en seis pasos y métricas de utilización, plazos y criticidad para repartir el trabajo del equipo con límites claros.",
    descriptionEn:
      "Overload signals, a six-step framework and metrics for utilization, deadlines and criticality, so work is shared with clear limits.",
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
    titleEn: "Free resource planning template for agencies",
    seoTitle: "Plantilla gratuita de recursos para agencias | Taimbox",
    seoTitleEn: "Free resource planning template for agencies | Taimbox",
    description:
      "Plantilla en Excel o Google Sheets, con cinco hojas (instrucciones, equipo, proyectos, asignación semanal e insights) para capacidad, utilización y margen.",
    descriptionEn:
      "An Excel or Google Sheets template with five tabs (instructions, team, projects, weekly allocation and insights) for capacity, utilization and margin.",
    date: "2026-03-24",
    href: "/blog/plantilla-planificacion-recursos-agencia",
    hrefEn: "/en/blog/agency-resource-planning-template",
    readingMinutes: 22,
    relatedSlug: "planificacion-proyectos-cronograma-recursos",
  },
  {
    slug: "kpis-agencias-marketing-2026",
    slugEn: "marketing-agency-kpis-2026",
    title: "KPIs para agencias de marketing: 5 métricas para 2026",
    titleEn: "Marketing agency KPIs: 5 metrics for 2026",
    seoTitle: "5 KPIs para agencias de marketing en 2026 | Taimbox",
    seoTitleEn: "5 marketing agency KPIs for 2026 | Taimbox",
    description:
      "Utilización, rentabilidad y ritmo, estimación frente a real, capacidad por departamento y OKR: qué mide cada cifra y qué decisión permite.",
    descriptionEn:
      "Utilization, profitability and pacing, estimate versus actual, capacity by department and OKRs: what each figure measures and which decision it supports.",
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
    titleEn: "Project planning: schedule, budget and resources",
    seoTitle: "Planificar proyectos, plazos y recursos | Taimbox",
    seoTitleEn: "Project planning, schedule and resources | Taimbox",
    description:
      "Cómo alinear cronograma, presupuesto y capacidad del equipo: fases, un diagrama de Gantt y cifras para seguir el avance del proyecto.",
    descriptionEn:
      "How to align schedule, budget and team capacity: phases, a Gantt view and figures to track project progress.",
    date: "2026-03-18",
    href: "/blog/planificacion-proyectos-cronograma-recursos",
    hrefEn: "/en/blog/project-planning-schedule-resources",
    readingMinutes: 10,
    relatedSlug: "que-es-timeboxing",
  },
  {
    slug: "que-es-timeboxing",
    slugEn: "what-is-timeboxing",
    title: "Qué es el timeboxing y cómo llevarlo a tu equipo",
    titleEn: "What timeboxing is and how to roll it out in your team",
    seoTitle: "Timeboxing: qué es y cómo aplicarlo | Taimbox",
    seoTitleEn: "What timeboxing is, with examples | Taimbox",
    description:
      "El timeboxing fija un bloque de tiempo a una tarea. Diferencias con el time blocking, bloques rígidos o flexibles, y cómo llevarlo a tu equipo.",
    descriptionEn:
      "Timeboxing gives a task a fixed time box. See how it differs from time blocking, when to use a hard or soft box, and how to bring it to your team.",
    date: "2026-03-10",
    href: "/blog/que-es-timeboxing",
    hrefEn: "/en/blog/what-is-timeboxing",
    readingMinutes: 12,
    relatedSlug: "planificacion-proyectos-cronograma-recursos",
  },
  {
    slug: "ley-parkinson",
    slugEn: "parkinsons-law",
    title: "Ley de Parkinson: qué es, ejemplos y cómo acotarla",
    titleEn: "Parkinson's law: what it is, examples and how to cap it",
    seoTitle: "Ley de Parkinson en el trabajo de agencia | Taimbox",
    seoTitleEn: "Parkinson's law in agency work | Taimbox",
    description:
      "El trabajo tiende a llenar el tiempo que le das. Origen, la trivialidad en las reuniones y antídotos con plazos y timeboxing.",
    descriptionEn:
      "Work tends to fill the time you give it. Origin, triviality in meetings, and antidotes with deadlines and timeboxing.",
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
