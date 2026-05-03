import type { DeliverableLifecycleStatus } from '@/utils/deliverableLifecycle';

export function getLifecycleStatusClasses(status: DeliverableLifecycleStatus): {
    dot: string;
    text: string;
    label: string;
} {
    switch (status) {
        case 'no-phase':
            return { dot: 'bg-slate-400', text: 'text-slate-600', label: 'Sin fechas' };
        case 'pre-start':
            return { dot: 'bg-slate-400', text: 'text-slate-600', label: 'Por iniciar' };
        case 'on-track':
            return { dot: 'bg-emerald-500', text: 'text-emerald-700', label: 'En ritmo' };
        case 'at-risk':
            return { dot: 'bg-amber-500', text: 'text-amber-700', label: 'En riesgo' };
        case 'over-budget':
            return { dot: 'bg-red-500', text: 'text-red-700', label: 'Pasado' };
        case 'completed':
            return { dot: 'bg-blue-500', text: 'text-blue-700', label: 'Cerrado' };
        default:
            return { dot: 'bg-slate-400', text: 'text-slate-600', label: '—' };
    }
}
