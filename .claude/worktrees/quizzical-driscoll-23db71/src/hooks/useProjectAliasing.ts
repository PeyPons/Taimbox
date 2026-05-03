import { useAgency } from '@/contexts/AgencyContext';
import { ProjectAliasingRule } from '@/types';
import { matchesAliasingRule } from '@/lib/utils';

// Default Kit Digital rule for backward compatibility
const DEFAULT_KIT_DIGITAL_RULE: ProjectAliasingRule = {
    id: 'kit-digital-default',
    name: 'kit-digital',
    displayPrefix: 'KD:',
    enabled: true,
    matchPatterns: ['(KD)', '[KD]', 'KD ', 'KD:', 'kit digital', 'kitdigital'],
    groupAsVirtualClient: true,
    virtualClientName: 'Kit Digital',
    virtualClientColor: '#10b981'
};

/**
 * Hook para acceder a las reglas de aliasing de la agencia actual.
 * Proporciona funciones ya configuradas con las reglas de agencia.
 */
export function useProjectAliasing() {
    const { currentAgency } = useAgency();

    // Get rules from agency settings, fallback to default Kit Digital rule
    const rules: ProjectAliasingRule[] = currentAgency?.settings?.projectAliasingRules?.length
        ? currentAgency.settings.projectAliasingRules
        : [DEFAULT_KIT_DIGITAL_RULE];

    /**
     * Formats a project name according to aliasing rules
     */
    const formatName = (name: string): string => {
        if (!name) return '';

        const matchedRule = matchesAliasingRule(name, rules);

        if (!matchedRule) {
            return name;
        }

        const prefix = matchedRule.displayPrefix;

        // If already formatted with this prefix, return as-is
        if (name.startsWith(prefix)) {
            return name;
        }

        // Try to extract client name from patterns like "- [ClientName]"
        if (name.includes('-')) {
            const parts = name.split('-');
            if (parts.length > 1) {
                const lastPart = parts[parts.length - 1].trim();
                // Remove surrounding brackets: [Name], (Name), {Name}
                const clientName = lastPart
                    .replace(/^\[/, '').replace(/\]$/, '')
                    .replace(/^\(/, '').replace(/\)$/, '')
                    .replace(/^\{/, '').replace(/\}$/, '')
                    .trim();
                if (clientName) {
                    return `${prefix} ${clientName}`;
                }
            }
        }

        // Remove the pattern markers and clean up the name
        let cleanedName = name;
        for (const pattern of matchedRule.matchPatterns) {
            const regex = new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
            cleanedName = cleanedName.replace(regex, '');
        }

        // Remove common extra patterns like [2000€], (2000€)
        cleanedName = cleanedName
            .replace(/\[[^\]]*€[^\]]*\]/g, '')
            .replace(/\([^)]*€[^)]*\)/g, '')
            .replace(/\s*-\s*$/, '')
            .replace(/^\s*-\s*/, '')
            .trim();

        return cleanedName ? `${prefix} ${cleanedName}` : prefix;
    };

    /**
     * Checks if a project matches any aliasing rule
     */
    const matchesRule = (projectName: string): ProjectAliasingRule | null => {
        return matchesAliasingRule(projectName, rules);
    };

    /**
     * Checks if a project should be grouped as a virtual client
     */
    const isVirtualClient = (projectName: string): boolean => {
        const rule = matchesAliasingRule(projectName, rules);
        return rule?.groupAsVirtualClient ?? false;
    };

    return {
        rules,
        formatName,
        matchesRule,
        isVirtualClient
    };
}
