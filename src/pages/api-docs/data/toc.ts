import {
  BookOpen,
  Key,
  Globe,
  AlertTriangle,
  GraduationCap,
  Terminal,
  Plug,
  Filter,
  Zap,
  Database,
  History,
} from 'lucide-react';
import type { TocGroup } from './types';

export const TOC_GROUPS: TocGroup[] = [
  {
    title: 'Overview',
    icon: BookOpen,
    defaultOpen: true,
    items: [
      { id: 'intro', label: 'Introduccion' },
      { id: 'auth', label: 'Autenticacion y seguridad' },
      { id: 'base-url', label: 'Base URL y headers' },
      { id: 'responses', label: 'Respuestas y errores' },
      { id: 'changelog', label: 'Changelog' },
    ],
  },
  {
    title: 'Tutoriales',
    icon: GraduationCap,
    defaultOpen: false,
    items: [
      { id: 'tutorial-quickstart', label: 'Primeros pasos' },
      { id: 'tutorial-sync-team', label: 'Sincronizar equipo' },
      { id: 'tutorial-planning', label: 'Automatizar planificacion' },
      { id: 'tutorial-reports', label: 'Exportar reportes' },
      { id: 'tutorial-absences', label: 'Gestionar ausencias' },
    ],
  },
  {
    title: 'SDK y REST',
    icon: Terminal,
    defaultOpen: false,
    items: [
      { id: 'sdk', label: 'SDK JavaScript' },
      { id: 'rest', label: 'API REST (HTTP)' },
      { id: 'filtering', label: 'Filtrado y paginacion' },
      { id: 'realtime', label: 'Suscripciones Realtime' },
    ],
  },
  {
    title: 'Referencia de Recursos',
    icon: Database,
    defaultOpen: false,
    items: [
      { id: 'res-organizacion', label: 'Organizacion' },
      { id: 'res-planificacion', label: 'Planificacion' },
      { id: 'res-transferencias', label: 'Transferencias' },
      { id: 'res-ausencias', label: 'Ausencias y eventos' },
      { id: 'res-configuracion', label: 'Configuracion' },
      { id: 'res-feedback', label: 'Feedback' },
      { id: 'res-objetivos', label: 'Objetivos' },
      { id: 'res-bloqueos', label: 'Bloqueos de edicion' },
    ],
  },
];

export function getAllSectionIds(): string[] {
  return TOC_GROUPS.flatMap((g) => g.items.map((i) => i.id));
}
