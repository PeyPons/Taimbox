import { useMemo, useCallback } from 'react';
import { useAgency } from '@/contexts/AgencyContext';
import { Project, CustomProjectFilter } from '@/types';

// Default filters for agencies without custom configuration
const DEFAULT_FILTERS: CustomProjectFilter[] = [
    {
        id: 'seo',
        name: 'seo',
        displayName: 'SEO',
        enabled: true,
        includePatterns: [], // Include all by default
        excludePatterns: ['SEM', 'RRSS', 'SOCIAL', 'PPC', 'DV360'], // Exclude these
        description: 'Proyectos SEO: Excluye SEM, RRSS, Social, PPC y DV360'
    },
    {
        id: 'ppc',
        name: 'ppc',
        displayName: 'PPC',
        enabled: true,
        includePatterns: ['SEM', 'SOCIAL', 'PPC', 'DV360'], // Must contain one of these
        excludePatterns: [],
        description: 'Proyectos PPC: Incluye SEM, Social, PPC y DV360'
    }
];

export function useProjectFilters() {
    const { currentAgency } = useAgency();

    // Get active filters from agency settings or use defaults
    const filters = useMemo(() => {
        const agencyFilters = currentAgency?.settings?.projectFilters;
        if (agencyFilters && agencyFilters.length > 0) {
            return agencyFilters.filter(f => f.enabled);
        }
        return DEFAULT_FILTERS;
    }, [currentAgency?.settings?.projectFilters]);

    // Get all filters for dropdown (enabled ones)
    const activeFilters = useMemo(() => {
        return filters.map(f => ({
            id: f.id,
            name: f.name,
            displayName: f.displayName,
            description: f.description
        }));
    }, [filters]);

    // Filter a project by filter ID
    const filterProject = useCallback((project: Project, filterId: string): boolean => {
        if (filterId === 'all') return true;

        const filter = filters.find(f => f.id === filterId);
        if (!filter) return true;

        const projectNameUpper = project.name.toUpperCase();

        // If includePatterns exist, project must match at least one (OR logic)
        if (filter.includePatterns.length > 0) {
            const matchesInclude = filter.includePatterns.some(pattern =>
                projectNameUpper.includes(pattern.toUpperCase())
            );
            if (!matchesInclude) return false;
        }

        // If excludePatterns exist, project must NOT match any (AND logic)
        if (filter.excludePatterns.length > 0) {
            const matchesExclude = filter.excludePatterns.some(pattern =>
                projectNameUpper.includes(pattern.toUpperCase())
            );
            if (matchesExclude) return false;
        }

        return true;
    }, [filters]);

    // Filter an array of projects
    const filterProjects = useCallback((projects: Project[], filterId: string): Project[] => {
        if (filterId === 'all') return projects;
        return projects.filter(p => filterProject(p, filterId));
    }, [filterProject]);

    // Get display name for a filter ID
    const getFilterDisplayName = useCallback((filterId: string): string => {
        if (filterId === 'all') return 'Todos';
        const filter = filters.find(f => f.id === filterId);
        return filter?.displayName || filterId;
    }, [filters]);

    return {
        filters,
        activeFilters,
        filterProject,
        filterProjects,
        getFilterDisplayName,
        defaultFilters: DEFAULT_FILTERS
    };
}

// Export default filters for use in settings page
export { DEFAULT_FILTERS };
