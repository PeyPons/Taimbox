import type { ReactNode } from 'react';
import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';

type OnboardingCalloutProps = {
  title?: string;
  children?: ReactNode;
  className?: string;
  /** Viñetas breves (p. ej. desde i18n con returnObjects). */
  bullets?: string[];
};

export function OnboardingCallout({ title, children, className, bullets }: OnboardingCalloutProps) {
  const hasBody = Boolean(children) || (bullets && bullets.length > 0);
  if (!title && !hasBody) return null;

  return (
    <div
      className={cn(
        'rounded-lg border border-slate-200/90 bg-slate-50/95 py-2.5 pl-3 pr-3 sm:pl-3.5 sm:pr-3.5',
        'border-l-[3px] border-l-indigo-400 shadow-sm',
        className
      )}
      role="note"
    >
      <div className="flex gap-2.5">
        <Info className="h-4 w-4 shrink-0 text-indigo-600 mt-0.5" aria-hidden />
        <div className="min-w-0 space-y-1.5 text-xs text-slate-700 leading-relaxed">
          {title ? <p className="font-medium text-slate-800 text-sm">{title}</p> : null}
          {children}
          {bullets && bullets.length > 0 ? (
            <ul className="list-disc pl-3.5 space-y-0.5 marker:text-slate-400">
              {bullets.map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </div>
  );
}
