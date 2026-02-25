import { KanbanTask, KanbanTaskStatus, KANBAN_COLUMNS } from '@/types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Flame, FolderKanban, RotateCw, ChevronRight, MoreHorizontal, Trash2, Calendar as CalendarIcon, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface KanbanTaskCardProps {
  task: KanbanTask;
  clientName: string;
  clientColor: string;
  onMoveTask: (taskId: string, newStatus: KanbanTaskStatus) => void;
  onOpenDetail: (task: KanbanTask) => void;
  onDeleteTask: (taskId: string) => void;
}

const PRIORITY_STYLES: Record<string, string> = {
  urgent: 'bg-red-100 text-red-700 border-red-200',
  high: 'bg-orange-100 text-orange-700 border-orange-200',
  medium: 'bg-blue-100 text-blue-700 border-blue-200',
  low: 'bg-slate-100 text-slate-600 border-slate-200',
};

const PRIORITY_LABELS: Record<string, string> = {
  urgent: 'Urgente',
  high: 'Alta',
  medium: 'Media',
  low: 'Baja',
};

export function KanbanTaskCard({ task, clientName, clientColor, onMoveTask, onOpenDetail, onDeleteTask }: KanbanTaskCardProps) {
  const sopTotal = task.sopChecklist?.length || 0;
  const sopCompleted = task.sopChecklist?.filter(s => s.isCompleted).length || 0;

  const nextStatuses = KANBAN_COLUMNS
    .map(c => c.key)
    .filter(s => s !== task.status);

  if (task.taskType === 'FIRE') {
    return (
      <Card
        className="p-3 border-red-300 bg-red-50 shadow-sm cursor-pointer hover:shadow-md transition-shadow ring-1 ring-red-200 animate-in fade-in duration-300"
        onClick={() => onOpenDetail(task)}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <Flame className="h-4 w-4 text-red-600 shrink-0 animate-pulse" />
            <span className="font-semibold text-red-900 text-sm truncate">{task.title}</span>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 text-red-400 hover:text-red-600">
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              {nextStatuses.map(s => (
                <DropdownMenuItem key={s} onClick={e => { e.stopPropagation(); onMoveTask(task.id, s); }}>
                  <ChevronRight className="h-3.5 w-3.5 mr-2" />
                  {KANBAN_COLUMNS.find(c => c.key === s)?.label}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600" onClick={e => { e.stopPropagation(); onDeleteTask(task.id); }}>
                <Trash2 className="h-3.5 w-3.5 mr-2" />Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: clientColor }} />
          <span className="text-xs text-red-700 truncate">{clientName}</span>
          {task.platform && <Badge variant="outline" className="text-[10px] h-4 border-red-200 text-red-600">{task.platform}</Badge>}
        </div>
      </Card>
    );
  }

  if (task.taskType === 'PROJECT') {
    return (
      <Card
        className="p-3 border-slate-200 bg-white shadow-sm cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => onOpenDetail(task)}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <FolderKanban className="h-4 w-4 text-primary shrink-0" />
            <span className="font-medium text-slate-900 text-sm truncate">{task.title}</span>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              {nextStatuses.map(s => (
                <DropdownMenuItem key={s} onClick={e => { e.stopPropagation(); onMoveTask(task.id, s); }}
                  disabled={s === 'done' && sopTotal > 0 && sopCompleted < sopTotal}
                >
                  <ChevronRight className="h-3.5 w-3.5 mr-2" />
                  {KANBAN_COLUMNS.find(c => c.key === s)?.label}
                  {s === 'done' && sopTotal > 0 && sopCompleted < sopTotal && <span className="ml-1 text-[10px]">(SOP)</span>}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600" onClick={e => { e.stopPropagation(); onDeleteTask(task.id); }}>
                <Trash2 className="h-3.5 w-3.5 mr-2" />Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-2 mt-2">
          <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: clientColor }} />
          <span className="text-xs text-slate-500 truncate">{clientName}</span>
          <Badge className={cn("text-[10px] h-4 border", PRIORITY_STYLES[task.priority])}>{PRIORITY_LABELS[task.priority]}</Badge>
          {task.platform && <Badge variant="outline" className="text-[10px] h-4">{task.platform}</Badge>}
        </div>

        {sopTotal > 0 && (
          <div className="mt-2.5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-slate-500 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Checklist
              </span>
              <span className={cn("text-[10px] font-mono font-medium", sopCompleted === sopTotal ? "text-emerald-600" : "text-slate-500")}>
                {sopCompleted}/{sopTotal}
              </span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all", sopCompleted === sopTotal ? "bg-emerald-500" : "bg-primary")}
                style={{ width: `${sopTotal > 0 ? (sopCompleted / sopTotal) * 100 : 0}%` }}
              />
            </div>
          </div>
        )}

        {task.dueDate && (
          <div className="flex items-center gap-1 mt-2 text-[10px] text-slate-400">
            <CalendarIcon className="h-3 w-3" />
            {format(parseISO(task.dueDate), 'd MMM', { locale: es })}
          </div>
        )}
      </Card>
    );
  }

  // ROUTINE: compact card
  return (
    <Card
      className="px-3 py-2 border-slate-200 bg-slate-50/50 cursor-pointer hover:bg-slate-100 transition-colors"
      onClick={() => onOpenDetail(task)}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <RotateCw className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          <span className="text-sm text-slate-700 truncate">{task.title}</span>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
              <MoreHorizontal className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            {nextStatuses.map(s => (
              <DropdownMenuItem key={s} onClick={e => { e.stopPropagation(); onMoveTask(task.id, s); }}>
                <ChevronRight className="h-3.5 w-3.5 mr-2" />
                {KANBAN_COLUMNS.find(c => c.key === s)?.label}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600" onClick={e => { e.stopPropagation(); onDeleteTask(task.id); }}>
              <Trash2 className="h-3.5 w-3.5 mr-2" />Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="flex items-center gap-2 mt-1">
        <div className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: clientColor }} />
        <span className="text-[10px] text-slate-400 truncate">{clientName}</span>
        {task.platform && <span className="text-[10px] text-slate-400">· {task.platform}</span>}
      </div>
    </Card>
  );
}
