import {
  BookOpen,
  GraduationCap,
  Terminal,
  Database,
} from 'lucide-react';
import type { TocGroup } from './types';

export const TOC_GROUPS: TocGroup[] = [
  {
    titleKey: 'toc.groups.overview',
    icon: BookOpen,
    defaultOpen: true,
    items: [
      { id: 'intro', labelKey: 'toc.items.intro' },
      { id: 'auth', labelKey: 'toc.items.auth' },
      { id: 'base-url', labelKey: 'toc.items.baseUrl' },
      { id: 'responses', labelKey: 'toc.items.responses' },
      { id: 'rls-limits', labelKey: 'toc.items.rlsLimits' },
      { id: 'changelog', labelKey: 'toc.items.changelog' },
    ],
  },
  {
    titleKey: 'toc.groups.tutorials',
    icon: GraduationCap,
    defaultOpen: false,
    items: [
      { id: 'tutorial-quickstart', labelKey: 'toc.items.tutorialQuickstart' },
      { id: 'tutorial-sync-team', labelKey: 'toc.items.tutorialSyncTeam' },
      { id: 'tutorial-planning', labelKey: 'toc.items.tutorialPlanning' },
      { id: 'tutorial-time-tracking', labelKey: 'toc.items.tutorialTimeTracking' },
      { id: 'tutorial-transfers', labelKey: 'toc.items.tutorialTransfers' },
      { id: 'tutorial-reports', labelKey: 'toc.items.tutorialReports' },
      { id: 'tutorial-absences', labelKey: 'toc.items.tutorialAbsences' },
      { id: 'tutorial-configuration', labelKey: 'toc.items.tutorialConfiguration' },
      { id: 'tutorial-feedback', labelKey: 'toc.items.tutorialFeedback' },
      { id: 'tutorial-goals', labelKey: 'toc.items.tutorialGoals' },
      { id: 'tutorial-locks', labelKey: 'toc.items.tutorialLocks' },
    ],
  },
  {
    titleKey: 'toc.groups.sdkRest',
    icon: Terminal,
    defaultOpen: false,
    items: [
      { id: 'sdk', labelKey: 'toc.items.sdk' },
      { id: 'openapi', labelKey: 'toc.items.openapi' },
      { id: 'rest', labelKey: 'toc.items.rest' },
      { id: 'filtering', labelKey: 'toc.items.filtering' },
      { id: 'realtime', labelKey: 'toc.items.realtime' },
    ],
  },
  {
    titleKey: 'toc.groups.reference',
    icon: Database,
    defaultOpen: false,
    items: [
      { id: 'res-organizacion', labelKey: 'toc.items.resOrganizacion' },
      { id: 'res-planificacion', labelKey: 'toc.items.resPlanificacion' },
      { id: 'res-transferencias', labelKey: 'toc.items.resTransferencias' },
      { id: 'res-ausencias', labelKey: 'toc.items.resAusencias' },
      { id: 'res-configuracion', labelKey: 'toc.items.resConfiguracion' },
      { id: 'res-feedback', labelKey: 'toc.items.resFeedback' },
      { id: 'res-objetivos', labelKey: 'toc.items.resObjetivos' },
      { id: 'res-bloqueos', labelKey: 'toc.items.resBloqueos' },
    ],
  },
];

export function getAllSectionIds(): string[] {
  return TOC_GROUPS.flatMap((g) => g.items.map((i) => i.id));
}
