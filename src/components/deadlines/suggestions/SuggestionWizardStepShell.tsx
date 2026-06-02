import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Paso del asistente guiado: cabecera fija, contenido con scroll y acciones siempre visibles abajo.
 */
export function SuggestionWizardStepShell({
  header,
  children,
  footer,
  className,
}: {
  header?: ReactNode;
  children: ReactNode;
  footer: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col flex-1 min-h-0', className)}>
      {header ? <div className="shrink-0 pb-2">{header}</div> : null}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">{children}</div>
      </div>
      <div className="shrink-0 pt-3 mt-2 border-t border-slate-200 bg-background shadow-[0_-6px_16px_-8px_rgba(15,23,42,0.12)]">
        {footer}
      </div>
    </div>
  );
}
