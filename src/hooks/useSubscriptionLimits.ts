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

function daysUntil(isoDate: string | null | undefined): number | null {
  if (!isoDate) return null;
  const end = new Date(isoDate).getTime();
  const now = Date.now();
  if (end <= now) return 0;
  return Math.ceil((end - now) / (24 * 60 * 60 * 1000));
}

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

  const trialEndsAt = currentAgency?.trialEndsAt;
  const subscriptionPeriodEndsAt = currentAgency?.subscriptionPeriodEndsAt;
  const subscriptionStatus = currentAgency?.subscriptionStatus;
  const daysRemainingTrial = useMemo(
    () => (subscriptionStatus === 'trialing' ? daysUntil(trialEndsAt) : null),
    [subscriptionStatus, trialEndsAt]
  );
  const daysRemainingPeriod = useMemo(
    () =>
      subscriptionStatus === 'active' && (planId === 'pro' || planId === 'business')
        ? daysUntil(subscriptionPeriodEndsAt)
        : null,
    [subscriptionStatus, planId, subscriptionPeriodEndsAt]
  );

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
    trialEndsAt,
    subscriptionPeriodEndsAt,
    subscriptionStatus,
    daysRemainingTrial,
    daysRemainingPeriod,
  };
}
