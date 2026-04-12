import { Navigate, Outlet } from 'react-router-dom';
import { useAgency } from '@/contexts/AgencyContext';
import { AgencyModules } from '@/types';

const MODULE_DEFAULTS: Required<Pick<AgencyModules, 'seo' | 'ppc' | 'weeklyFeedback' | 'professionalGoals' | 'deadlines' | 'timeTracker'>> = {
    seo: true,
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

export function ModuleGuard({ module, redirectTo = '/dashboard', children }: ModuleGuardProps) {
    const { currentAgency, isLoading } = useAgency();

    if (isLoading) {
        return null; // O un spinner
    }

    const modules: AgencyModules = {
        ...MODULE_DEFAULTS,
        ...currentAgency?.settings?.modules,
    };

    if (!modules[module]) {
        return <Navigate to={redirectTo} replace />;
    }

    return children ? <>{children}</> : <Outlet />;
}
