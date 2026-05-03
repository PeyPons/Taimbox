import { memo } from 'react';
import { useDeliverableLifecycle } from '@/hooks/useDeliverableLifecycle';
import type { DeliverableLifecycle } from '@/utils/deliverableLifecycle';
import { getLifecycleStatusClasses } from '@/utils/deliverableLifecycleStatus';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useAppTranslation } from '@/hooks/useAppTranslation';

type Props = {
    projectId: string;
    variant?: 'compact' | 'full';
    className?: string;
    /** Pre-calculado en listas (batch). Si `disableAutoFetch`, obligatorio para entregables con fase. */
    lifecycle?: DeliverableLifecycle | null;
    /**
     * En listas: true + `lifecycle` desde el Map del batch (undefined si no es entregable con fase).
     * Evita N× `useDeliverableLifecycle` en filas.
     */
    disableAutoFetch?: boolean;
};

function formatMoney(n: number): string {
    return new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0 }).format(n);
}

function compactContent(data: DeliverableLifecycle): { dot: string; text: string } {
    const { hours, pacing, status, phase } = data;
    const cls = getLifecycleStatusClasses(status);
    const b = hours.budget;

    if (status === 'pre-start' && phase) {
        const days = pacing.daysRemaining;
        return { dot: cls.dot, text: `empieza en ${days} d` };
    }
    if (status === 'completed') {
        return { dot: cls.dot, text: `${hours.computed} / ${b} h · cerrado` };
    }
    if (status === 'over-budget') {
        const over = roundDisplay(hours.computed - b);
        return { dot: cls.dot, text: `${hours.computed} / ${b} h · +${over} h` };
    }
    if (status === 'at-risk') {
        return { dot: cls.dot, text: `${hours.computed} / ${b} h · proy. ${roundDisplay(pacing.projectedAtDueDate)} h` };
    }
    const pct = b > 0 ? Math.round((hours.computed / b) * 100) : 0;
    return { dot: cls.dot, text: `${hours.computed} / ${b} h · ${pct}%` };
}

function roundDisplay(n: number): number {
    return Math.round((n + Number.EPSILON) * 10) / 10;
}

/**
 * Renderiza el badge a partir de un `DeliverableLifecycle` ya calculado. NO llama a hooks de
 * datos (ni `useApp` ni `useDeliverableLifecycle`). Es la versión usada en listas: el padre
 * resuelve el ciclo de vida vía batch y se lo pasa por props.
 *
 * Memoizado por referencia de `lifecycle` + `variant` + `className`. El batch reutiliza la
 * referencia de cache cuando el `appAllocSig` no cambia, así que el mapa puede cambiar sin
 * que cada badge se vuelva a renderizar.
 */
const DeliverableLifecycleBadgePresentational = memo(function DeliverableLifecycleBadgePresentational(props: {
    data: DeliverableLifecycle;
    variant: 'compact' | 'full';
    className?: string;
}): JSX.Element | null {
    const { data, variant, className } = props;
    const { t } = useAppTranslation();

    if (data.status === 'no-phase') return null;

    const cls = getLifecycleStatusClasses(data.status);
    const { hours, pacing, finance } = data;

    if (variant === 'full') {
        return (
            <div
                className={cn(
                    'rounded-lg border bg-muted/30 p-3 text-xs grid grid-cols-2 gap-2 max-w-md',
                    className
                )}
            >
                <div className="col-span-2 flex items-center gap-2">
                    <span className={cn('h-2 w-2 rounded-full shrink-0', cls.dot)} />
                    <span className={cn('font-medium', cls.text)}>{cls.label}</span>
                </div>
                <div>
                    {t('deliverableLifecycle.full.consumed', 'Consumido')}: {hours.computed}h
                </div>
                <div>
                    {t('deliverableLifecycle.full.expected', 'Esperado')}: {pacing.expectedHoursToDate}h
                </div>
                <div>
                    {t('deliverableLifecycle.full.projected', 'Proyección')}: {pacing.projectedAtDueDate}h
                </div>
                <div>
                    {t('deliverableLifecycle.full.daysLeft', 'Días rest.')}: {pacing.daysRemaining}
                </div>
                <div className="col-span-2">
                    {t('deliverableLifecycle.full.margin', 'Margen %')}:
                    {finance.marginPct != null ? ` ${finance.marginPct}%` : ' —'}
                </div>
            </div>
        );
    }

    const tooltipLines = [
        `${t('deliverableLifecycle.tooltip.consumedCap', 'Consumido / Techo')}: ${hours.computed} / ${hours.budget} h`,
        `${t('deliverableLifecycle.tooltip.expectedToday', 'Esperado a hoy')}: ${pacing.expectedHoursToDate} h`,
        `${t('deliverableLifecycle.tooltip.projectedEnd', 'Proyección a fin')}: ${pacing.projectedAtDueDate} h`,
        `${t('deliverableLifecycle.tooltip.daysLeft', 'Días restantes')}: ${pacing.daysRemaining}`,
        `${t('deliverableLifecycle.tooltip.costToDate', 'Coste hasta hoy')}: ${formatMoney(finance.costToDate)} €`,
        `${t('deliverableLifecycle.tooltip.revenueAccrued', 'Ingreso devengado')}: ${formatMoney(finance.revenueAccrued)} €`,
    ];
    if (finance.marginPct != null) {
        tooltipLines.push(
            `${t('deliverableLifecycle.tooltip.marginPct', 'Margen %')}: ${finance.marginPct}%`
        );
    } else {
        tooltipLines.push(`${t('deliverableLifecycle.tooltip.marginPct', 'Margen %')}: —`);
    }
    if (finance.hasUnknownCostEmployees) {
        tooltipLines.push(
            t(
                'deliverableLifecycle.tooltip.unknownCost',
                'Coste subestimado: hay tareas asignadas a empleados eliminados'
            )
        );
    }

    const compact = compactContent(data);
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Badge
                    variant="outline"
                    className={cn('font-normal text-[10px] gap-1.5 cursor-default', className)}
                >
                    <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', compact.dot)} />
                    <span>{compact.text}</span>
                </Badge>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs text-xs space-y-1">
                {tooltipLines.map((line, i) => (
                    <p key={i}>{line}</p>
                ))}
            </TooltipContent>
        </Tooltip>
    );
});

/**
 * Variante autocontenida: resuelve el ciclo de vida llamando a `useDeliverableLifecycle`.
 * Solo debe usarse en lugares puntuales (detalle de un proyecto). En listas, usar el batch
 * desde el padre y pasar `lifecycle` + `disableAutoFetch`.
 */
function DeliverableLifecycleBadgeAuto({
    projectId,
    variant,
    className,
}: {
    projectId: string;
    variant: 'compact' | 'full';
    className?: string;
}): JSX.Element | null {
    const { data } = useDeliverableLifecycle(projectId, { costModeOverride: 'standard' });
    if (data == null) return null;
    return <DeliverableLifecycleBadgePresentational data={data} variant={variant} className={className} />;
}

export function DeliverableLifecycleBadge(props: Props): JSX.Element | null {
    const { projectId, variant = 'compact', className, lifecycle: lifecycleProp, disableAutoFetch } = props;

    if (disableAutoFetch || lifecycleProp !== undefined) {
        if (lifecycleProp == null) return null;
        return (
            <DeliverableLifecycleBadgePresentational
                data={lifecycleProp}
                variant={variant}
                className={className}
            />
        );
    }

    return <DeliverableLifecycleBadgeAuto projectId={projectId} variant={variant} className={className} />;
}
