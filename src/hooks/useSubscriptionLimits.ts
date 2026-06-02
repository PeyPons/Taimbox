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

  // Safety net: if subscription is 'trialing' but trial_ends_at is in the past, treat as Starter
  const rawPlanId: PlanId = currentAgency?.planId ?? 'starter';
  const rawStatus = currentAgency?.subscriptionStatus;
  const isTrialExpired =
    rawStatus === 'trialing' &&
    currentAgency?.trialEndsAt &&
    new Date(currentAgency.trialEndsAt).getTime() <= Date.now();
  const planId: PlanId = isTrialExpired ? 'starter' : rawPlanId;
  const limits = getPlanLimit(planId);
  const currentEmployees = useMemo(
    () => employees.filter((e) => e.isActive !== false).length,
    [employees]
  );
  // maxEmployees is null for enterprise (unlimited)
  const isOverLimit = limits.maxEmployees !== null && currentEmployees > limits.maxEmployees;
  const isSoftLocked = Boolean(currentAgency) && isOverLimit && planId === 'starter';

  /**
   * Fecha mínima de histórico para el plan actual.
   * Si limitHistoryToTwoMonths === true → 1 del mes anterior (ej: hoy 15 marzo → 1 febrero 00:00:00)
   * Si false → null (sin límite)
   */
  const historyMinDate = useMemo<Date | null>(() => {
    if (!limits.limitHistoryToTwoMonths) return null;
    return startOfMonth(subMonths(new Date(), 1));
  }, [limits.limitHistoryToTwoMonths]);

  const canAccessRouteByPlan = (path: string) => canAccessRoute(planId, path);
  const canAddEmployee = !isSoftLocked && (limits.maxEmployees === null || currentEmployees < limits.maxEmployees);

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
    limitEmployees: limits.maxEmployees,
    currentEmployees,
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
    trialEndsAt,
    subscriptionPeriodEndsAt,
    subscriptionStatus,
    cancelAtPeriodEnd,
    daysRemainingTrial,
    daysRemainingPeriod,
  };
}
