import { Navigate, Outlet } from 'react-router-dom';
import { useAgency } from '@/contexts/AgencyContext';
import { AgencyModules } from '@/types';

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

    const modules = currentAgency?.settings?.modules || {
        seo: true,
        ppc: true,
        weeklyFeedback: true,
        professionalGoals: true,
        deadlines: true
    };

    if (!modules[module]) {
        return <Navigate to={redirectTo} replace />;
    }

    return children ? <>{children}</> : <Outlet />;
}
