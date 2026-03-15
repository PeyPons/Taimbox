import { useState, useEffect, useCallback } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useAgency } from '@/contexts/AgencyContext';
import { supabase } from '@/lib/supabase';
import { useActiveTimerForSidebar } from '@/hooks/useActiveTimerForSidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Square, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TeamActiveTimerRow {
  employee_id: string;
  employee_name: string | null;
  allocation_id: string;
  task_name: string | null;
  client_name: string | null;
  started_at: string;
}

function formatElapsed(startedAt: string): string {
  const start = new Date(startedAt).getTime();
  const elapsed = Math.max(0, Math.floor((Date.now() - start) / 1000));
  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const s = elapsed % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function TiemposPage() {
  const { currentUser } = useApp();
  const { currentAgency } = useAgency();
  const { toast } = useToast();
  const [rows, setRows] = useState<TeamActiveTimerRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [, setTick] = useState(0);
  const isTimeTrackerEnabled = (currentAgency?.settings?.modules?.timeTracker ?? false) && currentUser?.user_id != null;
  const activeTimer = useActiveTimerForSidebar(isTimeTrackerEnabled ? currentUser?.id : undefined);

  const fetchTeamTimers = useCallback(async () => {
    const { data, error } = await supabase.rpc('get_team_active_timers');
    if (error) {
      setRows([]);
      return;
    }
    setRows((data as TeamActiveTimerRow[]) ?? []);
  }, []);

  useEffect(() => {
    if (!isTimeTrackerEnabled) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    fetchTeamTimers().finally(() => setIsLoading(false));
    const t = setInterval(fetchTeamTimers, 60000);
    return () => clearInterval(t);
  }, [isTimeTrackerEnabled, fetchTeamTimers]);

  useEffect(() => {
    const handleUpdate = () => fetchTeamTimers();
    window.addEventListener('timeboxing_timer_started', handleUpdate);
    window.addEventListener('timeboxing_timer_stopped', handleUpdate);
    const bc = new BroadcastChannel('timer_sync');
    bc.onmessage = handleUpdate;
    return () => {
      window.removeEventListener('timeboxing_timer_started', handleUpdate);
      window.removeEventListener('timeboxing_timer_stopped', handleUpdate);
      bc.close();
    };
  }, [fetchTeamTimers]);

  useEffect(() => {
    if (rows.length === 0) return;
    const id = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [rows.length]);

  const handleStopOwn = async () => {
    await activeTimer.stopCurrentTimer();
    await fetchTeamTimers();
    toast({ title: 'Cronómetro parado', description: 'El tiempo se ha guardado correctamente.' });
  };

  if (!isTimeTrackerEnabled) {
    return (
      <div className="flex flex-col h-full space-y-6 p-6 md:p-8 max-w-4xl mx-auto w-full">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Tiempos</h1>
          <p className="text-muted-foreground mt-1">Cronómetros del equipo.</p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-slate-600">El módulo de cronómetro no está activo en tu agencia. Actívalo en Configuración de agencia para ver quién está registrando tiempo.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full space-y-6 p-6 md:p-8 max-w-4xl mx-auto w-full">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Tiempos</h1>
        <p className="text-muted-foreground mt-1">Quién está registrando tiempo ahora y total del día.</p>
      </div>

      {isLoading ? (
        <div className="grid gap-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="py-4">
                <div className="h-5 bg-slate-200 rounded w-1/3" />
                <div className="h-4 bg-slate-100 rounded w-2/3 mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : rows.length === 0 ? (
        <Card>
          <CardHeader>
            <Clock className="h-10 w-10 text-slate-300 mx-auto mb-2" />
            <CardTitle className="text-center">Nadie tiene el cronómetro en marcha</CardTitle>
            <CardDescription className="text-center">
              Cuando alguien pulse Play en una tarea del planificador, aparecerá aquí.
            </CardDescription>
          </CardHeader>
          {currentUser && (
            <CardContent className="pt-0 border-t">
              <div className="flex items-center justify-between pt-4">
                <span className="text-sm text-slate-600">Tu total hoy</span>
                <span className="text-sm font-medium text-slate-900">{activeTimer.formattedTimeLabel}</span>
              </div>
            </CardContent>
          )}
        </Card>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => {
            const isOwn = row.employee_id === currentUser?.id;
            return (
              <Card key={`${row.employee_id}-${row.allocation_id}`} className={isOwn ? 'ring-2 ring-emerald-200' : ''}>
                <CardContent className="py-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-slate-900 font-medium">
                        <User className="h-4 w-4 text-slate-500 shrink-0" />
                        <span>{row.employee_name ?? 'Empleado'}</span>
                        {isOwn && (
                          <span className="text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">Tú</span>
                        )}
                      </div>
                      <div className="mt-1 text-sm text-slate-600 truncate">
                        {row.task_name ?? 'Tarea'}
                        {row.client_name && (
                          <span className="text-slate-400"> · {row.client_name}</span>
                        )}
                      </div>
                      {isOwn && activeTimer.formattedTimeLabel !== '0 min' && (
                        <div className="mt-1 text-xs text-slate-500">
                          Hoy en total: {activeTimer.formattedTimeLabel}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-emerald-600 font-mono tabular-nums text-sm font-medium">
                        {formatElapsed(row.started_at)}
                      </span>
                      {isOwn && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                          onClick={handleStopOwn}
                          disabled={activeTimer.isActive === false}
                        >
                          <Square className="h-3.5 w-3 fill-current mr-1" />
                          Parar
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {currentUser && !rows.some((r) => r.employee_id === currentUser.id) && (
            <Card className="border-dashed">
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Tu total hoy (sin cronómetro activo)</span>
                  <span className="text-sm font-medium text-slate-900">{activeTimer.formattedTimeLabel}</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
