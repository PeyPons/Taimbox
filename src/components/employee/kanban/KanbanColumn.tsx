import { KanbanTask, KanbanTaskStatus } from '@/types';
import { KanbanTaskCard } from './KanbanTaskCard';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface KanbanColumnProps {
  status: KanbanTaskStatus;
  label: string;
  tasks: KanbanTask[];
  clientsMap: Map<string, { name: string; color: string }>;
  onMoveTask: (taskId: string, newStatus: KanbanTaskStatus) => void;
  onOpenDetail: (task: KanbanTask) => void;
  onDeleteTask: (taskId: string) => void;
}

const COLUMN_HEADER_STYLES: Record<KanbanTaskStatus, string> = {
  'backlog': 'border-t-slate-400',
  'todo': 'border-t-blue-400',
  'in-progress': 'border-t-amber-400',
  'review': 'border-t-purple-400',
  'done': 'border-t-emerald-400',
};

export function KanbanColumn({ status, label, tasks, clientsMap, onMoveTask, onOpenDetail, onDeleteTask }: KanbanColumnProps) {
  return (
    <div className={cn(
      "flex flex-col min-w-[250px] max-w-[320px] flex-1 bg-slate-50/70 rounded-lg border border-slate-200 border-t-[3px]",
      COLUMN_HEADER_STYLES[status]
    )}>
      <div className="flex items-center justify-between px-3 py-2.5">
        <h3 className="text-sm font-semibold text-slate-700">{label}</h3>
        <Badge variant="secondary" className="text-[10px] h-5 min-w-[20px] justify-center">
          {tasks.length}
        </Badge>
      </div>

      <div className="flex-1 px-2 pb-2 space-y-2 overflow-y-auto max-h-[calc(100vh-320px)]">
        {tasks.length === 0 && (
          <div className="text-center py-8 text-xs text-slate-400">
            Sin tareas
          </div>
        )}
        {tasks.map(task => {
          const client = clientsMap.get(task.clientId);
          return (
            <KanbanTaskCard
              key={task.id}
              task={task}
              clientName={client?.name || 'Sin cliente'}
              clientColor={client?.color || '#6b7280'}
              onMoveTask={onMoveTask}
              onOpenDetail={onOpenDetail}
              onDeleteTask={onDeleteTask}
            />
          );
        })}
      </div>
    </div>
  );
}
