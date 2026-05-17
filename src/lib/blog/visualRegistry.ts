import { lazy, type ComponentType, type LazyExoticComponent } from "react";

/**
 * Registro de componentes referenciables desde un bloque `visualRef`.
 *
 * - `mode: 'fullPage'`: el componente renderiza la pagina entera (header, footer,
 *   SEO, breadcrumb, JSON-LD). Cuando un post tiene un unico bloque visualRef
 *   con mode=fullPage, BlogArticleDynamicPage delega el render directamente.
 * - `mode: 'inline'`: el componente vive dentro del cuerpo del articulo y se
 *   monta desde BlockRenderer.
 */
export type VisualMode = "fullPage" | "inline";

export interface VisualRegistryEntry {
  Component: LazyExoticComponent<ComponentType<Record<string, unknown>>>;
  mode: VisualMode;
}

const fullPage = (
  importer: () => Promise<{ default: ComponentType<Record<string, unknown>> }>,
): VisualRegistryEntry => ({
  Component: lazy(importer),
  mode: "fullPage",
});

const inline = (
  importer: () => Promise<{ default: ComponentType<Record<string, unknown>> }>,
): VisualRegistryEntry => ({
  Component: lazy(importer),
  mode: "inline",
});

/** lazy() requiere default export; los visuales del blog usan export nombrado. */
function inlineNamed<
  T extends Record<string, ComponentType<Record<string, unknown>>>,
  K extends keyof T,
>(importer: () => Promise<T>, name: K): VisualRegistryEntry {
  return inline(() => importer().then((m) => ({ default: m[name] })));
}

/**
 * Para mantener paridad visual durante la migracion inicial, cada post seedeado
 * referencia el Page.tsx existente como un componente `fullPage`. Asi conservamos
 * TOC, JSON-LD y maquetacion exactos sin reescribir nada en bloques granulares.
 */
export const blogVisualRegistry: Record<string, VisualRegistryEntry> = {
  WhatIsTimeboxingArticle: fullPage(() => import("@/pages/WhatIsTimeboxingPage")),
  LeyParkinsonArticle: fullPage(() => import("@/pages/blog/LeyParkinsonPage")),
  PlanificacionProyectosArticle: fullPage(
    () => import("@/pages/blog/PlanificacionProyectosCronogramaRecursosPage"),
  ),
  KpisAgenciasMarketingArticle: fullPage(
    () => import("@/pages/blog/KpisAgenciasMarketingPage"),
  ),
  PlantillaPlanificacionRecursosArticle: fullPage(
    () => import("@/pages/blog/PlantillaPlanificacionRecursosPage"),
  ),
  GestionCargaTrabajoEquipoArticle: fullPage(
    () => import("@/pages/blog/GestionCargaTrabajoEquipoPage"),
  ),
  ComoMedirRentabilidadProyectoArticle: fullPage(
    () => import("@/pages/blog/ComoMedirRentabilidadProyectoPage"),
  ),
  PorQueAgenciaPierdeRentabilidadArticle: fullPage(
    () => import("@/pages/blog/PorQueAgenciaPierdeRentabilidadPage"),
  ),
  CapacidadCalendarioVsProductivaArticle: fullPage(
    () => import("@/pages/blog/CapacidadCalendarioVsProductivaPage"),
  ),

  // Visuales reutilizables disponibles como bloques inline (graficos/infografias).
  CargaTrabajoFrameworkVisual: inlineNamed(
    () => import("@/components/landing/blog/CargaTrabajoFrameworkVisual"),
    "CargaTrabajoFrameworkVisual",
  ),
  ParkinsonLawVisual: inlineNamed(
    () => import("@/components/landing/blog/ParkinsonLawVisual"),
    "ParkinsonLawVisual",
  ),
  OcupacionVsRentabilidadChart: inlineNamed(
    () => import("@/components/landing/blog/OcupacionVsRentabilidadChart"),
    "OcupacionVsRentabilidadChart",
  ),
  ScopeProtocoloInfographic: inlineNamed(
    () => import("@/components/landing/blog/ScopeProtocoloInfographic"),
    "ScopeProtocoloInfographic",
  ),
  SenalesCargaAlertaVisual: inlineNamed(
    () => import("@/components/landing/blog/SenalesCargaAlertaVisual"),
    "SenalesCargaAlertaVisual",
  ),
  PlanificacionFasesVisual: inlineNamed(
    () => import("@/components/landing/blog/PlanificacionFasesVisual"),
    "PlanificacionFasesVisual",
  ),
  PlanificacionGanttCompareVisual: inlineNamed(
    () => import("@/components/landing/blog/PlanificacionGanttCompareVisual"),
    "PlanificacionGanttCompareVisual",
  ),
  PlanificacionTriangleVisual: inlineNamed(
    () => import("@/components/landing/blog/PlanificacionTriangleVisual"),
    "PlanificacionTriangleVisual",
  ),
  PlanificacionCapacityCardsVisual: inlineNamed(
    () => import("@/components/landing/blog/PlanificacionCapacityCardsVisual"),
    "PlanificacionCapacityCardsVisual",
  ),
  PlanificacionKpiCardsVisual: inlineNamed(
    () => import("@/components/landing/blog/PlanificacionKpiCardsVisual"),
    "PlanificacionKpiCardsVisual",
  ),
};

export function getVisualEntry(visualId: string): VisualRegistryEntry | undefined {
  return blogVisualRegistry[visualId];
}

export function listVisualIds(): { id: string; mode: VisualMode }[] {
  return Object.entries(blogVisualRegistry).map(([id, entry]) => ({
    id,
    mode: entry.mode,
  }));
}
