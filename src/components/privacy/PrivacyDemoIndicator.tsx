import { EyeOff } from 'lucide-react';
import { usePrivacyDemo } from '@/contexts/PrivacyDemoContext';
import { cn } from '@/lib/utils';

/**
 * Indicador discreto (una sola franja) cuando el modo demostración está activo en toda la app.
 * No usa el estilo verde del banner de Ads para no repetir el aviso agresivo en cada vista.
 */
export function PrivacyDemoIndicator() {
  const { isActive } = usePrivacyDemo();
  if (!isActive) return null;

  return (
    <div
      className={cn(
        'flex w-full min-w-0 flex-wrap items-start gap-x-2 gap-y-1 px-3 py-2 text-[11px] sm:text-xs sm:items-center',
        /* Desktop: aside fijo w-64 z-50 tapa el tramo izquierdo; alinear el texto con el área de <main> (lg:ml-64) */
        'lg:pl-64',
        'bg-slate-800/95 text-slate-200 border-b border-slate-700/80',
        'shrink-0 z-[45]'
      )}
      role="status"
      aria-live="polite"
    >
      <EyeOff className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400 sm:mt-0" aria-hidden />
      <span className="min-w-0 flex-1 basis-[min(100%,20rem)] leading-snug break-words [overflow-wrap:anywhere]">
        Modo demostración: nombres de personas, clientes, proyectos y departamentos se muestran de forma genérica en toda la aplicación.
      </span>
    </div>
  );
}
