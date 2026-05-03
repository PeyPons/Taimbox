import { useAgency } from '@/contexts/AgencyContext';
import { DEFAULT_WEEKLY_CLOSE_DAY } from '@/utils/dateUtils';

/**
 * Hook to get the configurable weekly close day from agency settings.
 * Returns the number of days from week start (0-6).
 * Default is 4 (Friday, assuming week starts on Monday).
 */
export function useWeeklyCloseDay(): number {
    const { currentAgency } = useAgency();
    return currentAgency?.settings?.weeklyCloseDay ?? DEFAULT_WEEKLY_CLOSE_DAY;
}
