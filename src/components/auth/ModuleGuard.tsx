import { Navigate, Outlet } from 'react-router-dom';
import { useAgency } from '@/contexts/AgencyContext';
import { AgencyModules, type AgencySettings } from '@/types';
import { PageLoader } from '@/components/layout/PageLoader';
import { resolveWeeklyEnabled } from '@/utils/agencyUtils';
import { effectivePlanId, visibleAgencyModules } from '@/utils/effectivePlanModules';
import { usePermissions } from '@/hooks/usePermissions';

const MODULE_DEFAULTS: Required<Pick<AgencyModules, 'ppc' | 'weeklyFeedback' | 'professionalGoals' | 'deadlines' | 'timeTracker'>> = {
    ppc: true,
    weeklyFeedback: true,
    professionalGoals: true,
    deadlines: true,
    timeTracker: false,
};

interface ModuleGuardProps {
    module: keyof AgencyModules;
    redirectTo?: string;
    children?: React.ReactNode;
}

function isAgencyModuleEnabled(
    module: keyof AgencyModules,
    settings: AgencySettings | undefined,
    planId: ReturnType<typeof effectivePlanId>,
): boolean {
    const visible = visibleAgencyModules(settings, planId);
    if (module === 'weeklyFeedback') {
        return visible.weeklyFeedback && resolveWeeklyEnabled(settings);
    }
    if (module in visible) {
        return Boolean(visible[module as keyof typeof visible]);
    }

    const modules: AgencyModules = {
        ...MODULE_DEFAULTS,
        ...settings?.modules,
    };

    return Boolean(modules[module]);
}

export function ModuleGuard({ module, redirectTo, children }: ModuleGuardProps) {
    const { currentAgency, isLoading } = useAgency();
    const { canAccess } = usePermissions();

    if (isLoading) {
        return <PageLoader />;
    }

    const planId = effectivePlanId({
        planId: currentAgency?.planId,
        subscriptionStatus: currentAgency?.subscriptionStatus,
        trialEndsAt: currentAgency?.trialEndsAt,
    });

    if (!isAgencyModuleEnabled(module, currentAgency?.settings, planId)) {
        const fallbackRedirect =
            module === 'weeklyFeedback' && canAccess('/agency')
                ? '/agency?tab=modules'
                : '/dashboard';

        return <Navigate to={redirectTo ?? fallbackRedirect} replace />;
    }

    return children ? <>{children}</> : <Outlet />;
}
