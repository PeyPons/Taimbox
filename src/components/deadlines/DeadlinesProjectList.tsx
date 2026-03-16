/**
 * Listado de proyectos agrupados por cliente en Deadlines, con filas editables
 * y panel de edición inline (desktop). En móvil el clic abre el Sheet (externo).
 */

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ChevronDown, ChevronRight, Edit, EyeOff, Trash2, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DeadlineEmployeeRow } from '@/components/deadlines/DeadlineEmployeeRow';

export interface InlineFormData {
  employeeHours: Record<string, number>;
  notes: string;
  isHidden: boolean;
  budgetOverride?: number;
}

export interface ProjectItem {
  id: string;
  name: string;
  budgetHours?: number;
  minimumHours?: number;
  clientId?: string;
}

export interface ClientItem {
  id: string;
  name: string;
  color?: string;
}

export interface DeadlineItem {
  projectId: string;
  month: string;
  employeeHours: Record<string, number>;
  notes?: string;
  budgetOverride?: number;
  isHidden?: boolean;
}

export interface EmployeeItem {
  id: string;
  name: string;
  first_name?: string;
  avatarUrl?: string;
}

export interface EditLock {
  employeeId: string;
  employeeName: string;
  lockedAt: string;
}

export interface DeadlinesProjectListProps {
  projectsByClient: Record<string, ProjectItem[]>;
  clients: ClientItem[];
  expandedClients: Set<string>;
  toggleClient: (clientId: string) => void;
  getProjectDeadline: (projectId: string) => DeadlineItem | undefined;
  editingProjectId: string | null;
  inlineFormData: InlineFormData;
  hiddenProjects: Set<string>;
  editingLocks: Record<string, EditLock>;
  currentUserId: string | undefined;
  employees: EmployeeItem[];
  formatProjectName: (name: string) => string;
  isMobile: boolean;
  startEditingProject: (projectId: string) => void;
  updateInlineEmployeeHours: (employeeId: string, hours: number, projectId: string, triggerSave?: boolean) => void;
  onFormPatch: (patch: Partial<InlineFormData>, saveAfterMs?: number) => void;
  autoSaveDeadline: (projectId: string, formData: InlineFormData) => void;
  autoSaveStatus: 'idle' | 'saving' | 'saved';
  cancelEditingProject: () => void;
  onRequestDeleteDeadline: (project: ProjectItem) => void;
}

export function DeadlinesProjectList({
  projectsByClient,
  clients,
  expandedClients,
  toggleClient,
  getProjectDeadline,
  editingProjectId,
  inlineFormData,
  hiddenProjects,
  editingLocks,
  currentUserId,
  employees,
  formatProjectName,
  isMobile,
  startEditingProject,
  updateInlineEmployeeHours,
  onFormPatch,
  autoSaveDeadline,
  autoSaveStatus,
  cancelEditingProject,
  onRequestDeleteDeadline,
}: DeadlinesProjectListProps) {
  const clientEntries = Object.entries(projectsByClient);

  if (clientEntries.length === 0) {
    return (
      <div className="text-center text-slate-500 py-8 bg-white rounded-xl border">
        No hay proyectos para mostrar
      </div>
    );
  }

  return (
    <div className="space-y-3" data-tour="project-list">
      {clientEntries.map(([clientId, clientProjects]) => {
        const isKitDigitalGroup = clientId === 'kit-digital';
        const client = isKitDigitalGroup ? null : clients.find((c) => c.id === clientId);
        const clientName = isKitDigitalGroup ? 'Kit Digital' : (client?.name || 'Sin cliente');
        const clientColor = isKitDigitalGroup ? '#10b981' : (client?.color || '#6b7280');
        const isExpanded = expandedClients.has(clientId);

        return (
          <div key={clientId} className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <button
              type="button"
              onClick={() => toggleClient(clientId)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-slate-400" />
              ) : (
                <ChevronRight className="h-4 w-4 text-slate-400" />
              )}
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: clientColor }}
              />
              <span className="font-bold text-slate-800">{clientName}</span>
              <span className="text-sm text-slate-400">({clientProjects.length} proyectos)</span>
            </button>

            {isExpanded && (
              <div className="border-t divide-y divide-slate-100">
                {clientProjects.map((project) => {
                  const deadline = getProjectDeadline(project.id);
                  const isEditing = editingProjectId === project.id;
                  const currentHours = isEditing
                    ? inlineFormData.employeeHours
                    : (deadline?.employeeHours || {});
                  const totalAssigned = (Object.values(currentHours) as number[]).reduce(
                    (sum, h) => sum + (h || 0),
                    0
                  );
                  const isOverBudget = totalAssigned > (project.budgetHours || 0);
                  const isUnderMin =
                    project.minimumHours != null &&
                    project.minimumHours > 0 &&
                    totalAssigned < project.minimumHours;
                  const isHidden = isEditing
                    ? inlineFormData.isHidden
                    : hiddenProjects.has(project.id);
                  const projectNotes = deadline?.notes;

                  return (
                    <div
                      key={project.id}
                      className={cn(
                        isHidden && 'opacity-40',
                        isEditing && 'bg-primary/10/40',
                        isOverBudget && !isEditing && 'bg-red-50/40'
                      )}
                    >
                      <div
                        className={cn(
                          'flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-slate-50 transition-colors',
                          isEditing && !isMobile && 'hover:bg-primary/10/40'
                        )}
                        onClick={() => !isEditing && startEditingProject(project.id)}
                      >
                        <div className="min-w-[180px]">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-medium text-slate-800">
                              {formatProjectName(project.name)}
                            </span>
                            {isHidden && (
                              <EyeOff className="h-3 w-3 text-slate-400 flex-shrink-0" />
                            )}
                            {!isEditing &&
                              editingLocks[project.id] &&
                              editingLocks[project.id].employeeId !== currentUserId && (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] px-1.5 py-0 bg-amber-50 border-amber-200 text-amber-700"
                                  data-tour="concurrent-editing"
                                >
                                  <Edit className="h-2.5 w-2.5 mr-1" />
                                  {editingLocks[project.id].employeeName}
                                </Badge>
                              )}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                            {project.minimumHours != null && project.minimumHours > 0 && (
                              <span className="text-orange-500 mr-1">
                                mín {project.minimumHours}h ·
                              </span>
                            )}
                            <span>
                              máx{' '}
                              {deadline?.budgetOverride != null
                                ? deadline.budgetOverride
                                : project.budgetHours}
                              h
                              {deadline?.budgetOverride != null &&
                                (deadline.budgetOverride - (project.budgetHours || 0)) !== 0 && (
                                  <span
                                    className={cn(
                                      'ml-1 font-bold',
                                      (deadline.budgetOverride - (project.budgetHours || 0)) > 0
                                        ? 'text-emerald-600'
                                        : 'text-red-500'
                                    )}
                                  >
                                    (
                                    {(deadline.budgetOverride - (project.budgetHours || 0)) > 0
                                      ? '+'
                                      : ''}
                                    {deadline.budgetOverride - (project.budgetHours || 0)}h)
                                  </span>
                                )}
                            </span>
                          </div>
                          {projectNotes && !isEditing && (
                            <div className="text-[11px] text-indigo-500 mt-0.5 italic truncate max-w-[200px]">
                              📝 {projectNotes}
                            </div>
                          )}
                        </div>

                        <div className="flex-1 flex items-center gap-1.5 flex-wrap">
                          {!isEditing &&
                            employees.map((emp) => (
                              <DeadlineEmployeeRow
                                key={emp.id}
                                employee={emp}
                                mode="display"
                                hours={(currentHours as Record<string, number>)[emp.id] || 0}
                              />
                            ))}
                          {!isEditing && totalAssigned === 0 && (
                            <span className="text-xs text-slate-400 italic">Clic para asignar</span>
                          )}
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <span
                              className={cn(
                                'font-mono font-bold text-sm',
                                isOverBudget
                                  ? 'text-red-600'
                                  : isUnderMin
                                    ? 'text-orange-500'
                                    : totalAssigned > 0
                                      ? 'text-slate-700'
                                      : 'text-slate-400'
                              )}
                            >
                              {totalAssigned}h
                            </span>
                            <span className="text-xs text-slate-400">/{project.budgetHours}h</span>
                          </div>
                        </div>
                      </div>

                      {isEditing && !isMobile && (
                        <div
                          className="px-4 py-3 bg-slate-50 border-t"
                          data-tour="inline-editing"
                        >
                          <div className="flex flex-wrap gap-2 mb-3">
                            {employees.map((emp) => (
                              <DeadlineEmployeeRow
                                key={emp.id}
                                employee={emp}
                                mode="edit"
                                value={inlineFormData.employeeHours[emp.id] ?? ''}
                                projectId={project.id}
                                onHoursChange={updateInlineEmployeeHours}
                              />
                            ))}
                          </div>
                          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-200">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs text-slate-500">Ajuste:</span>
                              <Input
                                type="number"
                                placeholder="0"
                                value={
                                  inlineFormData.budgetOverride !== undefined
                                    ? inlineFormData.budgetOverride - (project.budgetHours || 0)
                                    : ''
                                }
                                onChange={(e) => {
                                  const adjustment =
                                    e.target.value === '' ? undefined : parseFloat(e.target.value);
                                  const base = project.budgetHours || 0;
                                  const newBudget =
                                    adjustment !== undefined ? base + adjustment : undefined;
                                  onFormPatch({ budgetOverride: newBudget }, 800);
                                }}
                                className={cn(
                                  'h-7 w-16 text-center font-mono text-xs px-1',
                                  inlineFormData.budgetOverride !== undefined &&
                                    inlineFormData.budgetOverride - (project.budgetHours || 0) !==
                                      0 &&
                                    'bg-amber-50 border-amber-200 text-amber-700 font-bold'
                                )}
                              />
                              {inlineFormData.budgetOverride !== undefined &&
                                inlineFormData.budgetOverride - (project.budgetHours || 0) !==
                                  0 && (
                                  <span className="text-[10px] text-slate-400 font-mono">
                                    = {inlineFormData.budgetOverride}h
                                  </span>
                                )}
                            </div>
                            <Input
                              placeholder="Notas..."
                              value={inlineFormData.notes}
                              onChange={(e) =>
                                onFormPatch({ notes: e.target.value }, 800)
                              }
                              onBlur={() => autoSaveDeadline(project.id, inlineFormData)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  autoSaveDeadline(project.id, inlineFormData);
                                  (e.target as HTMLInputElement).blur();
                                }
                              }}
                              className="h-7 text-xs flex-1 min-w-[150px]"
                            />
                            <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                              <Switch
                                checked={inlineFormData.isHidden}
                                onCheckedChange={(checked) =>
                                  onFormPatch({ isHidden: checked })
                                }
                                className="scale-75"
                              />
                              <span className="text-slate-500">Ocultar</span>
                            </label>
                            <div className="ml-auto flex items-center gap-2 text-xs">
                              {autoSaveStatus === 'saving' && (
                                <span className="text-slate-400 animate-pulse">Guardando...</span>
                              )}
                              {autoSaveStatus === 'saved' && (
                                <span className="text-emerald-600 flex items-center gap-1">
                                  <CheckCircle2 className="h-3 w-3" />
                                  Guardado
                                </span>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 text-xs text-slate-500"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  cancelEditingProject();
                                }}
                              >
                                Cerrar
                              </Button>
                              <div className="h-4 w-px bg-slate-200 mx-1" />
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50"
                                title="Eliminar deadline (Resetear mes)"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onRequestDeleteDeadline(project);
                                }}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
