/**
 * Formulario de edición de horas de un proyecto (compartido por Sheet y Dialog).
 */

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SensitiveText } from '@/components/privacy/SensitiveText';
import { DeadlineEmployeeRow } from '@/components/deadlines/DeadlineEmployeeRow';
import { cn } from '@/lib/utils';
import { CheckCircle2 } from 'lucide-react';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import type {
  DeadlinesProjectEditSheetProps,
  InlineFormData,
  ProjectForEdit,
} from '@/components/deadlines/DeadlinesProjectEditSheet';

export type DeadlinesProjectEditFormProps = Pick<
  DeadlinesProjectEditSheetProps,
  | 'project'
  | 'deadline'
  | 'effectiveBudgetCap'
  | 'formData'
  | 'employees'
  | 'formatProjectName'
  | 'onEmployeeHoursChange'
  | 'onFormPatch'
  | 'saveStatus'
  | 'isLockAcquiring'
  | 'onClose'
> & {
  showTitle?: boolean;
  closeButtonLabel?: string;
  /** `inline`: chips en fila como en la tabla de Deadlines (modal ancho). */
  layout?: 'stacked' | 'inline';
};

export function DeadlinesProjectEditForm({
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
  showTitle = true,
  closeButtonLabel,
  layout = 'stacked',
}: DeadlinesProjectEditFormProps) {
  const { t } = useAppTranslation();
  const resolvedCloseLabel = closeButtonLabel ?? t('deadlines.projectList.close');
  const totalAssigned = (Object.values(formData.employeeHours) as number[]).reduce(
    (sum, h) => sum + (h || 0),
    0
  );
  const budgetCap = effectiveBudgetCap ?? deadline?.budgetOverride ?? project.budgetHours ?? 0;
  const isOverBudget = totalAssigned > budgetCap;
  const employeesForEdit = employees.filter((emp) => {
    if (emp.isActive !== false) return true;
    return (formData.employeeHours[emp.id] || 0) > 0;
  });

  return (
    <div className="space-y-4 text-sm">
      {showTitle && (
        <div className="mb-1">
          <p className="text-base font-semibold text-slate-900">
            <SensitiveText kind="project" id={project.id}>
              {formatProjectName(project.name)}
            </SensitiveText>
          </p>
          <p className="text-xs text-slate-500 font-mono mt-0.5">
            {totalAssigned}h / {budgetCap}h
            {isOverBudget && <span className="text-red-600 ml-1"> · Overload</span>}
          </p>
        </div>
      )}
      {layout === 'inline' ? (
        <>
          {isLockAcquiring && (
            <p className="text-xs text-slate-500 animate-pulse mb-2">{t('deadlines.projectList.checkingLock')}</p>
          )}
          <div className={cn('rounded-lg bg-slate-50 border border-slate-200 p-3', isLockAcquiring && 'opacity-80')}>
            <div className={cn(isLockAcquiring && 'pointer-events-none select-none')}>
              <div className="flex flex-wrap gap-2">
                {employeesForEdit.map((emp) => (
                  <DeadlineEmployeeRow
                    key={emp.id}
                    employee={emp}
                    mode="edit"
                    value={formData.employeeHours[emp.id] ?? ''}
                    projectId={project.id}
                    onHoursChange={onEmployeeHoursChange}
                    disabled={isLockAcquiring}
                  />
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-3 pt-3 mt-3 border-t border-slate-200">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-500 shrink-0">{t('deadlines.projectEditForm.adjustment')}</span>
                  <Input
                    type="number"
                    step={0.5}
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
                    onFocus={(e) => (e.target as HTMLInputElement).select()}
                    className="h-7 w-16 text-center font-mono text-xs px-1"
                    disabled={isLockAcquiring}
                  />
                  {formData.budgetOverride !== undefined && (
                    <span className="text-[10px] text-slate-400 font-mono">
                      = {formData.budgetOverride}h
                    </span>
                  )}
                </div>
                <Input
                  placeholder={t('deadlines.projectList.notesPlaceholder')}
                  value={formData.notes}
                  onChange={(e) => onFormPatch({ notes: e.target.value }, 800)}
                  className="h-7 text-xs flex-1 min-w-[140px]"
                  disabled={isLockAcquiring}
                />
                <label className="flex items-center gap-1.5 text-xs cursor-pointer shrink-0">
                  <Switch
                    checked={formData.isHidden}
                    onCheckedChange={(checked) => onFormPatch({ isHidden: checked })}
                    className="scale-75"
                    disabled={isLockAcquiring}
                  />
                  <span className="text-slate-500">{t('deadlines.projectList.hide')}</span>
                </label>
                <div className="ml-auto flex items-center gap-2 shrink-0">
                  {saveStatus === 'saving' && (
                    <span className="text-slate-400 text-xs animate-pulse">{t('deadlines.projectList.saving')}</span>
                  )}
                  {saveStatus === 'saved' && (
                    <span className="text-emerald-600 text-xs flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> {t('deadlines.projectList.saved')}
                    </span>
                  )}
                  <Button size="sm" variant="secondary" className="h-8 text-xs" onClick={onClose}>
                    {resolvedCloseLabel}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="space-y-3">
            <Label className="text-slate-600">{t('deadlines.projectEditForm.hoursPerEmployee')}</Label>
            {isLockAcquiring && (
              <p className="text-xs text-slate-500 animate-pulse">{t('deadlines.projectList.checkingLock')}</p>
            )}
            {employeesForEdit.map((emp) => (
              <div key={emp.id} className="flex items-center gap-3 bg-slate-50 rounded-lg px-3 py-2.5">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarImage src={emp.avatarUrl} alt={emp.name} />
                  <AvatarFallback className="bg-primary/100 text-white text-xs">
                    {(emp.first_name || emp.name)[0]}
                  </AvatarFallback>
                </Avatar>
                <span className="flex-1 text-slate-700 font-medium truncate">
                  {emp.first_name || emp.name}
                </span>
                <Input
                  type="number"
                  min={0}
                  step={0.5}
                  value={(() => {
                    const h = formData.employeeHours[emp.id];
                    return h == null || h === 0 ? '' : h;
                  })()}
                  onChange={(e) =>
                    onEmployeeHoursChange(emp.id, parseFloat(e.target.value) || 0, project.id)
                  }
                  onFocus={(e) => (e.target as HTMLInputElement).select()}
                  onBlur={() => {
                    const h = formData.employeeHours[emp.id] || 0;
                    onEmployeeHoursChange(emp.id, h, project.id, true);
                  }}
                  className="h-11 w-24 text-center font-mono text-base"
                  placeholder="0"
                  disabled={isLockAcquiring}
                />
              </div>
            ))}
          </div>
          <div>
            <Label className="text-slate-600 mb-1.5 block">{t('deadlines.projectEditForm.budgetAdjustment')}</Label>
            <Input
              type="number"
              step={0.5}
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
              onFocus={(e) => (e.target as HTMLInputElement).select()}
              className="h-11 font-mono"
              disabled={isLockAcquiring}
            />
          </div>
          <div>
            <Label className="text-slate-600 mb-1.5 block">{t('deadlines.projectEditForm.notes')}</Label>
            <Textarea
              placeholder="Notas..."
              value={formData.notes}
              onChange={(e) => onFormPatch({ notes: e.target.value }, 800)}
              className="min-h-[80px] text-sm"
              disabled={isLockAcquiring}
            />
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-slate-600">{t('deadlines.projectEditForm.hideProject')}</span>
            <Switch
              checked={formData.isHidden}
              onCheckedChange={(checked) => onFormPatch({ isHidden: checked })}
              disabled={isLockAcquiring}
            />
          </div>
          <div className="flex gap-2 pt-2">
            {saveStatus === 'saving' && <span className="text-slate-400 text-sm">Guardando...</span>}
            {saveStatus === 'saved' && (
              <span className="text-emerald-600 text-sm flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" /> Guardado
              </span>
            )}
            <Button className="flex-1 h-11" variant="secondary" onClick={onClose}>
              {closeButtonLabel}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

export type { InlineFormData, ProjectForEdit };
