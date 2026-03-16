/**
 * Sheet de edición de un proyecto (solo móvil): horas por empleado, ajuste presupuesto, notas, ocultar.
 * La página conserva el estado (inlineFormData) y los callbacks de guardado.
 */

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { CheckCircle2 } from 'lucide-react';

export interface InlineFormData {
  employeeHours: Record<string, number>;
  notes: string;
  isHidden: boolean;
  budgetOverride?: number;
}

export interface ProjectForEdit {
  id: string;
  name: string;
  budgetHours?: number;
}

export interface DeadlineForEdit {
  budgetOverride?: number;
}

export interface EmployeeOption {
  id: string;
  name: string;
  first_name?: string;
  avatarUrl?: string;
}

export interface DeadlinesProjectEditSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: ProjectForEdit;
  deadline: DeadlineForEdit | null;
  formData: InlineFormData;
  employees: EmployeeOption[];
  formatProjectName: (name: string) => string;
  onEmployeeHoursChange: (employeeId: string, hours: number, projectId: string, triggerSave?: boolean) => void;
  onFormPatch: (patch: Partial<InlineFormData>, saveAfterMs?: number) => void;
  saveStatus: 'idle' | 'saving' | 'saved';
  onClose: () => void;
}

export function DeadlinesProjectEditSheet({
  open,
  onOpenChange,
  project,
  deadline,
  formData,
  employees,
  formatProjectName,
  onEmployeeHoursChange,
  onFormPatch,
  saveStatus,
  onClose,
}: DeadlinesProjectEditSheetProps) {
  const totalAssigned = (Object.values(formData.employeeHours) as number[]).reduce((sum, h) => sum + (h || 0), 0);
  const isOverBudget = totalAssigned > (project.budgetHours || 0);
  const budgetDisplay = deadline?.budgetOverride ?? project.budgetHours;

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="bottom" className="h-[88vh] rounded-t-2xl p-4 overflow-y-auto">
        <SheetHeader className="mb-4">
          <SheetTitle className="text-base">{formatProjectName(project.name)}</SheetTitle>
          <p className="text-xs text-slate-500 font-mono">
            {totalAssigned}h / {budgetDisplay}h
            {isOverBudget && <span className="text-red-600 ml-1"> · Overload</span>}
          </p>
        </SheetHeader>
        <div className="space-y-4 text-sm">
          <div className="space-y-3">
            <Label className="text-slate-600">Horas por empleado</Label>
            {employees.map((emp) => (
              <div key={emp.id} className="flex items-center gap-3 bg-slate-50 rounded-lg px-3 py-2.5">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarImage src={emp.avatarUrl} alt={emp.name} />
                  <AvatarFallback className="bg-primary/100 text-white text-xs">
                    {(emp.first_name || emp.name)[0]}
                  </AvatarFallback>
                </Avatar>
                <span className="flex-1 text-slate-700 font-medium truncate">{emp.first_name || emp.name}</span>
                <Input
                  type="number"
                  min={0}
                  step={0.5}
                  value={formData.employeeHours[emp.id] ?? ''}
                  onChange={(e) =>
                    onEmployeeHoursChange(emp.id, parseFloat(e.target.value) || 0, project.id)
                  }
                  onBlur={() => {
                    const h = formData.employeeHours[emp.id] || 0;
                    onEmployeeHoursChange(emp.id, h, project.id, true);
                  }}
                  className="h-11 w-24 text-center font-mono text-base"
                  placeholder="0"
                />
              </div>
            ))}
          </div>
          <div>
            <Label className="text-slate-600 mb-1.5 block">Ajuste presupuesto (h)</Label>
            <Input
              type="number"
              placeholder="0"
              value={
                formData.budgetOverride !== undefined
                  ? formData.budgetOverride - (project.budgetHours || 0)
                  : ''
              }
              onChange={(e) => {
                const adjustment = e.target.value === '' ? undefined : parseFloat(e.target.value);
                const base = project.budgetHours || 0;
                const newBudget = adjustment !== undefined ? base + adjustment : undefined;
                onFormPatch({ budgetOverride: newBudget }, 800);
              }}
              className="h-11 font-mono"
            />
          </div>
          <div>
            <Label className="text-slate-600 mb-1.5 block">Notas</Label>
            <Textarea
              placeholder="Notas..."
              value={formData.notes}
              onChange={(e) => onFormPatch({ notes: e.target.value }, 800)}
              className="min-h-[80px] text-sm"
            />
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-slate-600">Ocultar proyecto</span>
            <Switch
              checked={formData.isHidden}
              onCheckedChange={(checked) => onFormPatch({ isHidden: checked })}
            />
          </div>
          <div className="flex gap-2 pt-2">
            {saveStatus === 'saving' && (
              <span className="text-slate-400 text-sm">Guardando...</span>
            )}
            {saveStatus === 'saved' && (
              <span className="text-emerald-600 text-sm flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" /> Guardado
              </span>
            )}
            <Button className="flex-1 h-11" variant="secondary" onClick={onClose}>
              Cerrar
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
