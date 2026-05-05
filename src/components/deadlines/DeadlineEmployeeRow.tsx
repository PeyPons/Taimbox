/**
 * Fila/chip de un empleado en el contexto Deadlines: modo solo lectura (chip con horas)
 * o modo edición (avatar + nombre + input de horas). Usado por DeadlinesProjectList.
 */

import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export interface DeadlineEmployeeRowEmployee {
  id: string;
  name: string;
  first_name?: string;
  avatarUrl?: string;
}

export interface DeadlineEmployeeRowProps {
  employee: DeadlineEmployeeRowEmployee;
  /** Modo solo lectura: chip con horas (si hours === 0 no se renderiza). Edición: fila con input. */
  mode: 'display' | 'edit';
  /** Horas asignadas (modo display). En display con 0 se retorna null. */
  hours?: number;
  /** Valor del input (modo edit). */
  value?: number | '';
  /** Solo en modo edit: id del proyecto para el callback. */
  projectId?: string;
  /** Solo en modo edit: callback al cambiar horas o al blur/Enter. */
  onHoursChange?: (
    employeeId: string,
    hours: number,
    projectId: string,
    triggerSave?: boolean
  ) => void;
}

export function DeadlineEmployeeRow({
  employee,
  mode,
  hours = 0,
  value = '',
  projectId = '',
  onHoursChange,
}: DeadlineEmployeeRowProps) {
  const displayName = employee.first_name || employee.name;

  if (mode === 'display') {
    if (hours === 0) return null;
    return (
      <div className="flex items-center gap-1.5 bg-slate-100 rounded-full px-2 py-1">
        <Avatar className="h-5 w-5">
          <AvatarImage src={employee.avatarUrl} alt={employee.name} />
          <AvatarFallback className="bg-primary/100 text-white text-[9px]">
            {displayName[0]}
          </AvatarFallback>
        </Avatar>
        <span className="text-xs text-slate-600">{displayName}</span>
        <span className="text-xs font-mono font-bold text-primary">{hours}h</span>
      </div>
    );
  }

  const displayValue = value === '' || value === 0 ? '' : value;

  return (
    <div className="flex items-center gap-2 bg-white border rounded-lg px-2.5 py-1.5">
      <Avatar className="h-6 w-6">
        <AvatarImage src={employee.avatarUrl} alt={employee.name} />
        <AvatarFallback className="bg-primary/100 text-white text-[9px]">
          {displayName[0]}
        </AvatarFallback>
      </Avatar>
      <span className="text-xs text-slate-600">{displayName}</span>
      <Input
        type="number"
        min={0}
        step={0.5}
        value={displayValue}
        onChange={(e) =>
          onHoursChange?.(employee.id, parseFloat(e.target.value) || 0, projectId)
        }
        onFocus={(e) => (e.target as HTMLInputElement).select()}
        onBlur={() => {
          const h = typeof value === 'number' ? value : parseFloat(String(value)) || 0;
          onHoursChange?.(employee.id, h, projectId, true);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            const h = typeof value === 'number' ? value : parseFloat(String(value)) || 0;
            onHoursChange?.(employee.id, h, projectId, true);
            (e.target as HTMLInputElement).blur();
          }
        }}
        className="h-7 w-20 text-center font-mono text-sm px-2"
        placeholder="0"
      />
    </div>
  );
}
