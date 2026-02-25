import { useState, useEffect, useMemo } from 'react';
import { KanbanTask, KanbanTaskStatus, KanbanTaskPriority, KANBAN_COLUMNS, SOPItem } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SOPChecklist } from './SOPChecklist';
import { useSOPTemplates } from '@/hooks/useSOPTemplates';
import { useApp } from '@/contexts/AppContext';
import { Flame, FolderKanban, RotateCw, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface KanbanTaskModalProps {
  task: KanbanTask | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateTask: (taskId: string, updates: Partial<KanbanTask>) => Promise<boolean>;
  onMoveTask: (taskId: string, newStatus: KanbanTaskStatus) => Promise<boolean>;
}

const TYPE_CONFIG = {
  FIRE: { icon: Flame, label: 'Urgente', color: 'text-red-600', bg: 'bg-red-50' },
  PROJECT: { icon: FolderKanban, label: 'Proyecto', color: 'text-primary', bg: 'bg-primary/5' },
  ROUTINE: { icon: RotateCw, label: 'Rutina', color: 'text-slate-500', bg: 'bg-slate-50' },
};

const PRIORITY_LABELS: Record<KanbanTaskPriority, string> = {
  urgent: 'Urgente', high: 'Alta', medium: 'Media', low: 'Baja',
};

export function KanbanTaskModal({ task, open, onOpenChange, onUpdateTask, onMoveTask }: KanbanTaskModalProps) {
  const { clients } = useApp();
  const { templates } = useSOPTemplates();
  const [localChecklist, setLocalChecklist] = useState<SOPItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (task) {
      setLocalChecklist(task.sopChecklist || []);
    }
  }, [task]);

  if (!task) return null;

  const typeConfig = TYPE_CONFIG[task.taskType];
  const Icon = typeConfig.icon;
  const client = (clients || []).find(c => c.id === task.clientId);

  const sopTotal = localChecklist.length;
  const sopCompleted = localChecklist.filter(i => i.isCompleted).length;
  const canMoveToDone = task.taskType !== 'PROJECT' || sopTotal === 0 || sopCompleted === sopTotal;

  const currentColumnIdx = KANBAN_COLUMNS.findIndex(c => c.key === task.status);
  const nextColumn = currentColumnIdx < KANBAN_COLUMNS.length - 1 ? KANBAN_COLUMNS[currentColumnIdx + 1] : null;

  const handleChecklistChange = async (newChecklist: SOPItem[]) => {
    setLocalChecklist(newChecklist);
    await onUpdateTask(task.id, { sopChecklist: newChecklist });
  };

  const handleLoadTemplate = async (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (!template) return;
    const newChecklist: SOPItem[] = template.items.map(item => ({
      id: item.id,
      text: item.text,
      isCompleted: false,
    }));
    setLocalChecklist(newChecklist);
    await onUpdateTask(task.id, { sopChecklist: newChecklist, sopTemplateId: templateId });
  };

  const handleMoveNext = async () => {
    if (!nextColumn) return;
    if (nextColumn.key === 'done' && !canMoveToDone) return;
    setIsSaving(true);
    await onMoveTask(task.id, nextColumn.key);
    setIsSaving(false);
    onOpenChange(false);
  };

  const handleStatusChange = async (newStatus: KanbanTaskStatus) => {
    if (newStatus === 'done' && !canMoveToDone) return;
    setIsSaving(true);
    await onMoveTask(task.id, newStatus);
    setIsSaving(false);
  };

  const handlePriorityChange = async (newPriority: KanbanTaskPriority) => {
    await onUpdateTask(task.id, { priority: newPriority });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className={cn("h-5 w-5", typeConfig.color)} />
            {task.title}
          </DialogTitle>
        </DialogHeader>

        <div className={cn("grid gap-6", task.taskType === 'PROJECT' && sopTotal > 0 ? "sm:grid-cols-2" : "")}>
          {/* Left: Task details */}
          <div className="space-y-4">
            <div className="space-y-3">
              {/* Client */}
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: client?.color || '#6b7280' }} />
                <span className="text-sm font-medium text-slate-700">{client?.name || 'Sin cliente'}</span>
              </div>

              {/* Type Badge */}
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={cn("text-xs", typeConfig.bg, typeConfig.color)}>
                  {typeConfig.label}
                </Badge>
                {task.platform && <Badge variant="outline" className="text-xs">{task.platform}</Badge>}
              </div>

              {/* Status */}
              <div className="space-y-1">
                <label className="text-xs text-slate-500 font-medium">Estado</label>
                <Select value={task.status} onValueChange={handleStatusChange}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {KANBAN_COLUMNS.map(col => (
                      <SelectItem
                        key={col.key}
                        value={col.key}
                        disabled={col.key === 'done' && !canMoveToDone}
                      >
                        {col.label}
                        {col.key === 'done' && !canMoveToDone && ' (SOP incompleto)'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Priority */}
              <div className="space-y-1">
                <label className="text-xs text-slate-500 font-medium">Prioridad</label>
                <Select value={task.priority} onValueChange={handlePriorityChange}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PRIORITY_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date */}
              {task.dueDate && (
                <div className="text-xs text-slate-500">
                  Fecha límite: <span className="font-medium text-slate-700">
                    {format(parseISO(task.dueDate), "d 'de' MMMM yyyy", { locale: es })}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right: SOP Checklist (only for PROJECT tasks with checklist) */}
          {task.taskType === 'PROJECT' && (
            <div className="space-y-3">
              {sopTotal === 0 && templates.length > 0 && (
                <div className="space-y-2">
                  <label className="text-xs text-slate-500 font-medium">Cargar plantilla SOP</label>
                  <Select onValueChange={handleLoadTemplate}>
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="Seleccionar plantilla..." />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map(t => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {sopTotal > 0 && (
                <SOPChecklist
                  items={localChecklist}
                  onChange={handleChecklistChange}
                />
              )}

              {!canMoveToDone && (
                <div className="flex items-start gap-2 rounded-md bg-amber-50 border border-amber-200 p-2.5 text-xs text-amber-700">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>No se puede mover a <strong>Hecho</strong> hasta completar todos los pasos del checklist.</span>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="flex-row justify-between sm:justify-between">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
          {nextColumn && (
            <Button
              onClick={handleMoveNext}
              disabled={isSaving || (nextColumn.key === 'done' && !canMoveToDone)}
            >
              Mover a {nextColumn.label}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
