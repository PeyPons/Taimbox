import { useMemo, memo } from 'react';
import { AppTrans, useAppTranslation } from '@/hooks/useAppTranslation';
import { useAppOrDemo } from '@/hooks/useAppOrDemo';
import { useAgency } from '@/contexts/AgencyContext';
import { getExcludedProjectIds } from '@/utils/planningPrecisionUtils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Compass, TrendingUp, TrendingDown,
  Lightbulb, Award, HelpCircle, CheckCircle2, History, Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReliabilityIndexCardProps {
  employeeId: string;
  viewDate?: Date;
}

const round2 = (num: number) => Math.round((num + Number.EPSILON) * 100) / 100;

export const ReliabilityIndexCard = memo(function ReliabilityIndexCard({ employeeId, viewDate }: ReliabilityIndexCardProps) {
  const { t } = useAppTranslation();
  const { allocations, employees, projects } = useAppOrDemo();
  const { currentAgency } = useAgency();
  const employee = employees.find(e => e.id === employeeId);
  const targetMonth = viewDate || new Date();

  const reliability = useMemo(() => {
    const excludedIds = getExcludedProjectIds(projects || [], currentAgency?.settings?.planningPrecisionExclusions);

    const allCompletedTasks = (allocations || []).filter(a => {
      if (excludedIds.has(a.projectId)) return false;
      return a.employeeId === employeeId &&
        a.status === 'completed' &&
        a.hoursAssigned > 0 &&
        (a.hoursActual || 0) > 0;
    });

    allCompletedTasks.sort((a, b) => b.weekStartDate.localeCompare(a.weekStartDate));

    const last30Tasks = allCompletedTasks.slice(0, 30);

    const totalEstimated = round2(last30Tasks.reduce((sum, a) => sum + a.hoursAssigned, 0));
    const totalReal = round2(last30Tasks.reduce((sum, a) => sum + (a.hoursActual || 0), 0));
    const tasksAnalyzed = last30Tasks.length;

    const index = totalReal > 0 ? round2((totalEstimated / totalReal) * 100) : 0;

    let trend: 'accurate' | 'overestimates' | 'underestimates' | 'insufficient' = 'insufficient';
    if (tasksAnalyzed >= 5) {
      if (index >= 90 && index <= 110) trend = 'accurate';
      else if (index < 90) trend = 'underestimates';
      else trend = 'overestimates';
    }

    const averageDeviation = tasksAnalyzed > 0 ? round2((totalReal - totalEstimated) / tasksAnalyzed) : 0;

    return { index, totalEstimated, totalReal, tasksAnalyzed, trend, averageDeviation };
  }, [allocations, employeeId, projects, currentAgency?.settings?.planningPrecisionExclusions]);

  const getConfig = () => {
    if (reliability.tasksAnalyzed < 5) {
      return {
        icon: HelpCircle,
        title: t('employeeDashboard.reliability.calibratingTitle'),
        description: t('employeeDashboard.reliability.calibratingDesc'),
        bgColor: 'bg-slate-50',
        borderColor: 'border-slate-200',
        textColor: 'text-slate-600',
        progressColor: ''
      };
    }

    switch (reliability.trend) {
      case 'accurate':
        return {
          icon: Award,
          title: t('employeeDashboard.reliability.accurateTitle'),
          description: t('employeeDashboard.reliability.accurateDesc'),
          bgColor: 'bg-emerald-50',
          borderColor: 'border-emerald-200',
          textColor: 'text-emerald-700',
          progressColor: '[&>div]:bg-emerald-500'
        };
      case 'underestimates':
        return {
          icon: TrendingDown,
          title: t('employeeDashboard.reliability.underestimatesTitle'),
          description: t('employeeDashboard.reliability.underestimatesDesc', {
            hours: Math.abs(reliability.averageDeviation).toFixed(1),
          }),
          bgColor: 'bg-amber-50',
          borderColor: 'border-amber-200',
          textColor: 'text-amber-700',
          progressColor: '[&>div]:bg-amber-500'
        };
      case 'overestimates':
        return {
          icon: TrendingUp,
          title: t('employeeDashboard.reliability.overestimatesTitle'),
          description: t('employeeDashboard.reliability.overestimatesDesc', {
            hours: Math.abs(reliability.averageDeviation).toFixed(1),
          }),
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          textColor: 'text-blue-700',
          progressColor: '[&>div]:bg-blue-500'
        };
      default:
        return {
          icon: HelpCircle,
          title: t('employeeDashboard.reliability.calculating'),
          description: '',
          bgColor: 'bg-slate-50',
          borderColor: 'border-slate-200',
          textColor: 'text-slate-600',
          progressColor: ''
        };
    }
  };

  const config = getConfig();
  const IconComponent = config.icon;

  const getProgressValue = () => {
    if (reliability.tasksAnalyzed < 5) return 50;
    return Math.min(Math.max((reliability.index / 2), 0), 100);
  };

  return (
    <TooltipProvider>
      <Card className={cn('border-l-4', config.borderColor)} data-tour="reliability-index">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-base">
            <div className="flex items-center gap-2">
              <Compass className="h-5 w-5 text-primary" />
              <span>{t('employeeDashboard.reliability.title')}</span>
            </div>
            <Tooltip>
              <TooltipTrigger>
                <Badge variant="outline" className="gap-1 cursor-help">
                  <History className="h-3 w-3" />
                  {t('employeeDashboard.reliability.tasksBadge', { count: reliability.tasksAnalyzed })}
                </Badge>
              </TooltipTrigger>
              <TooltipContent className="max-w-[250px]">
                <p className="text-xs">
                  <AppTrans i18nKey="employeeDashboard.reliability.tooltip" components={{ strong: <strong /> }} />
                </p>
              </TooltipContent>
            </Tooltip>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className={cn('rounded-lg p-4', config.bgColor)}>
            <div className="flex items-start gap-3">
              <div className={cn(
                'h-10 w-10 rounded-full flex items-center justify-center shrink-0',
                reliability.trend === 'accurate' ? 'bg-emerald-100' :
                  reliability.trend === 'underestimates' ? 'bg-amber-100' :
                    reliability.trend === 'overestimates' ? 'bg-blue-100' : 'bg-slate-100'
              )}>
                <IconComponent className={cn('h-5 w-5', config.textColor)} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={cn('font-bold text-lg', config.textColor)}>
                    {reliability.tasksAnalyzed >= 5 ? `${reliability.index}%` : '?'}
                  </span>
                  <span className={cn('text-sm font-medium', config.textColor)}>
                    {config.title}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{config.description}</p>
              </div>
            </div>
          </div>

          {reliability.tasksAnalyzed >= 5 && (
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>{t('employeeDashboard.reliability.scaleNeedMore')}</span>
                <span className="font-medium">{t('employeeDashboard.reliability.scalePerfect')}</span>
                <span>{t('employeeDashboard.reliability.scaleSpare')}</span>
              </div>
              <div className="relative">
                <Progress value={getProgressValue()} className={cn('h-2', config.progressColor)} />
                <div className="absolute top-0 left-1/2 w-0.5 h-2 bg-slate-400 -translate-x-1/2" />
              </div>
            </div>
          )}

          {reliability.tasksAnalyzed >= 5 && (
            <div className="grid grid-cols-2 gap-3 pt-2 border-t">
              <div className="text-center">
                <p className="text-lg font-bold text-slate-700">{reliability.totalEstimated}h</p>
                <p className="text-[10px] text-muted-foreground">{t('employeeDashboard.reliability.estimatedTime')}</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-blue-600">{reliability.totalReal}h</p>
                <p className="text-[10px] text-muted-foreground">{t('employeeDashboard.reliability.dedicatedTime')}</p>
              </div>
            </div>
          )}

          <div className="bg-primary/10 rounded-lg p-3 border border-indigo-100">
            <div className="flex items-start gap-2">
              <Lightbulb className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <div className="text-xs text-indigo-800">
                <p className="font-semibold mb-1">{t('employeeDashboard.reliability.whyTitle')}</p>
                <ul className="space-y-1 text-indigo-700">
                  <li className="flex items-start gap-1">
                    <CheckCircle2 className="h-3 w-3 mt-0.5 shrink-0" />
                    <span>{t('employeeDashboard.reliability.whyCalm')}</span>
                  </li>
                  <li className="flex items-start gap-1">
                    <CheckCircle2 className="h-3 w-3 mt-0.5 shrink-0" />
                    <span>{t('employeeDashboard.reliability.whyDates')}</span>
                  </li>
                  <li className="flex items-start gap-1">
                    <CheckCircle2 className="h-3 w-3 mt-0.5 shrink-0" />
                    <span>{t('employeeDashboard.reliability.whySurprises')}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {reliability.tasksAnalyzed >= 5 && reliability.trend !== 'accurate' && (
            <div className={cn(
              'rounded-lg p-3 border',
              reliability.trend === 'underestimates' ? 'bg-amber-50 border-amber-200' : 'bg-blue-50 border-blue-200'
            )}>
              <div className="flex items-start gap-2">
                <Sparkles className={cn(
                  'h-4 w-4 mt-0.5 shrink-0',
                  reliability.trend === 'underestimates' ? 'text-amber-600' : 'text-blue-600'
                )} />
                <p className={cn(
                  'text-xs',
                  reliability.trend === 'underestimates' ? 'text-amber-800' : 'text-blue-800'
                )}>
                  <span className="font-semibold">{t('employeeDashboard.reliability.tip')}</span>
                  {reliability.trend === 'underestimates'
                    ? t('employeeDashboard.reliability.tipUnderestimate', {
                        percent: Math.round(100 - reliability.index),
                      })
                    : t('employeeDashboard.reliability.tipOverestimate', {
                        percent: Math.round(reliability.index - 100),
                      })}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
});
