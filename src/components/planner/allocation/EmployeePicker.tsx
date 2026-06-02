import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, Plus, User } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import type { Employee } from '@/types';

export type EmployeePickerProps = {
  value: string;
  onChange: (employeeId: string) => void;
  employees: Employee[];
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
  placeholder?: string;
  /** Etiqueta cuando value está vacío pero hay un empleado por defecto visual */
  fallbackLabel?: string;
};

function employeeLabel(emp: Employee | undefined, placeholder: string): string {
  if (!emp) return placeholder;
  return emp.name || emp.first_name || 'Sin nombre';
}

export function EmployeePicker({
  value,
  onChange,
  employees,
  disabled,
  className,
  triggerClassName,
  placeholder = 'Seleccionar empleado...',
  fallbackLabel,
}: EmployeePickerProps) {
  const { t } = useTranslation('app');
  const [open, setOpen] = useState(false);
  const selected = employees.find((e) => e.id === value);
  const triggerLabel = value
    ? employeeLabel(selected, placeholder)
    : fallbackLabel || placeholder;

  return (
    <Popover open={open} onOpenChange={setOpen} modal>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          disabled={disabled}
          className={cn(
            'w-full justify-between px-3 text-left font-normal',
            !value && !fallbackLabel && 'text-muted-foreground',
            triggerClassName,
            className,
          )}
        >
          <span className="flex min-w-0 items-center gap-1.5 truncate">
            <User className="h-3 w-3 shrink-0" />
            {triggerLabel}
          </span>
          <Plus className="ml-2 h-3 w-3 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[calc(100vw-2rem)] max-w-[300px] p-0"
        align="start"
        side="bottom"
        avoidCollisions={false}
        sideOffset={4}
      >
        <Command>
          <CommandInput placeholder="Buscar empleado..." />
          <CommandList className="max-h-[280px] overflow-y-auto overscroll-contain">
            <CommandEmpty>{t('planner.employeePicker.notFound')}</CommandEmpty>
            <CommandGroup>
              {employees.map((emp) => (
                <CommandItem
                  key={emp.id}
                  value={`${emp.name} ${emp.first_name || ''} ${emp.last_name || ''}`}
                  onSelect={() => {
                    onChange(emp.id);
                    setOpen(false);
                  }}
                >
                  <Check className={cn('mr-2 h-4 w-4 shrink-0', value === emp.id ? 'opacity-100' : 'opacity-0')} />
                  <span className="text-sm">{employeeLabel(emp, 'Sin nombre')}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
