import { useMemo } from 'react';
import { useAgency } from '@/contexts/AgencyContext';
import { useApp } from '@/contexts/AppContext';
import {
  getPlanLimit,
  canAccessRoute,
  planIncludesAds,
  planIncludesOkrs,
  planIncludesWeekly,
  planIncludesRadar,
  planIncludesApi,
  type PlanId,
} from '@/config/plans';

export function useSubscriptionLimits() {
  const { currentAgency } = useAgency();
  const { employees } = useApp();

  const planId: PlanId = currentAgency?.planId ?? 'starter';
  const limits = getPlanLimit(planId);
  const currentEmployees = useMemo(
    () => employees.filter((e) => e.isActive !== false).length,
    [employees]
  );
  const isOverLimit = currentEmployees > limits.maxEmployees;
  const isSoftLocked = isOverLimit && planId === 'starter';
  const maxReportingDays = limits.maxReportingDays;

  const canAccessRouteByPlan = (path: string) => canAccessRoute(planId, path);
  const canAddEmployee = !isSoftLocked && currentEmployees < limits.maxEmployees;

  return {
    planId,
    limitEmployees: limits.maxEmployees,
    currentEmployees,
    isOverLimit,
    isSoftLocked,
    maxReportingDays,
    canAccessRouteByPlan,
    canAddEmployee,
    planIncludesAds: planIncludesAds(planId),
    planIncludesOkrs: planIncludesOkrs(planId),
    planIncludesWeekly: planIncludesWeekly(planId),
    planIncludesRadar: planIncludesRadar(planId),
    planIncludesApi: planIncludesApi(planId),
    trialEndsAt: currentAgency?.trialEndsAt,
    subscriptionStatus: currentAgency?.subscriptionStatus,
  };
}
