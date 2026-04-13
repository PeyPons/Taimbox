import { useEffect, useMemo, useState } from 'react';
import { addDays, addMonths, format, startOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useWeeklyCloseMutations, normalizeWeeklyHourInput } from '@/hooks/useWeeklyCloseMutations';
import {
  parseWeeklyCloseHours,
  resolveComputedForClose,
  validateKeepHours,
  validatePostponeRemaining,
} from '@/utils/weeklyCloseShared';
import { getStorageKey, getWeeksForMonth } from '@/utils/dateUtils';
import type { Allocation } from '@/types';
import { useApp } from '@/contexts/AppContext';
import { toast } from '@/lib/notify';
import { cn } from '@/lib/utils';
import { SensitiveText } from '@/components/privacy/SensitiveText';

interface TaskPartialCloseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  allocation: Allocation | null;
  viewDate: Date;
}

export function TaskPartialCloseDialog({
  open,
  onOpenChange,
  allocation,
  viewDate,
}: TaskPartialCloseDialogProps) {
  const { ensureMonthLoaded, loadDataForMonth, getEmployeeLoadForWeek } = useApp();
  const { preference, applyKeep, applyRollover, getSlotsForTaskWeek } =
    useWeeklyCloseMutations(viewDate);

  /** Completar aquí vs posponer el saldo a otra semana (una sola vía: rollover con estimación = saldo). */
  const [mode, setMode] = useState<'keep' | 'postpone'>('postpone');
  const [actualStr, setActualStr] = useState('');
  const [computedStr, setComputedStr] = useState('');
  const [destWeek, setDestWeek] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const slots = useMemo(
    () => (allocation ? getSlotsForTaskWeek(allocation.weekStartDate) : []),
    [allocation, getSlotsForTaskWeek]
  );

  useEffect(() => {
    if (!open || !allocation) return;
    const anchor = startOfMonth(viewDate);
    void ensureMonthLoaded(anchor);
    void loadDataForMonth(addMonths(anchor, 1));
  }, [open, allocation?.id, viewDate, ensureMonthLoaded, loadDataForMonth]);

  useEffect(() => {
    if (!open || !allocation) return;
    setActualStr((allocation.hoursActual ?? 0).toFixed(2));
    setComputedStr((allocation.hoursComputed ?? allocation.hoursActual ?? 0).toFixed(2));
    const s = getSlotsForTaskWeek(allocation.weekStartDate);
    setDestWeek(s[0]?.storageKey || '');
    setMode('postpone');
    setComment('');
  }, [open, allocation, getSlotsForTaskWeek]);

  const actualParsed = parseWeeklyCloseHours(actualStr);
  const hoursRemainingToPostpone = Math.max(0, (allocation?.hoursAssigned ?? 0) - actualParsed);

  const weekSelectContent = useMemo(() => {
    if (!allocation) return null;
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
        {monthSlots.map(slot => {
          const load = getEmployeeLoadForWeek(
            allocation.employeeId,
            slot.storageKey,
            undefined,
            undefined,
            slot.viewMonth
          );
          const h = load?.hours ?? 0;
          const cap = load?.capacity ?? 0;
          const avail = Math.round((cap - h + Number.EPSILON) * 100) / 100;
          const weeks = getWeeksForMonth(slot.viewMonth);
          const wi = weeks.findIndex(w => getStorageKey(w.weekStart, slot.viewMonth) === slot.storageKey);
          const wn = wi >= 0 ? wi + 1 : null;
          const dateRange = `${format(slot.weekStart, 'd', { locale: es })}–${format(addDays(slot.weekStart, 4), 'd MMM', { locale: es })}`;
          const label = `S${wn || '?'} · ${dateRange}`;
          const availLabel =
            avail >= 0 ? `${avail.toFixed(0)}h libres` : `${Math.abs(avail).toFixed(0)}h sobre cap.`;
          return (
            <SelectItem key={slot.storageKey} value={slot.storageKey} className="py-2">
              <span className="text-sm">{label}</span>
              <span
                className={cn(
                  'ml-2 text-xs',
                  avail >= 0 ? 'text-muted-foreground' : 'text-destructive'
                )}
              >
                · {availLabel}
              </span>
            </SelectItem>
          );
        })}
      </SelectGroup>
    ));
  }, [allocation, getEmployeeLoadForWeek, slots]);

  const handleConfirm = async () => {
    if (!allocation || submitting) return;
    setSubmitting(true);
    try {
      const actual = parseWeeklyCloseHours(actualStr);
      const computed = resolveComputedForClose(actual, computedStr, preference);

      if (mode === 'keep') {
        const keepErr = validateKeepHours(actual);
        if (keepErr) {
          toast.error(keepErr);
          return;
        }
        const ok = await applyKeep(
          allocation,
          allocation.employeeId,
          actual,
          computed,
          comment || undefined
        );
        if (ok) {
          toast.success('Tarea completada');
          onOpenChange(false);
        }
        return;
      }

      const postpone = validatePostponeRemaining(actual, allocation.hoursAssigned, destWeek);
      if (!postpone.ok) {
        toast.error(postpone.message);
        return;
      }
      const { remaining } = postpone;
      const okR = await applyRollover(
        allocation,
        allocation.employeeId,
        actual,
        computed,
        remaining,
        destWeek,
        comment || undefined
      );
      if (okR) {
        toast.success(
          actual <= 0
            ? 'Tarea replanificada en la semana elegida'
            : 'Avance registrado; lo pendiente quedó planificado en la semana elegida'
        );
        onOpenChange(false);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!allocation) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" aria-describedby="partial-close-desc">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold tracking-tight">
            Registrar avance y posponer
          </DialogTitle>
          <DialogDescription id="partial-close-desc">
            Indica cuánto has trabajado (0 es válido si no hubo avance). Puedes cerrar la tarea aquí o
            dejar el tiempo pendiente planificado en otra semana (el saldo se calcula solo).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <p className="text-sm font-medium text-foreground">
              <SensitiveText kind="task" id={allocation.id}>
                {allocation.taskName || 'Tarea'}
              </SensitiveText>
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Estimado en esta asignación:{' '}
              <span className="font-mono font-semibold">{allocation.hoursAssigned}h</span>
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="partial-actual">Horas realizadas (totales en este tramo)</Label>
            <Input
              id="partial-actual"
              inputMode="decimal"
              value={actualStr}
              onChange={e => setActualStr(normalizeWeeklyHourInput(e.target.value))}
              className="font-mono"
            />
            {mode === 'postpone' && (
              <p className="text-xs text-muted-foreground">
                Pendiente para la otra semana:{' '}
                <span className="font-mono font-semibold text-foreground">
                  {hoursRemainingToPostpone.toFixed(2)}h
                </span>{' '}
                (estimado menos horas realizadas; con 0h se mueve todo el estimado a la semana elegida)
              </p>
            )}
          </div>

          <RadioGroup
            value={mode}
            onValueChange={v => setMode(v as 'keep' | 'postpone')}
            className="grid gap-2"
          >
            <div className="flex items-center space-x-2 rounded-md border p-3">
              <RadioGroupItem value="postpone" id="pc-postpone" />
              <Label htmlFor="pc-postpone" className="cursor-pointer font-normal leading-snug flex-1">
                <span className="font-medium">Posponer lo pendiente</span>
                <span className="block text-xs text-muted-foreground">
                  Registras lo hecho; eliges la semana y el tiempo que falta se planifica solo en esa
                  semana
                </span>
              </Label>
            </div>
            <div className="flex items-center space-x-2 rounded-md border p-3">
              <RadioGroupItem value="keep" id="pc-keep" />
              <Label htmlFor="pc-keep" className="cursor-pointer font-normal leading-snug flex-1">
                <span className="font-medium">Completar aquí</span>
                <span className="block text-xs text-muted-foreground">
                  Cierras la tarea con las horas indicadas (sin crear continuación en otra semana)
                </span>
              </Label>
            </div>
          </RadioGroup>

          {preference !== 'actual' && (
            <div className="space-y-2">
              <Label htmlFor="partial-computed">Horas computadas</Label>
              <Input
                id="partial-computed"
                inputMode="decimal"
                value={computedStr}
                onChange={e => setComputedStr(normalizeWeeklyHourInput(e.target.value))}
                className="font-mono"
              />
            </div>
          )}

          {mode === 'postpone' && slots.length > 0 && (
            <div className="space-y-2">
              <Label>Semana destino</Label>
              <Select value={destWeek} onValueChange={setDestWeek}>
                <SelectTrigger>
                  <SelectValue placeholder="Elige semana" />
                </SelectTrigger>
                <SelectContent className="max-h-[min(280px,50vh)]">{weekSelectContent}</SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-muted-foreground">Nota (opcional)</Label>
            <Textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              rows={2}
              className="min-h-[56px] resize-y text-sm"
              placeholder="Visible en el historial de la agencia"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleConfirm} disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando…
              </>
            ) : (
              'Confirmar'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
