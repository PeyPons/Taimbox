/**
 * Sheet de edición de un proyecto (solo móvil): horas por empleado, ajuste presupuesto, notas, ocultar.
 * La página conserva el estado (inlineFormData) y los callbacks de guardado.
 */

import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { SensitiveText } from '@/components/privacy/SensitiveText';
import { DeadlinesProjectEditForm } from '@/components/deadlines/DeadlinesProjectEditForm';

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
  isActive?: boolean;
}

export interface DeadlinesProjectEditSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: ProjectForEdit;
  deadline: DeadlineForEdit | null;
  /** Tope de horas del mes (prorrateo / override); si no se pasa, override o budget del proyecto. */
  effectiveBudgetCap?: number;
  formData: InlineFormData;
  employees: EmployeeOption[];
  formatProjectName: (name: string) => string;
  onEmployeeHoursChange: (employeeId: string, hours: number, projectId: string, triggerSave?: boolean) => void;
  onFormPatch: (patch: Partial<InlineFormData>, saveAfterMs?: number) => void;
  saveStatus: 'idle' | 'saving' | 'saved';
  isLockAcquiring?: boolean;
  onClose: () => void;
}

export function DeadlinesProjectEditSheet({
  open,
  onOpenChange,
  project,
  deadline,
  effectiveBudgetCap,
  formData,
  employees,
  formatProjectName,
  onEmployeeHoursChange,
  onFormPatch,
  saveStatus,
  isLockAcquiring = false,
  onClose,
}: DeadlinesProjectEditSheetProps) {
  const totalAssigned = (Object.values(formData.employeeHours) as number[]).reduce(
    (sum, h) => sum + (h || 0),
    0
  );
  const budgetCap = effectiveBudgetCap ?? deadline?.budgetOverride ?? project.budgetHours ?? 0;
  const isOverBudget = totalAssigned > budgetCap;

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="bottom" className="h-[88vh] rounded-t-2xl p-4 overflow-y-auto">
        <SheetHeader className="mb-4">
          <SheetTitle className="text-base">
            <SensitiveText kind="project" id={project.id}>
              {formatProjectName(project.name)}
            </SensitiveText>
          </SheetTitle>
          <p className="text-xs text-slate-500 font-mono">
            {totalAssigned}h / {budgetCap}h
            {isOverBudget && <span className="text-red-600 ml-1"> · Overload</span>}
          </p>
        </SheetHeader>
        <DeadlinesProjectEditForm
          project={project}
          deadline={deadline}
          effectiveBudgetCap={effectiveBudgetCap}
          formData={formData}
          employees={employees}
          formatProjectName={formatProjectName}
          onEmployeeHoursChange={onEmployeeHoursChange}
          onFormPatch={onFormPatch}
          saveStatus={saveStatus}
          isLockAcquiring={isLockAcquiring}
          onClose={onClose}
          showTitle={false}
        />
      </SheetContent>
    </Sheet>
  );
}
