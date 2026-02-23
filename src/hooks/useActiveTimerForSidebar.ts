import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface ActiveTimerSidebarState {
  isActive: boolean;
  elapsedSeconds: number;
  allocationId: string | null;
  /** Nombre de la tarea cuando hay timer activo */
  taskName: string | null;
  /** Nombre del cliente (proyecto → cliente) cuando hay timer activo */
  clientName: string | null;
  /** Formato HH:MM o HH:MM:SS (cuando está activo) */
  formattedTime: string;
  /** Para el total del día: texto claro tipo "7 min" o "1 h 23 min" (solo cuando !isActive) */
  formattedTimeLabel: string;
  /** Parar el cronómetro actual desde el sidebar (solo tiene efecto si isActive) */
  stopCurrentTimer: () => Promise<void>;
}

const POLL_INTERVAL_MS = 5000;

function formatTotalAsLabel(totalSeconds: number): string {
  if (totalSeconds === 0) return '0 min';
  const mins = Math.floor(totalSeconds / 60);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${mins} min`;
  if (m === 0) return `${h} h`;
  return `${h} h ${m} min`;
}

export function useActiveTimerForSidebar(employeeId: string | undefined): ActiveTimerSidebarState {
  const [state, setState] = useState<Omit<ActiveTimerSidebarState, 'stopCurrentTimer'>>({
    isActive: false,
    elapsedSeconds: 0,
    allocationId: null,
    taskName: null,
    clientName: null,
    formattedTime: '0:00',
    formattedTimeLabel: '0 min',
  });

  const fetchAndCompute = useCallback(async () => {
    if (!employeeId) {
      setState(s => (s.isActive ? s : { isActive: false, elapsedSeconds: 0, allocationId: null, taskName: null, clientName: null, formattedTime: '0:00', formattedTimeLabel: '0 min' }));
      return;
    }
    const today = new Date().toISOString().split('T')[0];
    const [timerRes, entriesRes] = await Promise.all([
      supabase.from('active_timers').select('started_at, allocation_id').eq('employee_id', employeeId).maybeSingle(),
      supabase.from('time_entries').select('hours').eq('employee_id', employeeId).eq('date', today),
    ]);
    const timerRow = timerRes.data;
    const entryRows = entriesRes.data ?? [];
    const totalHoursFromEntries = entryRows.reduce((sum, row) => sum + Number(row?.hours ?? 0), 0);
    let totalSeconds = Math.round(totalHoursFromEntries * 3600);

    if (timerRow?.started_at) {
      const startedAt = new Date(timerRow.started_at).getTime();
      const elapsed = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
      totalSeconds += elapsed;
      const h = Math.floor(elapsed / 3600);
      const m = Math.floor((elapsed % 3600) / 60);
      const s = elapsed % 60;
      const fmt = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
      const allocationId = timerRow.allocation_id ?? null;
      let taskName: string | null = null;
      let clientName: string | null = null;
      if (allocationId) {
        const { data: alloc } = await supabase.from('allocations').select('task_name, project_id').eq('id', allocationId).maybeSingle();
        taskName = alloc?.task_name ?? null;
        if (alloc?.project_id) {
          const { data: proj } = await supabase.from('projects').select('client_id').eq('id', alloc.project_id).maybeSingle();
          if (proj?.client_id) {
            const { data: client } = await supabase.from('clients').select('name').eq('id', proj.client_id).maybeSingle();
            clientName = client?.name ?? null;
          }
        }
      }
      setState({
        isActive: true,
        elapsedSeconds: elapsed,
        allocationId,
        taskName,
        clientName,
        formattedTime: fmt,
        formattedTimeLabel: formatTotalAsLabel(totalSeconds),
      });
      return;
    }

    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const fmt = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    setState({
      isActive: false,
      elapsedSeconds: 0,
      allocationId: null,
      taskName: null,
      clientName: null,
      formattedTime: fmt,
      formattedTimeLabel: formatTotalAsLabel(totalSeconds),
    });
  }, [employeeId]);

  const stopCurrentTimer = useCallback(async () => {
    if (!employeeId) return;
    const { data: active } = await supabase
      .from('active_timers')
      .select('started_at, allocation_id')
      .eq('employee_id', employeeId)
      .maybeSingle();
    if (!active?.started_at || !active.allocation_id) return;
    const secondsToLog = Math.max(0, Math.floor((Date.now() - new Date(active.started_at).getTime()) / 1000));
    if (secondsToLog < 1) return;
    const hoursToLog = Number((secondsToLog / 3600).toFixed(6));
    const pDate = new Date().toISOString().split('T')[0];
    const { error } = await supabase.rpc('log_timer_hours', {
      p_employee_id: employeeId,
      p_allocation_id: active.allocation_id,
      p_hours: hoursToLog,
      p_notes: null,
      p_date: pDate,
    });
    if (!error) {
      window.dispatchEvent(new CustomEvent('timeboxing_timer_started', { detail: { allocationId: active.allocation_id } }));
      await fetchAndCompute();
    }
  }, [employeeId, fetchAndCompute]);

  useEffect(() => {
    fetchAndCompute();
    const t = setInterval(fetchAndCompute, POLL_INTERVAL_MS);
    return () => clearInterval(t);
  }, [fetchAndCompute]);

  useEffect(() => {
    const onTimerStarted = () => fetchAndCompute();
    window.addEventListener('timeboxing_timer_started', onTimerStarted);
    return () => window.removeEventListener('timeboxing_timer_started', onTimerStarted);
  }, [fetchAndCompute]);

  return { ...state, stopCurrentTimer };
}
