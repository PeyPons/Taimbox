import { Play, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTaskTimer } from '@/hooks/useTaskTimer';
import { useAgency } from '@/contexts/AgencyContext';
import { cn } from '@/lib/utils';

export interface TaskTimerProps {
  employeeId: string;
  allocationId: string;
  disabled?: boolean;
  onTimeLogged?: (allocationId: string, hoursLogged: number) => void;
}

export function TaskTimer({
  employeeId,
  allocationId,
  disabled = false,
  onTimeLogged,
}: TaskTimerProps) {
  const { currentAgency } = useAgency();
  const maxHours = currentAgency?.settings?.timeTrackerMaxHours ?? 12;
  const { isRunning, isLoading, isSaving, formattedTime, startTimer, stopTimer } = useTaskTimer(
    employeeId,
    allocationId,
    { maxHours, onTimeLogged }
  );

  if (isLoading) {
    return (
      <div
        className="h-8 w-24 bg-slate-100 animate-pulse rounded-full"
        aria-hidden="true"
      />
    );
  }

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-1 rounded-full border transition-colors',
        isRunning ? 'bg-green-50/50 border-green-200 text-green-700' : 'bg-slate-50 border-slate-200 text-slate-600',
        disabled && 'opacity-50 pointer-events-none'
      )}
      role="timer"
      aria-live="polite"
      aria-label={`Tiempo transcurrido: ${formattedTime}`}
    >
      <span className="font-mono text-sm font-medium w-16 text-center tabular-nums">
        {formattedTime}
      </span>

      {isRunning ? (
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-red-500 hover:bg-red-100 hover:text-red-600 rounded-full pointer-events-auto disabled:pointer-events-none"
          onClick={stopTimer}
          disabled={disabled || isSaving}
          aria-label="Detener cronómetro"
        >
          <Square className="h-3 w-3 fill-current" />
        </Button>
      ) : (
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-slate-500 hover:bg-green-100 hover:text-green-600 rounded-full"
          onClick={startTimer}
          disabled={disabled}
          aria-label="Iniciar cronómetro"
        >
          <Play className="h-3 w-3 fill-current" />
        </Button>
      )}
    </div>
  );
}
