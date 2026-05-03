import type { ComponentProps } from 'react';
import { Toaster as SonnerToaster } from 'sonner';
import { cn } from '@/lib/utils';

type SonnerToasterProps = ComponentProps<typeof SonnerToaster>;

/**
 * Toasts globales: esquina inferior derecha y z-index por encima de Dialog/AlertDialog (p. ej. z-[9999]).
 * `expand`: lista vertical completa (Sonner por defecto apila en “mazo” y los toasts se solapan).
 */
export function Toaster({ className, ...props }: SonnerToasterProps) {
  return (
    <SonnerToaster
      theme="system"
      position="bottom-right"
      expand
      gap={18}
      visibleToasts={5}
      closeButton
      style={{ zIndex: 10050 }}
      className={cn('toaster group', className)}
      toastOptions={{
        classNames: {
          toast:
            'group toast flex w-full items-start gap-3 rounded-lg border border-slate-200/90 bg-white p-4 text-slate-900 shadow-md dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100',
          title: 'text-sm font-medium leading-snug text-slate-900 dark:text-slate-100',
          description: 'text-sm leading-snug text-slate-600 dark:text-slate-400',
          closeButton:
            'border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800',
          success:
            '!bg-white !text-slate-900 !border-slate-200/90 dark:!bg-slate-950 dark:!text-slate-100 dark:!border-slate-700',
          error:
            '!bg-white !text-slate-900 !border-slate-200/90 dark:!bg-slate-950 dark:!text-slate-100 dark:!border-slate-700',
          info: '!bg-white !text-slate-900 !border-slate-200/90 dark:!bg-slate-950 dark:!text-slate-100 dark:!border-slate-700',
          warning:
            '!bg-white !text-slate-900 !border-slate-200/90 dark:!bg-slate-950 dark:!text-slate-100 dark:!border-slate-700',
        },
      }}
      {...props}
    />
  );
}
