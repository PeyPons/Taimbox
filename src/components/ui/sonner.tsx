import type { ComponentProps } from 'react';
import { Toaster as SonnerToaster } from 'sonner';
import { cn } from '@/lib/utils';

type SonnerToasterProps = ComponentProps<typeof SonnerToaster>;

/**
 * Toasts globales: esquina inferior derecha y z-index por encima de Dialog/AlertDialog (p. ej. z-[9999]).
 */
export function Toaster({ className, ...props }: SonnerToasterProps) {
  return (
    <SonnerToaster
      theme="system"
      position="bottom-right"
      richColors
      closeButton
      style={{ zIndex: 10050 }}
      className={cn('toaster group', className)}
      toastOptions={{
        classNames: {
          toast:
            'group toast border border-border bg-background text-foreground shadow-lg backdrop-blur-sm',
          description: 'text-muted-foreground',
        },
      }}
      {...props}
    />
  );
}
