/**
 * Edición de proyecto en capa superior mientras el asistente de sugerencias sigue abierto.
 */

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { SensitiveText } from '@/components/privacy/SensitiveText';
import {
  DeadlinesProjectEditForm,
  type DeadlinesProjectEditFormProps,
} from '@/components/deadlines/DeadlinesProjectEditForm';

export type SuggestionsProjectEditOverlayProps = DeadlinesProjectEditFormProps & {
  open: boolean;
  isMobile: boolean;
};

export function SuggestionsProjectEditOverlay({
  open,
  isMobile,
  project,
  deadline,
  effectiveBudgetCap,
  formData,
  formatProjectName,
  onClose,
  ...formProps
}: SuggestionsProjectEditOverlayProps) {
  const totalAssigned = (Object.values(formData.employeeHours) as number[]).reduce(
    (sum, h) => sum + (h || 0),
    0
  );
  const budgetCap = effectiveBudgetCap ?? deadline?.budgetOverride ?? project.budgetHours ?? 0;
  const isOverBudget = totalAssigned > budgetCap;

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
        <SheetContent
          side="bottom"
          className="z-[100] h-[min(75vh,560px)] rounded-t-2xl p-4 overflow-y-auto"
          overlayClassName="z-[100]"
        >
          <SheetHeader className="mb-3 text-left">
            <SheetTitle className="text-base pr-8">
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
            layout="inline"
            project={project}
            deadline={deadline}
            effectiveBudgetCap={effectiveBudgetCap}
            formData={formData}
            formatProjectName={formatProjectName}
            showTitle={false}
            closeButtonLabel="Volver al asistente"
            onClose={onClose}
            {...formProps}
          />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        priority="high"
        className="max-w-[min(96vw,920px)] w-full max-h-[min(88vh,560px)] overflow-y-auto p-4 sm:p-5"
      >
        <DialogHeader className="text-left space-y-1 pr-8">
          <DialogTitle className="text-base">
            <SensitiveText kind="project" id={project.id}>
              {formatProjectName(project.name)}
            </SensitiveText>
          </DialogTitle>
          <DialogDescription className="text-xs font-mono text-slate-500">
            {totalAssigned}h / {budgetCap}h
            {isOverBudget && <span className="text-red-600 ml-1"> · Overload</span>}
            {' · '}
            Ajusta horas sin salir del asistente
          </DialogDescription>
        </DialogHeader>
        <DeadlinesProjectEditForm
          layout="inline"
          project={project}
          deadline={deadline}
          effectiveBudgetCap={effectiveBudgetCap}
          formData={formData}
          formatProjectName={formatProjectName}
          showTitle={false}
          closeButtonLabel="Volver al asistente"
          onClose={onClose}
          {...formProps}
        />
      </DialogContent>
    </Dialog>
  );
}
