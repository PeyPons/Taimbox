import { useState } from 'react';
import { format } from 'date-fns';
import { Check, ChevronDown } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Command, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import {
  findWeekIndexForTaskWeekDate,
  formatPlannerWeekWorkingRangeLabel,
  type PlannerWeekSlice,
} from '@/utils/dateUtils';

export type WeekPickerProps = {
  value: string;
  onChange: (weekStartDate: string) => void;
  weeks: PlannerWeekSlice[];
  viewDate?: Date;
  disabled?: boolean;
  className?: string;
  /** Resalta semana sobrecargada (mismo criterio que al añadir tareas) */
  isOverloaded?: boolean;
  placeholder?: string;
};

function resolveWeekMeta(
  value: string,
  weeks: PlannerWeekSlice[],
  viewDate?: Date,
): PlannerWeekSlice | null {
  if (!value) return null;
  if (viewDate) {
    const idx = findWeekIndexForTaskWeekDate(value, weeks, viewDate);
    if (idx >= 0) return weeks[idx];
  }
  return weeks.find((w) => format(w.weekStart, 'yyyy-MM-dd') === value) ?? null;
}

export function WeekPicker({
  value,
  onChange,
  weeks,
  viewDate,
  disabled,
  className,
  isOverloaded,
  placeholder = 'Semana',
}: WeekPickerProps) {
  const [open, setOpen] = useState(false);
  const selectedWeek = resolveWeekMeta(value, weeks, viewDate);
  const triggerLabel = selectedWeek ? formatPlannerWeekWorkingRangeLabel(selectedWeek) : placeholder;

  return (
    <Popover open={open} onOpenChange={setOpen} modal>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            'w-full justify-between gap-2 font-normal',
            isOverloaded && 'border-red-300 bg-red-50 text-red-700',
            className,
          )}
        >
          <span className="truncate">{triggerLabel}</span>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0"
        align="start"
        side="bottom"
        avoidCollisions={false}
        sideOffset={4}
      >
        <Command>
          <CommandList className="max-h-[280px] overflow-y-auto overscroll-contain">
            {weeks.map((w) => {
              const val = format(w.weekStart, 'yyyy-MM-dd');
              return (
                <CommandItem
                  key={val}
                  value={val}
                  onSelect={() => {
                    onChange(val);
                    setOpen(false);
                  }}
                >
                  <Check className={cn('mr-2 h-4 w-4 shrink-0', value === val ? 'opacity-100' : 'opacity-0')} />
                  {formatPlannerWeekWorkingRangeLabel(w)}
                </CommandItem>
              );
            })}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
