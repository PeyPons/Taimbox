import { useCallback, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAgency } from '@/contexts/AgencyContext';
import { useApp } from '@/contexts/AppContext';
import { useSubscriptionLimits } from '@/hooks/useSubscriptionLimits';
import type { PlanId } from '@/types';
import type { AgencyCurrencyCode } from '@/constants/currencies';
import { resolveAgencyCurrency } from '@/utils/currencyUtils';
import {
  buildDefaultDepartment,
  buildRecommendedAgencySettings,
  DEFAULT_DEPARTMENT_NAME,
  quickChecklistStorageKey,
  ONBOARDING_WIZARD_ALLOWED_KEY,
} from '@/utils/onboardingDefaults';

const ADMIN_ROLE_NAME = 'Administrador';

export function useOnboardingQuickSetup() {
  const { planId } = useSubscriptionLimits();
  const {
    currentAgency,
    updateSettings,
    completeSetup,
    refreshAgency,
    updateUserAgencyRole,
  } = useAgency();
  const { currentUser, updateEmployee } = useApp();
  const [isApplying, setIsApplying] = useState(false);

  const applyQuickOnboardingDefaults = useCallback(async (opts?: { currency?: AgencyCurrencyCode }) => {
    if (!currentAgency?.id) {
      throw new Error('No hay agencia activa. Recarga la página e inténtalo de nuevo.');
    }
    setIsApplying(true);
    try {
      const effectivePlan = (currentAgency.planId ?? planId ?? 'business') as PlanId;
      const dept = buildDefaultDepartment();

      const { error: deptConfigError } = await supabase.from('department_config').upsert(
        {
          agency_id: currentAgency.id,
          department_name: dept.name,
          default_view: 'weekly',
          is_view_strict: false,
        },
        { onConflict: 'agency_id,department_name' }
      );
      if (deptConfigError) console.error('[Quick onboarding] department_config', deptConfigError);

      const { data: dcRows } = await supabase
        .from('department_config')
        .select('id, department_name')
        .eq('agency_id', currentAgency.id)
        .eq('department_name', dept.name)
        .maybeSingle();

      const deptId = dcRows?.id ?? dept.id;
      const deptDefs = [{ id: deptId, name: dept.name, color: dept.color }];

      await updateSettings({
        ...buildRecommendedAgencySettings(effectivePlan),
        currency: opts?.currency ?? resolveAgencyCurrency(currentAgency.settings),
        departments: deptDefs,
      });

      if (currentUser) {
        try {
          await updateEmployee({
            ...currentUser,
            department: DEFAULT_DEPARTMENT_NAME,
            departmentId: deptId,
            role: ADMIN_ROLE_NAME,
          });
          if (currentUser.user_id) {
            await updateUserAgencyRole(
              currentUser.user_id,
              currentAgency.id,
              ADMIN_ROLE_NAME,
              DEFAULT_DEPARTMENT_NAME
            );
          }
        } catch (err) {
          console.warn('[Quick onboarding] employee update', err);
        }
      }

      await completeSetup();
      await refreshAgency();

      if (typeof window !== 'undefined') {
        localStorage.setItem(quickChecklistStorageKey(currentAgency.id), '1');
        localStorage.removeItem('onboarding_wizard_step_v2');
        localStorage.removeItem('onboarding_step');
        sessionStorage.removeItem(ONBOARDING_WIZARD_ALLOWED_KEY);
      }
    } finally {
      setIsApplying(false);
    }
  }, [
    currentAgency,
    planId,
    updateSettings,
    completeSetup,
    refreshAgency,
    updateUserAgencyRole,
    currentUser,
    updateEmployee,
  ]);

  return { applyQuickOnboardingDefaults, isApplying };
}
