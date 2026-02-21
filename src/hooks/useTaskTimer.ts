import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

const DEFAULT_MAX_HOURS = 12;
const ABSOLUTE_MAX_HOURS = 24;

export interface UseTaskTimerOptions {
  /** Máximo de horas por sesión antes de auto-pausa (1–24, por defecto 12). Viene de settings.timeTrackerMaxHours. */
  maxHours?: number;
  onTimeLogged?: (allocationId: string, hoursLogged: number) => void;
}

export interface UseTaskTimerResult {
  isRunning: boolean;
  isLoading: boolean;
  isSaving: boolean;
  formattedTime: string;
  startTimer: () => Promise<void>;
  stopTimer: () => Promise<void>;
}

function clampMaxHours(h: number | undefined): number {
  if (h == null || Number.isNaN(h)) return DEFAULT_MAX_HOURS;
  const n = Math.round(Number(h));
  return Math.max(1, Math.min(ABSOLUTE_MAX_HOURS, n));
}

export function useTaskTimer(
  employeeId: string | undefined,
  allocationId: string,
  options: UseTaskTimerOptions = {}
): UseTaskTimerResult {
  const { maxHours: maxHoursOption, onTimeLogged } = options;
  const maxHours = clampMaxHours(maxHoursOption ?? DEFAULT_MAX_HOURS);
  const maxSeconds = maxHours * 3600;
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const callLogTimerHours = useCallback(
    async (pEmployeeId: string, pAllocationId: string, hoursToLog: number, notes?: string) => {
      const { error } = await supabase.rpc('log_timer_hours', {
        p_employee_id: pEmployeeId,
        p_allocation_id: pAllocationId,
        p_hours: hoursToLog,
        p_notes: notes ?? null,
        p_date: new Date().toISOString().split('T')[0],
      });
      if (error) throw error;
    },
    []
  );

  const forceStop = useCallback(
    async (allocationIdToClose: string, finalSeconds: number) => {
      if (!employeeId || finalSeconds <= 0) return;
      const hoursToLog = Number((finalSeconds / 3600).toFixed(4));
      if (hoursToLog <= 0) {
        await supabase.from('active_timers').delete().eq('employee_id', employeeId);
        setElapsedSeconds(0);
        setIsRunning(false);
        return;
      }
      await callLogTimerHours(employeeId, allocationIdToClose, hoursToLog);
      setElapsedSeconds(0);
      setIsRunning(false);
      onTimeLogged?.(allocationIdToClose, hoursToLog);
    },
    [employeeId, callLogTimerHours, onTimeLogged]
  );

  const stopTimer = useCallback(async () => {
    if (!employeeId || isSaving) return;
    setIsSaving(true);
    try {
      const hoursToLog = Number((elapsedSeconds / 3600).toFixed(4));
      if (hoursToLog > 0) {
        await callLogTimerHours(employeeId, allocationId, hoursToLog);
      } else {
        await supabase.from('active_timers').delete().eq('employee_id', employeeId);
      }
      setElapsedSeconds(0);
      setIsRunning(false);
      if (hoursToLog > 0) onTimeLogged?.(allocationId, hoursToLog);
    } catch (err) {
      console.error('Error stopping timer:', err);
      toast({
        title: 'Error de conexión',
        description: 'El tiempo sigue corriendo. Inténtalo de nuevo cuando tengas conexión.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  }, [employeeId, allocationId, elapsedSeconds, isSaving, callLogTimerHours, onTimeLogged, toast]);

  // 1. Cargar estado al montar (recuperar si hubo F5)
  useEffect(() => {
    let isMounted = true;

    async function fetchTimer() {
      if (!employeeId) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);

      const { data, error } = await supabase
        .from('active_timers')
        .select('started_at, allocation_id')
        .eq('employee_id', employeeId)
        .maybeSingle();

      if (!isMounted) return;

      if (error) {
        setIsLoading(false);
        return;
      }

      if (data && data.allocation_id === allocationId) {
        const startedAt = new Date(data.started_at).getTime();
        const now = Date.now();
        const diffSeconds = Math.floor((now - startedAt) / 1000);

        if (diffSeconds >= maxSeconds) {
          toast({
            title: 'Cronómetro auto-pausado',
            description: `Se detectó un cronómetro abierto de más de ${maxHours}h. Ha sido pausado automáticamente.`,
            variant: 'destructive',
          });
          try {
            const hoursToLog = Number((maxSeconds / 3600).toFixed(4));
            await callLogTimerHours(employeeId, allocationId, hoursToLog, 'Auto-cierre del sistema');
            setElapsedSeconds(0);
            setIsRunning(false);
            onTimeLogged?.(allocationId, hoursToLog);
          } catch {
            await supabase.from('active_timers').delete().eq('employee_id', employeeId);
            setElapsedSeconds(0);
            setIsRunning(false);
          }
        } else {
          setElapsedSeconds(diffSeconds);
          setIsRunning(true);
        }
      }
      setIsLoading(false);
    }

    fetchTimer();
    return () => {
      isMounted = false;
    };
  }, [employeeId, allocationId, maxSeconds, callLogTimerHours, onTimeLogged, toast]);

  // 2. Motor del reloj (intervalo cada segundo)
  useEffect(() => {
    if (!isRunning) return;

    intervalRef.current = setInterval(() => {
      setElapsedSeconds((prev) => {
        const next = prev + 1;
        if (next >= maxSeconds) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          forceStop(allocationId, maxSeconds).catch(() => {
            setElapsedSeconds(maxSeconds);
            setIsRunning(false);
          });
          return maxSeconds;
        }
        return next;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning, allocationId, maxSeconds, forceStop]);

  const startTimer = useCallback(async () => {
    if (!employeeId) return;

    const { data } = await supabase
      .from('active_timers')
      .select('started_at, allocation_id')
      .eq('employee_id', employeeId)
      .maybeSingle();

    if (data && data.allocation_id !== allocationId) {
      const startedAt = new Date(data.started_at).getTime();
      const now = Date.now();
      const diffSeconds = Math.min(maxSeconds, Math.floor((now - startedAt) / 1000));
      const hoursToLog = Number((diffSeconds / 3600).toFixed(4));
      if (hoursToLog > 0) {
        try {
          await callLogTimerHours(employeeId, data.allocation_id, hoursToLog);
        } catch (err) {
          toast({
            title: 'Error',
            description: 'No se pudo cerrar el timer anterior. Inténtalo de nuevo.',
            variant: 'destructive',
          });
          return;
        }
      } else if (data && data.allocation_id === allocationId) {
        setElapsedSeconds(Math.min(maxSeconds, Math.floor((Date.now() - new Date(data.started_at).getTime()) / 1000)));
        setIsRunning(true);
        return;
      }
    }

    setElapsedSeconds(0);
    setIsRunning(true);
    await supabase.from('active_timers').upsert(
      {
        employee_id: employeeId,
        allocation_id: allocationId,
        started_at: new Date().toISOString(),
      },
      { onConflict: 'employee_id' }
    );
  }, [employeeId, allocationId, maxSeconds, callLogTimerHours, toast]);

  const h = Math.floor(elapsedSeconds / 3600)
    .toString()
    .padStart(2, '0');
  const m = Math.floor((elapsedSeconds % 3600) / 60)
    .toString()
    .padStart(2, '0');
  const s = (elapsedSeconds % 60).toString().padStart(2, '0');
  const formattedTime = `${h}:${m}:${s}`;

  return {
    isRunning,
    isLoading,
    isSaving,
    formattedTime,
    startTimer,
    stopTimer,
  };
}
