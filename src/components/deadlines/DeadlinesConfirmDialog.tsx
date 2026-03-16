/**
 * Diálogo de confirmación para acciones de Deadlines: eliminar deadline, asignación, copiar mes, resetear mes.
 */

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';

export type DeadlinesConfirmType = 'delete_deadline' | 'delete_allocation' | 'copy_month' | 'delete_month';

export interface DeadlinesConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: DeadlinesConfirmType | null;
  data?: { count?: number };
  onConfirm: () => void;
}

const titles: Record<DeadlinesConfirmType, string> = {
  delete_deadline: '¿Eliminar deadline?',
  delete_allocation: '¿Eliminar asignación?',
  copy_month: '¿Copiar deadlines?',
  delete_month: '¿Resetear mes completo?',
};

const descriptions: Record<DeadlinesConfirmType, (data?: { count?: number }) => string> = {
  delete_deadline: () => 'Esta acción eliminará la planificación de este proyecto para este mes.',
  delete_allocation: () => 'Esta acción eliminará la asignación global.',
  copy_month: (data) => `Se copiarán ${data?.count ?? 0} deadlines del mes anterior a este mes.`,
  delete_month: (data) =>
    `¿Estás seguro? Se eliminarán TODAS las asignaciones (${data?.count ?? 0} proyectos) de este mes. Esta acción no se puede deshacer.`,
};

export function DeadlinesConfirmDialog({
  open,
  onOpenChange,
  type,
  data,
  onConfirm,
}: DeadlinesConfirmDialogProps) {
  if (!type) return null;

  const title = titles[type];
  const description = descriptions[type](data);
  const isCopy = type === 'copy_month';

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={cn(!isCopy && 'bg-red-600 hover:bg-red-700')}
          >
            {isCopy ? 'Copiar' : 'Eliminar'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
