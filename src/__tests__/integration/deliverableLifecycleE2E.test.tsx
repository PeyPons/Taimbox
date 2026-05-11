import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/supabase', () => ({
    supabase: {
        from: vi.fn(),
    },
}));

import type { ReactElement } from 'react';
import { render, screen } from '@testing-library/react';
import { DeliverableLifecycleBadge } from '@/components/projects/DeliverableLifecycleBadge';
import type { DeliverableLifecycle } from '@/utils/deliverableLifecycle';
import { TooltipProvider } from '@/components/ui/tooltip';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n/config';

vi.mock('@/contexts/AppContext', () => ({
    useApp: () => ({
        projects: [],
        employees: [],
        allocations: [],
        ensureMonthsLoadedInRange: vi.fn().mockResolvedValue(undefined),
    }),
}));

vi.mock('@/contexts/AgencyContext', () => ({
    useAgency: () => ({ currentAgency: { settings: { hoursTrackingPreference: null } } }),
}));

function wrap(ui: ReactElement) {
    return (
        <I18nextProvider i18n={i18n}>
            <TooltipProvider>{ui}</TooltipProvider>
        </I18nextProvider>
    );
}

const baseLifecycle = (status: DeliverableLifecycle['status']): DeliverableLifecycle => {
    const start = new Date('2026-01-01');
    const due = new Date('2026-01-31');
    return {
        phase: { start, due, totalDays: 31 },
        hours: {
            planned: 0,
            actual: 0,
            computed: 47,
            budget: 77,
            available: 30,
            pctConsumed: 61,
        },
        pacing: {
            daysElapsed: 15,
            daysRemaining: 16,
            expectedHoursToDate: 48,
            deltaHours: -1,
            projectedAtDueDate: 97,
            isProjectedOverBudget: false,
        },
        finance: {
            contractFee: 12000,
            costToDate: 2000,
            revenueAccrued: 5800,
            marginAbsolute: 3800,
            marginPct: 65.5,
            effectiveHourlyRate: 155.84,
            hasUnknownCostEmployees: false,
        },
        status,
    };
};

describe('DeliverableLifecycleBadge', () => {
    beforeEach(() => {
        void i18n.changeLanguage('es');
    });

    it('muestra texto compacto para on-track', () => {
        render(
            wrap(
                <DeliverableLifecycleBadge
                    projectId="p1"
                    lifecycle={baseLifecycle('on-track')}
                    disableAutoFetch
                />
            )
        );
        expect(screen.getByText(/47 \/ 77 h · 61%/)).toBeInTheDocument();
    });

    it('no renderiza con no-phase', () => {
        const { container } = render(
            wrap(
                <DeliverableLifecycleBadge
                    projectId="p1"
                    lifecycle={{
                        phase: null,
                        hours: {
                            planned: 0,
                            actual: 0,
                            computed: 0,
                            budget: 0,
                            available: 0,
                            pctConsumed: 0,
                        },
                        pacing: {
                            daysElapsed: 0,
                            daysRemaining: 0,
                            expectedHoursToDate: 0,
                            deltaHours: 0,
                            projectedAtDueDate: 0,
                            isProjectedOverBudget: false,
                        },
                        finance: {
                            contractFee: 0,
                            costToDate: 0,
                            revenueAccrued: 0,
                            marginAbsolute: null,
                            marginPct: null,
                            effectiveHourlyRate: 0,
                            hasUnknownCostEmployees: false,
                        },
                        status: 'no-phase',
                    }}
                    disableAutoFetch
                />
            )
        );
        expect(container.firstChild).toBeNull();
    });
});
