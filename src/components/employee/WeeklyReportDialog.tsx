import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useProjectFilters } from '@/hooks/useProjectFilters';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, parseISO, startOfWeek, startOfMonth, addDays, addMonths, isBefore, isSameWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import { CheckCircle2, AlertCircle, AlertTriangle, Plus, Clock, Trash2, Search } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from '@/lib/notify';
import { getStorageKey, getWeeksForMonth, isAllocationInEffectiveMonth, getWeekEndDate, parseDateStringLocal } from '@/utils/dateUtils';
import { useWeeklyCloseDay } from '@/hooks/useWeeklyCloseDay';
import {
  useWeeklyCloseMutations,
  parseWeeklyCloseHours,
  normalizeWeeklyHourInput,
} from '@/hooks/useWeeklyCloseMutations';
import { cn } from '@/lib/utils';
import { useProjectAliasing } from '@/hooks/useProjectAliasing';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

function WeeklyOptionalNote({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5 border-t pt-4">
      <Label className="text-sm font-medium text-muted-foreground">Nota (opcional)</Label>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={2}
        className="min-h-[56px] max-h-28 resize-y text-sm"
        placeholder="Visible en el historial de la agencia."
      />
    </div>
  );
}

interface WeeklyReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeId: string;
  viewDate: Date;
  /**
   * Desde el planificador: abre el mismo modal centrado en una allocation concreta
   * (se inyecta en la lista aunque la semana aún no cierre o el filtro mensual la excluya).
   */
  focusAllocationId?: string | null;
}

export function WeeklyReportDialog({ open, onOpenChange, employeeId, viewDate, focusAllocationId = null }: WeeklyReportDialogProps) {
  const { allocations, projects, clients, employees, absences, teamEvents, weeklyFeedback, getEmployeeLoadForWeek, loadDataForMonth, ensureMonthLoaded } = useApp();
  const weeklyCloseDay = useWeeklyCloseDay();
  const { formatName: formatProjectName } = useProjectAliasing();
  const round2 = (num: number) => Math.round((num + Number.EPSILON) * 100) / 100;

  const {
    preference,
    applyMoveToEmployee,
    applyJustify,
    applyKeep,
    applyRollover,
    applyDistribute,
    getSlotsForTaskWeek,
  } = useWeeklyCloseMutations(viewDate);

  const parseHours = parseWeeklyCloseHours;

  const [taskActions, setTaskActions] = useState<Record<string, 'postpone' | 'moveToEmployee' | 'justify' | 'distribute' | 'keep' | null>>({});
  const [taskComments, setTaskComments] = useState<Record<string, string>>({});
  const [distributionTasks, setDistributionTasks] = useState<Record<string, Array<{ id: string; taskName: string; hours: string; weekDate: string }>>>({});
  const [moveToEmployee, setMoveToEmployee] = useState<Record<string, string>>({});
  const [moveToWeek, setMoveToWeek] = useState<Record<string, string>>({});
  const [keepTaskHours, setKeepTaskHours] = useState<Record<string, { actual: string; computed: string }>>({});
  const [rolloverHours, setRolloverHours] = useState<Record<string, { actual: string; computed: string }>>({});
  const [rolloverTargetWeek, setRolloverTargetWeek] = useState<Record<string, string>>({});
  const [modalSearch, setModalSearch] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [weeklyTab, setWeeklyTab] = useState<'past' | 'current'>('past');

  const taskMatchesSearch = useCallback(
    (task: (typeof allocations)[0]) => {
      const q = modalSearch.trim().toLowerCase();
      if (!q) return true;
      const proj = projects.find(p => p.id === task.projectId);
      const rawProjectName = proj
        ? typeof (proj as any).name === 'string'
          ? (proj as any).name
          : typeof (proj as any).project_name === 'string'
            ? (proj as any).project_name
            : typeof (proj as any).title === 'string'
              ? (proj as any).title
              : ''
        : '';
      const projectLabel = formatProjectName(rawProjectName).toLowerCase();
      const rawTaskName = typeof (task as any).taskName === 'string' ? (task as any).taskName : '';
      const taskLabel = rawTaskName.toLowerCase().replace(/\(transferida de[^\)]*\)/gi, '').trim();
      return projectLabel.includes(q) || taskLabel.includes(q);
    },
    [modalSearch, projects, formatProjectName]
  );

  const { activeFilters, filterProject, getFilterDisplayName } = useProjectFilters();
  const getTargetWeek = (): string | null => {
    const monthEnd = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0);
    if (isBefore(monthEnd, new Date())) {
      return format(startOfWeek(monthEnd, { weekStartsOn: 1 }), 'yyyy-MM-dd');
    }
    return null;
  };
  const targetWeek = getTargetWeek();

  const { openTasks, transferredTasks } = useMemo(() => {
    const today = new Date();
    const processedByWeeklyIds = new Set(
      weeklyFeedback
        .filter(fb => fb.allocationId && (
          fb.comments?.includes('Tarea completada:') ||
          fb.comments?.includes('Tarea movida a semana futura') ||
          fb.comments?.includes('Tarea transferida a') ||
          fb.comments?.includes('Distribuidas en') ||
          fb.comments?.includes('Tarea distribuida desde') ||
          fb.comments?.includes('Tarea con rollover:') ||
          fb.comments?.includes('Tarea mantenida tal cual')
        ))
        .map(fb => fb.allocationId!)
    );

    const open: typeof allocations = [];
    const transferred: typeof allocations = [];

    const pushFocusedIfMissing = () => {
      if (!open || !focusAllocationId) return;
      const focused = allocations.find(a => a.id === focusAllocationId && a.employeeId === employeeId);
      if (!focused || processedByWeeklyIds.has(focused.id) || focused.status === 'completed') return;
      const seen = new Set([...open.map(t => t.id), ...transferred.map(t => t.id)]);
      if (seen.has(focused.id)) return;
      try {
        const isTransferredTask = focused.transferredFromAllocationId !== undefined && focused.transferredFromAllocationId !== null
          || focused.taskName?.includes('(transferida de');
        if (isTransferredTask) transferred.push(focused);
        else open.push(focused);
      } catch { /* ignore */ }
    };

    allocations.forEach(a => {
      if (a.employeeId !== employeeId) return;
      if (processedByWeeklyIds.has(a.id)) return;
      try {
        const taskWeekDate = parseDateStringLocal(a.weekStartDate);
        if (!isAllocationInEffectiveMonth(a.weekStartDate, viewDate)) return;
        const taskWeekEnd = getWeekEndDate(taskWeekDate, weeklyCloseDay);
        if (targetWeek !== null) {
          if (getStorageKey(taskWeekDate, viewDate) !== targetWeek) return;
        } else {
          // Permitir ajustes proactivos de la semana actual aunque aún no haya llegado el día de cierre.
          const isCurrentCalendarWeek = isSameWeek(taskWeekDate, today, { weekStartsOn: 1 });
          if (taskWeekEnd > today && !isCurrentCalendarWeek) return;
        }
        const isTransferredTask = a.transferredFromAllocationId !== undefined && a.transferredFromAllocationId !== null
          || a.taskName?.includes('(transferida de');
        if (isTransferredTask && a.status !== 'completed') { transferred.push(a); return; }
        if (a.status !== 'completed') { open.push(a); }
      } catch { /* ignore parse errors */ }
    });

    pushFocusedIfMissing();

    return {
      openTasks: Array.from(new Map(open.map(t => [t.id, t])).values()),
      transferredTasks: Array.from(new Map(transferred.map(t => [t.id, t])).values())
    };
  }, [allocations, employeeId, viewDate, weeklyFeedback, weeklyCloseDay, open, focusAllocationId, targetWeek]);

  const allTasks = useMemo(
    () => [...openTasks, ...transferredTasks],
    [openTasks, transferredTasks]
  );

  /**
   * Semana actual vs atrasadas: misma semana ISO (lunes inicio) que hoy, usando fecha local de `week_start_date`.
   * `parseISO` solo con YYYY-MM-DD puede correr un día en UTC− y mandar todo a «Requieren cierre» por error.
   */
  const { pastTasks, currentTasks } = useMemo(() => {
    const today = new Date();
    const past: typeof allTasks = [];
    const current: typeof allTasks = [];
    for (const t of allTasks) {
      try {
        const d = parseDateStringLocal(t.weekStartDate);
        if (isSameWeek(d, today, { weekStartsOn: 1 })) current.push(t);
        else past.push(t);
      } catch {
        past.push(t);
      }
    }
    return { pastTasks: past, currentTasks: current };
  }, [allTasks]);

  const singleTaskFromPlanner = Boolean(open && focusAllocationId && allTasks.length === 1 && allTasks[0]?.id === focusAllocationId);

  useEffect(() => {
    if (!open) return;
    const anchor = startOfMonth(viewDate);
    void ensureMonthLoaded(anchor);
    void loadDataForMonth(addMonths(anchor, 1));
  }, [open, viewDate, ensureMonthLoaded, loadDataForMonth]);

  const weeklyTabInitForSessionRef = useRef(false);

  useEffect(() => {
    if (!open) {
      setModalSearch('');
      setSelectedTaskId(null);
      setWeeklyTab('past');
      weeklyTabInitForSessionRef.current = false;
    }
  }, [open]);

  /** Una sola vez al abrir: pestaña por defecto o la del foco del planificador (sin pisar si el usuario ya cambió de pestaña al refrescar datos). */
  useEffect(() => {
    if (!open || weeklyTabInitForSessionRef.current) return;
    weeklyTabInitForSessionRef.current = true;
    if (focusAllocationId) {
      const task = allocations.find(a => a.id === focusAllocationId && a.employeeId === employeeId);
      if (task) {
        try {
          const d = parseDateStringLocal(task.weekStartDate);
          setWeeklyTab(isSameWeek(d, new Date(), { weekStartsOn: 1 }) ? 'current' : 'past');
        } catch {
          setWeeklyTab('past');
        }
        return;
      }
    }
    setWeeklyTab('past');
  }, [open, focusAllocationId, allocations, employeeId]);

  const tabTaskPool = singleTaskFromPlanner
    ? allTasks
    : weeklyTab === 'past'
      ? pastTasks
      : currentTasks;
  const filteredTasks = useMemo(() => tabTaskPool.filter(taskMatchesSearch), [tabTaskPool, taskMatchesSearch]);

  /** Selección acorde a pestaña y filtro de búsqueda. */
  useEffect(() => {
    if (!open) return;
    if (filteredTasks.length === 0) {
      setSelectedTaskId(null);
      return;
    }
    setSelectedTaskId(prev => {
      if (prev && filteredTasks.some(t => t.id === prev)) return prev;
      if (focusAllocationId && filteredTasks.some(t => t.id === focusAllocationId)) return focusAllocationId;
      return filteredTasks[0].id;
    });
  }, [open, filteredTasks, focusAllocationId]);

  // ── Derived state ──
  const resolvedCount = allTasks.filter(t => taskActions[t.id]).length;
  const progress = allTasks.length > 0 ? (resolvedCount / allTasks.length) * 100 : 0;

  const sidebarGroups: Array<{ id: string; label: string; tasks: typeof allTasks }> = [];
  const assignedIds = new Set<string>();
  for (const filter of activeFilters) {
    const g = filteredTasks.filter(t => {
      if (assignedIds.has(t.id)) return false;
      const proj = projects.find(p => p.id === t.projectId);
      if (proj && filterProject(proj, filter.id)) { assignedIds.add(t.id); return true; }
      return false;
    });
    if (g.length > 0) sidebarGroups.push({ id: filter.id, label: filter.displayName, tasks: g });
  }
  const otherTasks = filteredTasks.filter(t => !assignedIds.has(t.id));
  if (otherTasks.length > 0) sidebarGroups.push({ id: 'other', label: 'General', tasks: otherTasks });

  const selectedTask = allTasks.find(t => t.id === selectedTaskId) || null;
  const selectedProject = selectedTask ? projects.find(p => p.id === selectedTask.projectId) : null;
  const selectedClient = selectedProject ? clients.find(c => c.id === selectedProject?.clientId) : null;
  const selectedMissingHours = selectedTask ? selectedTask.hoursAssigned - (selectedTask.hoursActual || 0) : 0;
  const selectedIsTransferred = selectedTask?.taskName?.includes('(transferida de') || false;
  const selectedTransferMatch = selectedTask?.taskName?.match(/\(transferida de (.+)\)/);
  const selectedTransferName = selectedTransferMatch ? selectedTransferMatch[1] : null;
  const selectedTransferFrom = selectedTransferName ? employees.find(e => e.name === selectedTransferName) : null;

  const getTaskStatus = (taskId: string): 'pending' | 'configured' | 'error' => {
    const action = taskActions[taskId];
    if (!action) return 'pending';
    const task = allTasks.find(t => t.id === taskId);
    if (!task) return 'pending';
    if (action === 'keep') {
      const h = keepTaskHours[taskId];
      if (h && parseHours(h.actual) <= 0) return 'error';
    } else if (action === 'postpone') {
      if (!rolloverTargetWeek[taskId]) return 'error';
      const h = rolloverHours[taskId];
      if (!h?.actual || parseHours(h.actual) <= 0) return 'error';
      const t = allTasks.find(x => x.id === taskId);
      if (!t) return 'error';
      const rem = round2(t.hoursAssigned - parseHours(h.actual));
      if (rem <= 0) return 'error';
    } else if (action === 'moveToEmployee') {
      if (!moveToEmployee[taskId] || !moveToWeek[taskId]) return 'error';
    } else if (action === 'distribute') {
      const dt = distributionTasks[taskId] || [];
      const valid = dt.filter(t => t.taskName.trim() && parseHours(t.hours) > 0);
      if (valid.length === 0) return 'error';
      if (Math.abs(valid.reduce((s, t) => s + parseHours(t.hours), 0) - task.hoursAssigned) > 0.01) return 'error';
    }
    return 'configured';
  };

  // ── Validation (extracted from footer) ──
  let canSubmit = true;
  const validationErrors: string[] = [];
  const capacityWarnings: string[] = [];
  for (const task of allTasks) {
    const action = taskActions[task.id];
    if (action === 'distribute') {
      const distTasks = distributionTasks[task.id] || [];
      const validTasks = distTasks.filter(t => t.taskName.trim() && parseHours(t.hours) > 0);
      if (validTasks.length === 0) { canSubmit = false; validationErrors.push(`"${task.taskName}" necesita al menos una subtarea válida`); continue; }
      const totalDistributed = validTasks.reduce((sum, t) => sum + parseHours(t.hours), 0);
      if (Math.abs(totalDistributed - task.hoursAssigned) > 0.01) { canSubmit = false; validationErrors.push(`"${task.taskName}": suma ${totalDistributed.toFixed(2)}h ≠ ${task.hoursAssigned.toFixed(2)}h`); }
      const projectMonthAllocations = allocations.filter(a => a.projectId === task.projectId && isAllocationInEffectiveMonth(a.weekStartDate, viewDate) && a.id !== task.id);
      const projectBudget = projects.find(p => p.id === task.projectId)?.budgetHours || 0;
      const newTotal = projectMonthAllocations.reduce((s, a) => s + a.hoursAssigned, 0) + totalDistributed;
      if (projectBudget > 0 && newTotal > projectBudget) { canSubmit = false; validationErrors.push(`"${task.taskName}": excede presupuesto (${newTotal.toFixed(1)}h/${projectBudget.toFixed(1)}h)`); }
      const valSlots = getSlotsForTaskWeek(task.weekStartDate);
      for (const dt of validTasks) {
        const dvs = valSlots.find(s => s.storageKey === dt.weekDate);
        const wl = getEmployeeLoadForWeek(employeeId, dt.weekDate, undefined, undefined, dvs?.viewMonth ?? viewDate);
        const wt = validTasks.filter(t => t.weekDate === dt.weekDate).reduce((s, t) => s + parseFloat(t.hours), 0);
        if ((wl?.hours || 0) + wt > (wl?.capacity || 0)) capacityWarnings.push(`"${task.taskName}": semana ${format(parseISO(dt.weekDate), 'd MMM')} sobre capacidad`);
      }
    } else if (action === 'keep') {
      const h = keepTaskHours[task.id]; const actual = h ? parseHours(h.actual) : (task.hoursActual || task.hoursAssigned);
      if (!actual || actual <= 0) { canSubmit = false; validationErrors.push(`"${task.taskName}": horas reales > 0`); }
    } else if (action === 'postpone') {
      const rSlots = getSlotsForTaskWeek(task.weekStartDate);
      if (rSlots.length === 0) { canSubmit = false; validationErrors.push(`"${task.taskName}": sin semanas futuras`); }
      if (!rolloverTargetWeek[task.id] || !rSlots.some(s => s.storageKey === rolloverTargetWeek[task.id])) { canSubmit = false; validationErrors.push(`"${task.taskName}": elige semana destino`); }
      const h = rolloverHours[task.id];
      if (!h?.actual || parseHours(h.actual) <= 0) { canSubmit = false; validationErrors.push(`"${task.taskName}": horas realizadas > 0`); }
      const rem = round2(task.hoursAssigned - parseHours(h.actual));
      if (rem <= 0) { canSubmit = false; validationErrors.push(`"${task.taskName}": debe quedar saldo para posponer (horas realizadas < estimado)`); }
      else {
        const dSlot = rSlots.find(s => s.storageKey === rolloverTargetWeek[task.id]);
        const wl = getEmployeeLoadForWeek(employeeId, rolloverTargetWeek[task.id], undefined, undefined, dSlot?.viewMonth ?? viewDate);
        if ((wl?.hours || 0) + rem > (wl?.capacity || 0)) capacityWarnings.push(`"${task.taskName}": semana destino sobre capacidad`);
      }
    } else if (action === 'moveToEmployee') {
      const teSlots = getSlotsForTaskWeek(task.weekStartDate);
      if (teSlots.length === 0) { canSubmit = false; validationErrors.push(`"${task.taskName}": sin semanas para transferir`); }
      else if (!moveToEmployee[task.id] || !moveToWeek[task.id]) { canSubmit = false; validationErrors.push(`"${task.taskName}": selecciona compañero y semana`); }
      else {
        const rem = task.hoursAssigned - (task.hoursActual || 0);
        if (rem > 0) { const ts = teSlots.find(s => s.storageKey === moveToWeek[task.id]); const wl = getEmployeeLoadForWeek(moveToEmployee[task.id], moveToWeek[task.id], undefined, undefined, ts?.viewMonth ?? viewDate); const te = employees.find(e => e.id === moveToEmployee[task.id]); if (te && (wl?.hours || 0) + rem > (wl?.capacity || 0)) capacityWarnings.push(`"${task.taskName}": ${te.name} sobre capacidad`); }
      }
    }
  }

  // ── Week slots & selectors ──
  const weekSlotsFor = getSlotsForTaskWeek;

  const weekSelectGroups = (taskWeekStartStr: string, loadForEmployeeId: string | null) => {
    const slots = weekSlotsFor(taskWeekStartStr);
    const byMonth = new Map<string, typeof slots>();
    for (const s of slots) {
      const k = format(startOfMonth(s.viewMonth), 'yyyy-MM');
      if (!byMonth.has(k)) byMonth.set(k, []);
      byMonth.get(k)!.push(s);
    }
    return [...byMonth.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([mk, monthSlots]) => (
      <SelectGroup key={mk}>
        <SelectLabel className="py-1.5 pl-8 pr-2 text-xs font-semibold capitalize text-muted-foreground">
          {format(monthSlots[0].viewMonth, 'MMMM yyyy', { locale: es })}
        </SelectLabel>
        {monthSlots.map((slot) => {
          const load = loadForEmployeeId
            ? getEmployeeLoadForWeek(loadForEmployeeId, slot.storageKey, undefined, undefined, slot.viewMonth)
            : null;
          const h = load?.hours ?? 0;
          const cap = load?.capacity ?? 0;
          const avail = round2(cap - h);
          const weeks = getWeeksForMonth(slot.viewMonth);
          const wi = weeks.findIndex(w => getStorageKey(w.weekStart, slot.viewMonth) === slot.storageKey);
          const wn = wi >= 0 ? wi + 1 : null;
          const dateRange = `${format(slot.weekStart, 'd', { locale: es })}–${format(addDays(slot.weekStart, 4), 'd MMM', { locale: es })}`;
          const label = `S${wn || '?'} · ${dateRange}`;
          const availLabel = loadForEmployeeId
            ? avail >= 0 ? `${avail.toFixed(0)}h libres` : `${Math.abs(avail).toFixed(0)}h sobre cap.`
            : 'Elige compañero';
          return (
            <SelectItem key={slot.storageKey} value={slot.storageKey} className="py-2">
              <span className="text-sm">{label}</span>
              <span className={cn("ml-2 text-xs", !loadForEmployeeId ? "text-muted-foreground" : avail >= 0 ? "text-muted-foreground" : "text-destructive")}>
                · {availLabel}
              </span>
            </SelectItem>
          );
        })}
      </SelectGroup>
    ));
  };

  // ── Distribution helpers ──
  const initializeDistribution = (taskId: string, totalHours: number, taskWeekStartStr: string) => {
    if (!distributionTasks[taskId] || distributionTasks[taskId].length === 0) {
      const slots = weekSlotsFor(taskWeekStartStr);
      setDistributionTasks(prev => ({
        ...prev,
        [taskId]: [{ id: crypto.randomUUID(), taskName: '', hours: totalHours.toString(), weekDate: slots[0]?.storageKey || format(new Date(), 'yyyy-MM-dd') }]
      }));
    }
  };

  const addDistributionRow = (taskId: string, taskWeekStartStr: string) => {
    const current = distributionTasks[taskId] || [];
    const lastRow = current[current.length - 1];
    const slots = weekSlotsFor(taskWeekStartStr);
    setDistributionTasks(prev => ({
      ...prev,
      [taskId]: [...current, { id: crypto.randomUUID(), taskName: '', hours: '', weekDate: lastRow?.weekDate || slots[0]?.storageKey || format(new Date(), 'yyyy-MM-dd') }]
    }));
  };

  const removeDistributionRow = (taskId: string, rowId: string) => {
    setDistributionTasks(prev => ({ ...prev, [taskId]: (prev[taskId] || []).filter(r => r.id !== rowId) }));
  };

  const updateDistributionRow = (taskId: string, rowId: string, field: 'taskName' | 'hours' | 'weekDate', value: string) => {
    setDistributionTasks(prev => ({ ...prev, [taskId]: (prev[taskId] || []).map(r => r.id === rowId ? { ...r, [field]: value } : r) }));
  };

  const updateDistributionHours = (taskId: string, rowId: string, value: string) => {
    updateDistributionRow(taskId, rowId, 'hours', value);
  };

  // ── Action change handler (extracted) ──
  const handleActionChange = (task: typeof allTasks[0], value: string) => {
    const action = value as any;
    setTaskActions(prev => ({ ...prev, [task.id]: action }));
    const missingHours = task.hoursAssigned - (task.hoursActual || 0);
    const isDistributionTask = task.taskName?.includes('[Distribuir]');
    const isTransferredTask = task.taskName?.includes('(transferida de');
    if (action === 'distribute') {
      if (isDistributionTask || isTransferredTask) initializeDistribution(task.id, task.hoursAssigned, task.weekStartDate);
      else if (!distributionTasks[task.id]?.length) initializeDistribution(task.id, missingHours, task.weekStartDate);
    }
    if (action === 'keep' && !keepTaskHours[task.id]) {
      setKeepTaskHours(prev => ({ ...prev, [task.id]: { actual: (task.hoursActual || task.hoursAssigned || 0).toFixed(2), computed: (task.hoursComputed || task.hoursActual || task.hoursAssigned || 0).toFixed(2) } }));
    }
    if (action === 'postpone' && !rolloverHours[task.id]) {
      const rSlots = weekSlotsFor(task.weekStartDate);
      setRolloverHours(prev => ({
        ...prev,
        [task.id]: {
          actual: (task.hoursActual || missingHours || 0).toFixed(2),
          computed: (task.hoursComputed || task.hoursActual || missingHours || 0).toFixed(2),
        },
      }));
      if (rSlots[0]) setRolloverTargetWeek(prev => ({ ...prev, [task.id]: rSlots[0].storageKey }));
    }
    if (action === 'moveToEmployee' && !moveToWeek[task.id]) {
      const eSlots = weekSlotsFor(task.weekStartDate);
      if (eSlots[0]) setMoveToWeek(prev => ({ ...prev, [task.id]: eSlots[0].storageKey }));
    }
  };

  // ── Submit handler ──
  const handleCloseWeek = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      for (const task of allTasks) {
        const action = taskActions[task.id];
        if (!action) continue;

        if (action === 'moveToEmployee') {
          await applyMoveToEmployee(
            task,
            employeeId,
            moveToEmployee[task.id] || '',
            moveToWeek[task.id] || '',
            taskComments[task.id]
          );
        } else if (action === 'justify') {
          await applyJustify(task, employeeId, taskComments[task.id]);
        } else if (action === 'keep') {
          const hours = keepTaskHours[task.id];
          const actual = hours ? parseHours(hours.actual) : (task.hoursActual || task.hoursAssigned);
          const computed = preference === 'actual' ? actual : (hours ? parseHours(hours.computed) : (task.hoursComputed || actual));
          await applyKeep(task, employeeId, actual, computed, taskComments[task.id]);
        } else if (action === 'postpone') {
          const hours = rolloverHours[task.id];
          const destWeekStr = rolloverTargetWeek[task.id] || '';
          if (!hours) {
            toast.error(`"${task.taskName}" necesita horas realizadas`);
            continue;
          }
          const actual = parseHours(hours.actual);
          const computed = preference === 'actual' ? actual : (parseHours(hours.computed) || actual);
          const newEstimate = round2(task.hoursAssigned - actual);
          if (newEstimate <= 0) {
            toast.error(`"${task.taskName}": debe quedar saldo para posponer`);
            continue;
          }
          await applyRollover(task, employeeId, actual, computed, newEstimate, destWeekStr, taskComments[task.id]);
        } else if (action === 'distribute') {
          const distTasks = distributionTasks[task.id] || [];
          const validTasks = distTasks.filter(t => t.taskName.trim() && parseHours(t.hours) > 0);
          await applyDistribute(task, employeeId, validTasks, taskComments[task.id]);
        }
      }

      toast.success('Weekly actualizado correctamente');
      onOpenChange(false);
      setTaskActions({}); setTaskComments({}); setMoveToEmployee({}); setMoveToWeek({});
      setDistributionTasks({}); setKeepTaskHours({}); setRolloverHours({}); setRolloverTargetWeek({});
    } catch (error) {
      console.error('Error actualizando weekly:', error);
      toast.error('Error al actualizar el weekly');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Safety: initialize distribution for selected task if needed ──
  if (selectedTask && taskActions[selectedTask.id] === 'distribute') {
    const isDist = selectedTask.taskName?.includes('[Distribuir]');
    const isTrans = selectedTask.taskName?.includes('(transferida de');
    if ((isDist || isTrans) && (!distributionTasks[selectedTask.id] || distributionTasks[selectedTask.id].length === 0)) {
      initializeDistribution(selectedTask.id, selectedTask.hoursAssigned, selectedTask.weekStartDate);
    }
  }

  const actionOptions: Array<[string, string]> = [
    ['keep', 'Completar'],
    ['postpone', 'Posponer lo pendiente'],
    ['distribute', 'Desglosar en subtareas'],
    ['moveToEmployee', 'Transferir a compañero'],
  ];

  // ── RENDER ──
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex max-h-[85vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl"
        aria-describedby="weekly-desc"
      >
        {/* ── HEADER ── */}
        <div className="space-y-3 border-b px-6 pb-4 pt-5">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-lg font-semibold tracking-tight">
              {singleTaskFromPlanner ? 'Opciones Weekly' : 'Cierre semanal'}
            </DialogTitle>
            <DialogDescription id="weekly-desc" className="text-sm text-muted-foreground">
              {singleTaskFromPlanner
                ? 'Completa, posponer, desglosar o transferir con el mismo flujo que en la previsión semanal.'
                : `${resolvedCount} de ${allTasks.length} ${allTasks.length === 1 ? 'tarea resuelta' : 'tareas resueltas'}`}
            </DialogDescription>
          </DialogHeader>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500 ease-out",
                resolvedCount === allTasks.length && allTasks.length > 0 ? "bg-green-500" : "bg-primary"
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {allTasks.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-8 py-16 text-center">
            <CheckCircle2 className="mb-4 h-10 w-10 text-muted-foreground/50" strokeWidth={1.5} />
            <h3 className="text-base font-semibold">Sin pendientes</h3>
            <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
              No hay tareas que requieran cierre en este periodo.
            </p>
          </div>
        ) : (
          <Tabs
            value={singleTaskFromPlanner ? 'past' : weeklyTab}
            onValueChange={(v) => setWeeklyTab(v as 'past' | 'current')}
            className="flex min-h-0 flex-1 flex-col"
          >
            {!singleTaskFromPlanner && (
              <div className="shrink-0 border-b px-6 pb-3 pt-2">
                <TabsList className="grid h-auto w-full max-w-lg grid-cols-2 gap-1 p-1">
                  <TabsTrigger
                    value="past"
                    className={cn(
                      'gap-1.5 px-2 py-2 text-xs sm:text-sm',
                      pastTasks.length > 0 && 'data-[state=active]:text-destructive data-[state=inactive]:text-destructive/80'
                    )}
                  >
                    {pastTasks.length > 0 ? (
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-600" aria-hidden />
                    ) : null}
                    <span className="truncate text-left font-semibold">Requieren cierre</span>
                    <span className="font-mono text-[11px] opacity-80">({pastTasks.length})</span>
                  </TabsTrigger>
                  <TabsTrigger value="current" className="gap-1 px-2 py-2 text-xs sm:text-sm">
                    <span className="truncate font-medium">Semana actual</span>
                    <span className="font-mono text-[11px] text-muted-foreground">({currentTasks.length})</span>
                  </TabsTrigger>
                </TabsList>
              </div>
            )}

            {/* ── BODY: vacío por pestaña o split panel ── */}
            {(() => {
              const showPastTabEmpty = !singleTaskFromPlanner && weeklyTab === 'past' && pastTasks.length === 0;
              const showCurrentTabEmpty = !singleTaskFromPlanner && weeklyTab === 'current' && currentTasks.length === 0;
              if (showPastTabEmpty) {
                return (
                  <div className="flex flex-1 flex-col items-center justify-center px-8 py-14 text-center">
                    <CheckCircle2 className="mb-3 h-10 w-10 text-emerald-500/90" strokeWidth={1.5} />
                    <h3 className="text-base font-semibold text-slate-800">Todo al día</h3>
                    <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
                      No tienes tareas de semanas anteriores pendientes de cierre. Puedes revisar la pestaña <strong>Semana actual</strong> si quieres ajustar lo de esta semana.
                    </p>
                  </div>
                );
              }
              if (showCurrentTabEmpty) {
                return (
                  <div className="flex flex-1 flex-col items-center justify-center px-8 py-14 text-center">
                    <Clock className="mb-3 h-9 w-9 text-muted-foreground/50" strokeWidth={1.5} />
                    <h3 className="text-base font-semibold">Sin tareas en la semana actual</h3>
                    <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
                      Aquí aparecerán las tareas de la semana en curso cuando quieras hacer ajustes proactivos.
                    </p>
                  </div>
                );
              }
              return (
            <div className="flex min-h-0 flex-1">
              {/* ── LEFT: SIDEBAR (desktop) ── */}
              <div className={cn('w-64 shrink-0 flex-col border-r bg-muted/30', singleTaskFromPlanner ? 'hidden' : 'hidden md:flex')}>
                <div className="border-b p-2.5">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={modalSearch}
                      onChange={(e) => setModalSearch(e.target.value)}
                      placeholder="Filtrar..."
                      className="h-8 pl-8 text-xs"
                      aria-label="Filtrar tareas"
                    />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto py-1">
                  {sidebarGroups.length === 0 && modalSearch.trim() ? (
                    <p className="px-3 py-6 text-center text-xs text-muted-foreground">Sin resultados</p>
                  ) : (
                    sidebarGroups.map(group => (
                      <div key={group.id}>
                        {sidebarGroups.length > 1 && (
                          <div className="px-3 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                            {group.label}
                          </div>
                        )}
                        {group.tasks.map(task => {
                          const status = getTaskStatus(task.id);
                          const isActive = task.id === selectedTaskId;
                          const project = projects.find(p => p.id === task.projectId);
                          const client = clients.find(c => c.id === project?.clientId);
                          const pending = round2(task.hoursAssigned - (task.hoursActual || 0));
                          return (
                            <button
                              key={task.id}
                              onClick={() => setSelectedTaskId(task.id)}
                              className={cn(
                                "flex w-full items-center gap-2.5 border-l-2 px-3 py-2 text-left transition-colors",
                                isActive
                                  ? "border-l-primary bg-accent"
                                  : "border-l-transparent hover:bg-muted/60"
                              )}
                            >
                              {status === 'configured' ? (
                                <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
                              ) : status === 'error' ? (
                                <AlertCircle className="h-4 w-4 shrink-0 text-amber-500" />
                              ) : (
                                <div className="h-4 w-4 shrink-0 rounded-full border-2 border-muted-foreground/25" />
                              )}
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: client?.color || '#94a3b8' }} />
                                  <span className="truncate text-[11px] text-muted-foreground">{project?.name || 'Sin proyecto'}</span>
                                </div>
                                <p className="mt-0.5 truncate text-sm font-medium leading-tight">
                                  {task.taskName?.replace(/\(transferida de .+\)/, '').trim() || 'Sin nombre'}
                                </p>
                              </div>
                              <span className="shrink-0 font-mono text-xs text-muted-foreground">{pending}h</span>
                            </button>
                          );
                        })}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* ── RIGHT: DETAIL ── */}
              <div className="flex min-w-0 flex-1 flex-col">
                {/* Mobile: task selector */}
                <div className={cn('border-b p-3 md:hidden', singleTaskFromPlanner && 'hidden')}>
                  <Select value={selectedTaskId || ''} onValueChange={(val) => setSelectedTaskId(val)}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Seleccionar tarea" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredTasks.map(task => {
                        const pending = round2(task.hoursAssigned - (task.hoursActual || 0));
                        const status = getTaskStatus(task.id);
                        return (
                          <SelectItem key={task.id} value={task.id} className="py-2">
                            <div className="flex items-center gap-2">
                              {status === 'configured' ? (
                                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-green-500" />
                              ) : (
                                <div className="h-3.5 w-3.5 shrink-0 rounded-full border-2 border-muted-foreground/25" />
                              )}
                              <span className="truncate text-sm">
                                {task.taskName?.replace(/\(transferida de .+\)/, '').trim() || 'Sin nombre'}
                              </span>
                              <span className="ml-auto shrink-0 font-mono text-xs text-muted-foreground">{pending}h</span>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                {/* Detail content */}
                <div className="flex-1 overflow-y-auto">
                  {selectedTask ? (
                    <div className="space-y-6 p-6">
                      {/* Task header */}
                      <div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: selectedClient?.color || '#94a3b8' }} />
                          {selectedProject?.name || 'Sin proyecto'}
                        </div>
                        <h3 className="mt-1 text-lg font-semibold tracking-tight">
                          {selectedTask.taskName?.replace(/\(transferida de .+\)/, '').trim() || 'Sin nombre'}
                        </h3>
                        <div className="mt-3 flex flex-wrap items-center gap-3">
                          <Badge variant="secondary" className="font-mono">{round2(selectedMissingHours)}h pendientes</Badge>
                          {selectedIsTransferred && selectedTransferFrom && (
                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                              <Avatar className="h-5 w-5">
                                <AvatarImage src={selectedTransferFrom.avatarUrl} />
                                <AvatarFallback className="text-[9px]">
                                  {(selectedTransferFrom.first_name || selectedTransferFrom.name)[0]}
                                </AvatarFallback>
                              </Avatar>
                              <span>Transferida de {selectedTransferFrom.first_name || selectedTransferFrom.name}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action selection */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Acción</Label>
                        <RadioGroup
                          value={taskActions[selectedTask.id] || ''}
                          onValueChange={(v) => handleActionChange(selectedTask, v)}
                          className="space-y-1"
                        >
                          {actionOptions.map(([val, label]) => (
                            <label
                              key={val}
                              htmlFor={`${selectedTask.id}-${val}`}
                              className={cn(
                                "flex cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 transition-colors",
                                taskActions[selectedTask.id] === val
                                  ? "bg-accent text-accent-foreground"
                                  : "hover:bg-muted"
                              )}
                            >
                              <RadioGroupItem value={val} id={`${selectedTask.id}-${val}`} />
                              <span className="text-sm font-medium">{label}</span>
                            </label>
                          ))}
                        </RadioGroup>
                      </div>

                      {/* Action detail forms */}
                      {taskActions[selectedTask.id] && (
                        <div className="rounded-lg border bg-muted/30 p-4">
                          {/* KEEP */}
                          {taskActions[selectedTask.id] === 'keep' && (() => {
                            const hours = keepTaskHours[selectedTask.id] || {
                              actual: (selectedTask.hoursActual || selectedTask.hoursAssigned || 0).toFixed(2),
                              computed: (selectedTask.hoursComputed || selectedTask.hoursActual || selectedTask.hoursAssigned || 0).toFixed(2)
                            };
                            return (
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-1.5">
                                    <Label className="text-sm font-medium">Horas reales *</Label>
                                    <Input type="text" inputMode="decimal" className="h-10 font-mono text-sm" value={hours.actual}
                                      onChange={(e) => { 
                                        const v = normalizeWeeklyHourInput(e.target.value); 
                                        setKeepTaskHours(prev => ({ 
                                          ...prev, 
                                          [selectedTask.id]: { 
                                            ...prev[selectedTask.id], 
                                            actual: v,
                                            ...(preference === 'actual' ? { computed: v } : {}) 
                                          } 
                                        })); 
                                      }}
                                      placeholder="0.00" />
                                    <p className="text-xs text-muted-foreground">Trabajo efectuado</p>
                                  </div>
                                  {preference !== 'actual' && (
                                  <div className="space-y-1.5">
                                    <Label className="text-sm font-medium">Horas computadas</Label>
                                    <Input type="text" inputMode="decimal" className="h-10 font-mono text-sm" value={hours.computed}
                                      disabled={preference === 'actual'}
                                      onChange={(e) => { const v = normalizeWeeklyHourInput(e.target.value); setKeepTaskHours(prev => ({ ...prev, [selectedTask.id]: { ...prev[selectedTask.id], computed: v } })); }}
                                      placeholder="0.00" />
                                    <p className="text-xs text-muted-foreground">Criterio de facturación</p>
                                  </div>
                                  )}
                                </div>
                                <WeeklyOptionalNote value={taskComments[selectedTask.id] || ''} onChange={(v) => setTaskComments(prev => ({ ...prev, [selectedTask.id]: v }))} />
                              </div>
                            );
                          })()}

                          {/* POSTPONE: mismo criterio que cierre parcial (saldo = estimado − realizadas → rollover) */}
                          {taskActions[selectedTask.id] === 'postpone' && (() => {
                            const hours = rolloverHours[selectedTask.id] || {
                              actual: (selectedTask.hoursActual || selectedMissingHours || 0).toFixed(2),
                              computed: (selectedTask.hoursComputed || selectedTask.hoursActual || selectedMissingHours || 0).toFixed(2)
                            };
                            const rSlots = weekSlotsFor(selectedTask.weekStartDate);
                            const pendNext = Math.max(0, round2(selectedTask.hoursAssigned - parseHours(hours.actual)));
                            return (
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-1.5">
                                    <Label className="text-sm font-medium">Horas realizadas *</Label>
                                    <Input type="text" inputMode="decimal" className="h-10 font-mono text-sm" value={hours.actual}
                                      onChange={(e) => { 
                                        const v = normalizeWeeklyHourInput(e.target.value); 
                                        setRolloverHours(prev => ({ 
                                          ...prev, 
                                          [selectedTask.id]: { 
                                            ...prev[selectedTask.id], 
                                            actual: v,
                                            ...(preference === 'actual' ? { computed: v } : {}) 
                                          } 
                                        })); 
                                      }}
                                      placeholder="0.00" />
                                    <p className="text-xs text-muted-foreground">
                                      Pendiente para la otra semana:{' '}
                                      <span className="font-mono font-semibold text-foreground">
                                        {pendNext.toFixed(2)}h
                                      </span>{' '}
                                      (estimado menos horas realizadas; se planificarán al cerrar)
                                    </p>
                                  </div>
                                  {preference !== 'actual' && (
                                  <div className="space-y-1.5">
                                    <Label className="text-sm font-medium">Horas computadas</Label>
                                    <Input type="text" inputMode="decimal" className="h-10 font-mono text-sm" value={hours.computed}
                                      disabled={preference === 'actual'}
                                      onChange={(e) => { const v = normalizeWeeklyHourInput(e.target.value); setRolloverHours(prev => ({ ...prev, [selectedTask.id]: { ...prev[selectedTask.id], computed: v } })); }}
                                      placeholder="0.00" />
                                  </div>
                                  )}
                                </div>
                                <div className="space-y-1.5 border-t pt-4">
                                  <Label className="text-sm font-medium">Semana destino *</Label>
                                  {rSlots.length === 0 ? (
                                    <p className="text-xs text-destructive">No hay semanas disponibles.</p>
                                  ) : (
                                    <Select value={rolloverTargetWeek[selectedTask.id] || rSlots[0]?.storageKey} onValueChange={(val) => setRolloverTargetWeek(prev => ({ ...prev, [selectedTask.id]: val }))}>
                                      <SelectTrigger className="h-10 text-sm"><SelectValue placeholder="Elige semana" /></SelectTrigger>
                                      <SelectContent className="max-h-[min(280px,60vh)]">{weekSelectGroups(selectedTask.weekStartDate, employeeId)}</SelectContent>
                                    </Select>
                                  )}
                                </div>
                                <WeeklyOptionalNote value={taskComments[selectedTask.id] || ''} onChange={(v) => setTaskComments(prev => ({ ...prev, [selectedTask.id]: v }))} />
                              </div>
                            );
                          })()}

                          {/* DISTRIBUTE */}
                          {taskActions[selectedTask.id] === 'distribute' && (
                            <div className="space-y-4">
                              <div className="flex items-center justify-between rounded-md border bg-background px-3 py-2 text-sm">
                                <span className="font-medium">Total: <span className="font-mono">{round2(selectedMissingHours).toFixed(2)}h</span></span>
                                <span className={cn("font-mono", round2(selectedMissingHours - (distributionTasks[selectedTask.id]?.reduce((a, d) => a + parseHours(d.hours), 0) || 0)) === 0 ? "font-medium" : "text-muted-foreground")}>
                                  Saldo: {round2(selectedMissingHours - (distributionTasks[selectedTask.id]?.reduce((a, d) => a + parseHours(d.hours), 0) || 0)).toFixed(2)}h
                                </span>
                              </div>
                              <div className="space-y-2">
                                {(distributionTasks[selectedTask.id] || []).map((dist) => {
                                  const distSlot = weekSlotsFor(selectedTask.weekStartDate).find(s => s.storageKey === dist.weekDate);
                                  const weekLoad = dist.weekDate ? getEmployeeLoadForWeek(employeeId, dist.weekDate, undefined, undefined, distSlot?.viewMonth ?? viewDate) : null;
                                  const isOverCap = weekLoad && (weekLoad.hours || 0) + parseHours(dist.hours) > (weekLoad.capacity || 0);
                                  return (
                                    <div key={dist.id} className="space-y-2 rounded-md border bg-background p-3">
                                      <div className="flex items-center gap-2">
                                        <Input type="text" className="h-9 min-w-[120px] flex-1 text-sm" value={dist.taskName}
                                          onChange={(e) => updateDistributionRow(selectedTask.id, dist.id, 'taskName', e.target.value)} placeholder="Nombre subtarea" />
                                        <Input type="text" inputMode="decimal" className={cn("h-9 w-[4.5rem] font-mono text-sm", isOverCap && "border-destructive/60")} value={dist.hours}
                                          onChange={(e) => updateDistributionHours(selectedTask.id, dist.id, normalizeWeeklyHourInput(e.target.value))} placeholder="h" />
                                        <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive" onClick={() => removeDistributionRow(selectedTask.id, dist.id)}>
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </div>
                                      <Select value={dist.weekDate} onValueChange={(val) => updateDistributionRow(selectedTask.id, dist.id, 'weekDate', val)}>
                                        <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Semana" /></SelectTrigger>
                                        <SelectContent className="max-h-[min(280px,60vh)]">{weekSelectGroups(selectedTask.weekStartDate, employeeId)}</SelectContent>
                                      </Select>
                                      {isOverCap && <p className="text-xs text-destructive">Superaría la capacidad de esa semana.</p>}
                                    </div>
                                  );
                                })}
                              </div>
                              <Button variant="outline" size="sm" className="w-full border-dashed" onClick={() => addDistributionRow(selectedTask.id, selectedTask.weekStartDate)}>
                                <Plus className="mr-1.5 h-3.5 w-3.5" /> Añadir línea
                              </Button>
                              <WeeklyOptionalNote value={taskComments[selectedTask.id] || ''} onChange={(v) => setTaskComments(prev => ({ ...prev, [selectedTask.id]: v }))} />
                            </div>
                          )}

                          {/* TRANSFER TO EMPLOYEE */}
                          {taskActions[selectedTask.id] === 'moveToEmployee' && (() => {
                            const selEmpId = moveToEmployee[selectedTask.id];
                            const tSlots = weekSlotsFor(selectedTask.weekStartDate);
                            return (
                              <div className="space-y-4">
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                  <div className="space-y-1.5">
                                    <Label className="text-sm font-medium">Compañero *</Label>
                                    <Select value={moveToEmployee[selectedTask.id]} onValueChange={(val) => setMoveToEmployee(prev => ({ ...prev, [selectedTask.id]: val }))}>
                                      <SelectTrigger className="h-10 text-sm"><SelectValue placeholder="Seleccionar persona" /></SelectTrigger>
                                      <SelectContent className="max-h-[min(240px,50vh)]">
                                        {employees.filter(e => e.isActive && e.id !== employeeId).map(e => {
                                          const loads = tSlots.map(slot => getEmployeeLoadForWeek(e.id, slot.storageKey, undefined, undefined, slot.viewMonth));
                                          const avail = round2(loads.reduce((s, l) => s + (l?.capacity || 0), 0) - loads.reduce((s, l) => s + (l?.hours || 0), 0));
                                          return (
                                            <SelectItem key={e.id} value={e.id} className="py-2">
                                              <span className="text-sm">{e.name}</span>
                                              <span className={cn("ml-2 text-xs", avail >= 0 ? "text-muted-foreground" : "text-destructive")}>
                                                · {avail >= 0 ? `${avail.toFixed(0)}h libres` : 'Sobre cap.'}
                                              </span>
                                            </SelectItem>
                                          );
                                        })}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="space-y-1.5">
                                    <Label className="text-sm font-medium">Semana *</Label>
                                    <Select value={moveToWeek[selectedTask.id]} onValueChange={(val) => setMoveToWeek(prev => ({ ...prev, [selectedTask.id]: val }))}>
                                      <SelectTrigger className="h-10 text-sm"><SelectValue placeholder="Seleccionar semana" /></SelectTrigger>
                                      <SelectContent className="max-h-[min(280px,60vh)]">{weekSelectGroups(selectedTask.weekStartDate, selEmpId || null)}</SelectContent>
                                    </Select>
                                  </div>
                                </div>
                                <WeeklyOptionalNote value={taskComments[selectedTask.id] || ''} onChange={(v) => setTaskComments(prev => ({ ...prev, [selectedTask.id]: v }))} />
                              </div>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex h-full items-center justify-center p-6 text-sm text-muted-foreground">
                      Selecciona una tarea de la lista
                    </div>
                  )}
                </div>
              </div>
            </div>
              );
            })()}

            {/* ── FOOTER ── */}
            <DialogFooter className="shrink-0 items-center border-t px-6 py-4 sm:justify-between">
              <p className="hidden text-sm text-muted-foreground sm:block">
                {resolvedCount}/{allTasks.length} configuradas
              </p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleCloseWeek}
                  disabled={!canSubmit || isSubmitting}
                  title={!canSubmit ? validationErrors.join(' · ') : capacityWarnings.length > 0 ? `Aviso: ${capacityWarnings.join(' · ')}` : undefined}
                >
                  {isSubmitting ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current/30 border-t-current" />
                      Procesando…
                    </>
                  ) : (
                    'Confirmar cierre'
                  )}
                </Button>
              </div>
            </DialogFooter>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
