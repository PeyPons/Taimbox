import { useMemo } from 'react';
import { startOfMonth, subMonths } from 'date-fns';
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
  planIncludesScheduledSync,
  planIncludesAdvancedExports,
  planIncludesFullReports,
  PLAN_DISPLAY_NAMES,
  billableExtraManagedUsers,
  type PlanId,
} from '@/config/plans';
import { countManagedUsers } from '@/utils/managedUsers';

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

  const rawPlanId: PlanId = currentAgency?.planId ?? 'starter';
  const rawStatus = currentAgency?.subscriptionStatus;
  const isTrialExpired =
    rawStatus === 'trialing' &&
    currentAgency?.trialEndsAt &&
    new Date(currentAgency.trialEndsAt).getTime() <= Date.now();
  const planId: PlanId = isTrialExpired ? 'starter' : rawPlanId;
  const limits = getPlanLimit(planId);
  const managedCount = useMemo(() => countManagedUsers(employees), [employees]);
  const maxManaged = limits.maxManagedUsers;
  const isOverLimit = maxManaged !== null && managedCount > maxManaged;
  const isSoftLocked = Boolean(currentAgency) && isOverLimit && planId === 'starter';
  const extraBillable = billableExtraManagedUsers(planId, managedCount);

  const historyMinDate = useMemo<Date | null>(() => {
    if (!limits.limitHistoryToTwoMonths) return null;
    return startOfMonth(subMonths(new Date(), 1));
  }, [limits.limitHistoryToTwoMonths]);

  const canAccessRouteByPlan = (path: string) => canAccessRoute(planId, path);
  const canAddEmployee =
    !isSoftLocked &&
    (maxManaged === null || managedCount < maxManaged);

  const trialEndsAt = currentAgency?.trialEndsAt;
  const subscriptionPeriodEndsAt = currentAgency?.subscriptionPeriodEndsAt;
  const subscriptionStatus = currentAgency?.subscriptionStatus;
  const cancelAtPeriodEnd = currentAgency?.subscriptionCancelAtPeriodEnd ?? false;
  const daysRemainingTrial = useMemo(
    () => (subscriptionStatus === 'trialing' ? daysUntil(trialEndsAt) : null),
    [subscriptionStatus, trialEndsAt]
  );
  const daysRemainingPeriod = useMemo(
    () =>
      subscriptionStatus === 'active' && planId !== 'starter'
        ? daysUntil(subscriptionPeriodEndsAt)
        : null,
    [subscriptionStatus, planId, subscriptionPeriodEndsAt]
  );

  return {
    planId,
    planDisplayName: PLAN_DISPLAY_NAMES[planId],
    limitEmployees: maxManaged,
    includedManagedUsers: limits.includedManagedUsers,
    extraBillableSeats: extraBillable,
    currentEmployees: managedCount,
    isOverLimit,
    isSoftLocked,
    historyMinDate,
    canAccessRouteByPlan,
    canAddEmployee,
    planIncludesAds: planIncludesAds(planId),
    planIncludesOkrs: planIncludesOkrs(planId),
    planIncludesWeekly: planIncludesWeekly(planId),
    planIncludesRadar: planIncludesRadar(planId),
    planIncludesApi: planIncludesApi(planId),
    planIncludesScheduledSync: planIncludesScheduledSync(planId),
    planIncludesAdvancedExports: planIncludesAdvancedExports(planId),
    planIncludesFullReports: planIncludesFullReports(planId),
    trialEndsAt,
    subscriptionPeriodEndsAt,
    subscriptionStatus,
    cancelAtPeriodEnd,
    daysRemainingTrial,
    daysRemainingPeriod,
  };
}
