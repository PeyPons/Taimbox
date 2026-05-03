import { cn } from '@/lib/utils';

const METHOD_COLORS = {
  GET: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  POST: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  PATCH: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  DELETE: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
};

export function MethodBadge({ method }: { method: 'GET' | 'POST' | 'PATCH' | 'DELETE' }) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold font-mono border',
        METHOD_COLORS[method],
      )}
    >
      {method}
    </span>
  );
}
