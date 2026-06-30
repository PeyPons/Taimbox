import { Navigate, Outlet } from 'react-router-dom';
import { useAgency } from '@/contexts/AgencyContext';
import { AgencyModules, type AgencySettings } from '@/types';
import { PageLoader } from '@/components/layout/PageLoader';
import { resolveWeeklyEnabled } from '@/utils/agencyUtils';
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

function isAgencyModuleEnabled(module: keyof AgencyModules, settings: AgencySettings | undefined): boolean {
    if (module === 'weeklyFeedback') {
        return resolveWeeklyEnabled(settings);
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

    if (!isAgencyModuleEnabled(module, currentAgency?.settings)) {
        const fallbackRedirect =
            module === 'weeklyFeedback' && canAccess('/agency')
                ? '/agency?tab=modules'
                : '/dashboard';

        return <Navigate to={redirectTo ?? fallbackRedirect} replace />;
    }

    return children ? <>{children}</> : <Outlet />;
}
