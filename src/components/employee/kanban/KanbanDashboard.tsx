import { useState, useMemo, useCallback } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useAgency } from '@/contexts/AgencyContext';
import { useKanbanTasks } from '@/hooks/useKanbanTasks';
import { useDashboardView } from '@/hooks/useDashboardView';
import { usePermissions } from '@/hooks/usePermissions';
import { KanbanBoard } from './KanbanBoard';
import { KanbanCreateTask } from './KanbanCreateTask';
import { KanbanTaskModal } from './KanbanTaskModal';
import { PendingTransfersPanel } from '@/components/transfers/TaskTransferComponents';
import { AbsencesSheet } from '@/components/team/AbsencesSheet';
import { ProfessionalGoalsSheet } from '@/components/team/ProfessionalGoalsSheet';
import { EmployeeSettings } from '@/components/employee/EmployeeSettings';
import { LoadIndicator } from '@/components/shared/LoadIndicator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { KanbanTask, KanbanTaskStatus } from '@/types';
import { ChevronLeft, ChevronRight, Plus, Calendar, TrendingUp, Columns3, MoreHorizontal, AlertTriangle } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { format, addMonths, subMonths, startOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function KanbanDashboard() {
  const { currentUser, employees, clients, allocations, absences, getEmployeeMonthlyLoad, ensureMonthLoaded } = useApp();
  const { currentAgency } = useAgency();
  const { activeView, setView, isStrict, showToggle } = useDashboardView();

  const [currentMonth, setCurrentMonth] = useState<Date>(startOfMonth(new Date()));
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [selectedTask, setSelectedTask] = useState<KanbanTask | null>(null);
  const [clientFilter, setClientFilter] = useState<string | null>(null);
  const [showAbsences, setShowAbsences] = useState(false);
  const [showGoals, setShowGoals] = useState(false);
  const [activeTab, setActiveTab] = useState('kanban');

  const myEmployeeProfile = currentUser;

  const { tasksByStatus, isLoading, createTask, updateTask, moveTask, deleteTask } = useKanbanTasks(
    myEmployeeProfile?.id,
    currentMonth
  );

  const employeeClients = useMemo(() => {
    if (!myEmployeeProfile) return [];
    const clientIds = new Set<string>();
    Object.values(tasksByStatus).flat().forEach(t => clientIds.add(t.clientId));
    return (clients || []).filter(c => clientIds.has(c.id)).sort((a, b) => a.name.localeCompare(b.name));
  }, [clients, myEmployeeProfile, tasksByStatus]);

  const handlePrevMonth = useCallback(async () => {
    const prev = subMonths(currentMonth, 1);
    setCurrentMonth(prev);
    await ensureMonthLoaded(prev);
  }, [currentMonth, ensureMonthLoaded]);

  const handleNextMonth = useCallback(async () => {
    const next = addMonths(currentMonth, 1);
    setCurrentMonth(next);
    await ensureMonthLoaded(next);
  }, [currentMonth, ensureMonthLoaded]);

  const handleToday = useCallback(async () => {
    const today = startOfMonth(new Date());
    setCurrentMonth(today);
    await ensureMonthLoaded(today);
  }, [ensureMonthLoaded]);

  const handleDeleteTask = useCallback(async (taskId: string) => {
    const success = await deleteTask(taskId);
    if (success) toast.success('Tarea eliminada');
  }, [deleteTask]);

  const handleMoveTask = useCallback(async (taskId: string, newStatus: KanbanTaskStatus) => {
    const task = Object.values(tasksByStatus).flat().find(t => t.id === taskId);
    if (task?.taskType === 'PROJECT' && newStatus === 'done') {
      const sopTotal = task.sopChecklist?.length || 0;
      const sopCompleted = task.sopChecklist?.filter(s => s.isCompleted).length || 0;
      if (sopTotal > 0 && sopCompleted < sopTotal) {
        toast.error('Completa el checklist SOP antes de mover a Hecho');
        return;
      }
    }
    await moveTask(taskId, newStatus);
  }, [moveTask, tasksByStatus]);

  if (!myEmployeeProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-4">
          <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto" />
          <h2 className="text-xl font-semibold text-slate-700">No se encontró tu perfil de empleado</h2>
          <p className="text-slate-500">Contacta con un administrador para vincular tu cuenta.</p>
        </div>
      </div>
    );
  }

  const monthlyLoad = getEmployeeMonthlyLoad(myEmployeeProfile.id, currentMonth.getFullYear(), currentMonth.getMonth());
  const hasAllocations = monthlyLoad.hours > 0;

  const totalTasks = Object.values(tasksByStatus).flat().length;
  const doneTasks = tasksByStatus['done'].length;
  const fireTasks = Object.values(tasksByStatus).flat().filter(t => t.taskType === 'FIRE' && t.status !== 'done').length;

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6 pb-20 animate-in fade-in duration-500">
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-primary/5 via-white to-primary/5 opacity-50" />

      <PendingTransfersPanel />

      {/* Header */}
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div className="flex gap-2 flex-wrap flex-1">
          <Button onClick={() => setShowCreateTask(true)} className="gap-2 bg-primary text-white hover:bg-primary/90">
            <Plus className="h-4 w-4" /> Nueva tarea
          </Button>

          {!isStrict && (
            <Button
              variant="outline"
              className="gap-2 text-slate-600"
              onClick={() => setView('weekly')}
            >
              <Calendar className="h-4 w-4" /> Vista Semanal
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2 border-slate-200">
                <MoreHorizontal className="h-4 w-4" /> <span className="hidden sm:inline">Acciones</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => setShowGoals(true)} className="gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-600" /> Mis Objetivos
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowAbsences(true)} className="gap-2">
                <Calendar className="h-4 w-4 text-amber-600" /> Mis Ausencias
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <EmployeeSettings />
        </div>
      </div>

      {/* Month navigation + load bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handlePrevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <button onClick={handleToday} className="text-lg font-semibold text-slate-800 hover:text-primary transition-colors capitalize">
            {format(currentMonth, 'MMMM yyyy', { locale: es })}
          </button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-4">
          {/* Quick stats */}
          <div className="hidden sm:flex items-center gap-3 text-xs">
            {fireTasks > 0 && (
              <Badge variant="destructive" className="gap-1 animate-pulse">
                {fireTasks} urgente{fireTasks > 1 ? 's' : ''}
              </Badge>
            )}
            <span className="text-slate-500">{totalTasks} tareas · {doneTasks} completadas</span>
          </div>

          {/* Load indicator */}
          <div className="flex items-center gap-2">
            <LoadIndicator
              hours={monthlyLoad.hours}
              capacity={monthlyLoad.capacity}
              status={monthlyLoad.status}
              percentage={monthlyLoad.percentage}
            />
          </div>
        </div>
      </div>

      {/* Warning if no allocations */}
      {!hasAllocations && (
        <Card className="p-3 bg-amber-50 border-amber-200">
          <div className="flex items-start gap-2 text-amber-800 text-sm">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">No tienes horas asignadas este mes</p>
              <p className="text-xs text-amber-700 mt-0.5">
                Contacta con tu responsable para que planifique tus horas en el Planificador. Sin horas asignadas, tu trabajo no aparecerá en los informes de rentabilidad.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Main tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="kanban" className="gap-1.5">
            <Columns3 className="h-3.5 w-3.5" /> Kanban
          </TabsTrigger>
          <TabsTrigger value="overview" className="gap-1.5">
            <TrendingUp className="h-3.5 w-3.5" /> Resumen
          </TabsTrigger>
        </TabsList>

        <TabsContent value="kanban" className="mt-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="h-8 w-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
          ) : (
            <KanbanBoard
              tasksByStatus={tasksByStatus}
              onMoveTask={handleMoveTask}
              onOpenDetail={setSelectedTask}
              onDeleteTask={handleDeleteTask}
              clientFilter={clientFilter}
            />
          )}
        </TabsContent>

        <TabsContent value="overview" className="mt-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Stats cards */}
            <Card className="p-4">
              <div className="text-xs text-slate-500 mb-1">Tareas activas</div>
              <div className="text-2xl font-bold text-slate-900">{totalTasks - doneTasks}</div>
            </Card>
            <Card className="p-4">
              <div className="text-xs text-slate-500 mb-1">Completadas</div>
              <div className="text-2xl font-bold text-emerald-600">{doneTasks}</div>
            </Card>
            <Card className="p-4">
              <div className="text-xs text-slate-500 mb-1">Urgentes</div>
              <div className={cn("text-2xl font-bold", fireTasks > 0 ? "text-red-600" : "text-slate-300")}>{fireTasks}</div>
            </Card>
            <Card className="p-4">
              <div className="text-xs text-slate-500 mb-1">Carga del mes</div>
              <div className="text-2xl font-bold text-slate-900">{Math.round(monthlyLoad.hours)}h <span className="text-sm font-normal text-slate-400">/ {Math.round(monthlyLoad.capacity)}h</span></div>
            </Card>
          </div>

          {/* Tasks by client */}
          {employeeClients.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Tareas por cliente</h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {employeeClients.map(client => {
                  const clientTasks = Object.values(tasksByStatus).flat().filter(t => t.clientId === client.id);
                  const pending = clientTasks.filter(t => t.status !== 'done').length;
                  const done = clientTasks.filter(t => t.status === 'done').length;
                  const fires = clientTasks.filter(t => t.taskType === 'FIRE' && t.status !== 'done').length;

                  return (
                    <Card
                      key={client.id}
                      className={cn(
                        "p-3 cursor-pointer transition-all hover:shadow-md",
                        clientFilter === client.id ? "ring-2 ring-primary" : ""
                      )}
                      onClick={() => {
                        setClientFilter(clientFilter === client.id ? null : client.id);
                        setActiveTab('kanban');
                      }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: client.color }} />
                        <span className="font-medium text-sm text-slate-800 truncate">{client.name}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span>{pending} pendiente{pending !== 1 ? 's' : ''}</span>
                        <span className="text-emerald-600">{done} hecho{done !== 1 ? 's' : ''}</span>
                        {fires > 0 && <span className="text-red-600 font-medium">{fires} urgente{fires !== 1 ? 's' : ''}</span>}
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create task dialog */}
      <KanbanCreateTask
        open={showCreateTask}
        onOpenChange={setShowCreateTask}
        onCreateTask={createTask}
        currentMonth={currentMonth}
      />

      {/* Task detail modal */}
      <KanbanTaskModal
        task={selectedTask}
        open={!!selectedTask}
        onOpenChange={open => { if (!open) setSelectedTask(null); }}
        onUpdateTask={updateTask}
        onMoveTask={moveTask}
      />

      {/* Shared sheets */}
      {showAbsences && myEmployeeProfile && (
        <AbsencesSheet
          employeeId={myEmployeeProfile.id}
          employeeName={myEmployeeProfile.name}
          open={showAbsences}
          onOpenChange={setShowAbsences}
        />
      )}

      {showGoals && myEmployeeProfile && (
        <ProfessionalGoalsSheet
          employeeId={myEmployeeProfile.id}
          employeeName={myEmployeeProfile.name}
          open={showGoals}
          onOpenChange={setShowGoals}
        />
      )}
    </div>
  );
}
