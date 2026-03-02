import { ShieldCheck } from 'lucide-react';

interface AnonymizedBannerProps {
  isActive: boolean;
}

/**
 * Banner muy visible que indica que el modo de protección de datos sensibles está activo.
 * Texto en español y en inglés para grabaciones y verificaciones.
 */
export function AnonymizedBanner({ isActive }: AnonymizedBannerProps) {
  if (!isActive) return null;

  return (
    <div
      className="flex items-center gap-3 p-3 rounded-lg border-2 border-emerald-300 bg-emerald-50"
      role="alert"
      aria-live="polite"
    >
      <div className="flex-shrink-0 p-1.5 rounded-lg bg-emerald-200/80">
        <ShieldCheck className="w-5 h-5 text-emerald-800" strokeWidth={2.5} />
      </div>
      <div className="flex-1 min-w-0 space-y-0.5">
        <p className="text-sm font-bold text-emerald-900 leading-snug">
          MODO DEMOSTRACIÓN ACTIVO — Los datos sensibles están protegidos. Los nombres de cuentas y campañas han sido sustituidos por etiquetas genéricas. Los IDs permanecen visibles para demostrar la integración real.
        </p>
        <p className="text-xs font-medium text-emerald-800 leading-snug">
          DEMO MODE ACTIVE — Sensitive data is protected. Account and campaign names have been replaced with generic labels. IDs remain visible to demonstrate the real integration.
        </p>
      </div>
    </div>
  );
}
