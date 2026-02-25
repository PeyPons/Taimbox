import { useMemo, useState } from 'react';
import { KanbanTask, KanbanTaskStatus, KANBAN_COLUMNS } from '@/types';
import { KanbanColumn } from './KanbanColumn';
import { useApp } from '@/contexts/AppContext';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface KanbanBoardProps {
  tasksByStatus: Record<KanbanTaskStatus, KanbanTask[]>;
  onMoveTask: (taskId: string, newStatus: KanbanTaskStatus) => void;
  onOpenDetail: (task: KanbanTask) => void;
  onDeleteTask: (taskId: string) => void;
  clientFilter: string | null;
}

export function KanbanBoard({ tasksByStatus, onMoveTask, onOpenDetail, onDeleteTask, clientFilter }: KanbanBoardProps) {
  const { clients } = useApp();
  const [searchQuery, setSearchQuery] = useState('');

  const clientsMap = useMemo(() => {
    const map = new Map<string, { name: string; color: string }>();
    (clients || []).forEach(c => map.set(c.id, { name: c.name, color: c.color }));
    return map;
  }, [clients]);

  const filteredTasksByStatus = useMemo(() => {
    const result: Record<KanbanTaskStatus, KanbanTask[]> = {
      'backlog': [], 'todo': [], 'in-progress': [], 'review': [], 'done': [],
    };

    for (const [status, tasks] of Object.entries(tasksByStatus) as [KanbanTaskStatus, KanbanTask[]][]) {
      result[status] = tasks.filter(task => {
        if (clientFilter && task.clientId !== clientFilter) return false;
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          const client = clientsMap.get(task.clientId);
          if (
            !task.title.toLowerCase().includes(query) &&
            !(client?.name || '').toLowerCase().includes(query) &&
            !(task.platform || '').toLowerCase().includes(query)
          ) return false;
        }
        return true;
      });
    }

    return result;
  }, [tasksByStatus, clientFilter, searchQuery, clientsMap]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar tarea..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>
        {clientFilter && (
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: clientsMap.get(clientFilter)?.color || '#6b7280' }} />
            Filtrando: <span className="font-medium text-slate-700">{clientsMap.get(clientFilter)?.name}</span>
          </div>
        )}
      </div>

      <div className="flex gap-3 overflow-x-auto pb-4">
        {KANBAN_COLUMNS.map(col => (
          <KanbanColumn
            key={col.key}
            status={col.key}
            label={col.label}
            tasks={filteredTasksByStatus[col.key]}
            clientsMap={clientsMap}
            onMoveTask={onMoveTask}
            onOpenDetail={onOpenDetail}
            onDeleteTask={onDeleteTask}
          />
        ))}
      </div>
    </div>
  );
}
