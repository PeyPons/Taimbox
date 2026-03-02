import { cn } from '@/lib/utils';
import { ShieldCheck } from 'lucide-react';

interface AnonymizedContentProps {
  isActive: boolean;
  children: React.ReactNode;
  className?: string;
  /** Para celdas de tabla o bloques que necesitan altura mínima */
  asBlock?: boolean;
  /**
   * Nombre semántico genérico (ej: "Cliente A - Retail") en lugar de "Datos protegidos".
   * Demuestra que el software segmenta y organiza datos sin revelar información sensible.
   * Recomendado para vídeos de verificación ante Google Trust & Safety.
   */
  placeholder?: string;
}

/**
 * Muestra el contenido real con efecto blur/pixelado y un overlay.
 * Si se pasa `placeholder`, se muestra ese texto (nombres semánticos genéricos).
 * Si no, se muestra "Datos protegidos". Para grabaciones de vídeo.
 */
export function AnonymizedContent({ isActive, children, className, asBlock, placeholder }: AnonymizedContentProps) {
  if (!isActive) return <>{children}</>;

  const Wrapper = asBlock ? 'div' : 'span';
  const displayText = placeholder ?? 'Datos protegidos';

  return (
    <Wrapper
      className={cn(
        'relative inline-flex min-w-[100px] overflow-hidden rounded',
        asBlock && 'min-h-[1.5em] block',
        className
      )}
    >
      <span
        className="select-none pointer-events-none"
        style={{ filter: 'blur(6px)', userSelect: 'none', opacity: 0.6 }}
      >
        {children}
      </span>
      <span
        className={cn(
          'absolute inset-0 flex items-center justify-center gap-1.5 text-slate-600 font-medium',
          'bg-slate-50/98 backdrop-blur-[1px]',
          asBlock ? 'text-xs' : 'text-[10px]'
        )}
      >
        {!placeholder && <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0 text-emerald-600" />}
        {displayText}
      </span>
    </Wrapper>
  );
}
