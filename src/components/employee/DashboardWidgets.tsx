import { memo } from 'react';
import { AppTrans, useAppTranslation } from '@/hooks/useAppTranslation';
import { useAppOrDemo } from '@/hooks/useAppOrDemo';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, ArrowRight, Sparkles, Link as LinkIcon, CheckCircle2, Clock, Flag, Rocket } from 'lucide-react';
import { isAllocationInEffectiveMonth } from '@/utils/dateUtils';
import { useProjectAliasing } from '@/hooks/useProjectAliasing';
import { SensitiveText } from '@/components/privacy/SensitiveText';

interface WidgetProps {
    employeeId: string;
    viewDate?: Date;
}

export const PriorityInsights = memo(function PriorityInsights({ employeeId, viewDate }: WidgetProps) {
    const { t } = useAppTranslation();
    const { allocations, projects, employees } = useAppOrDemo();
    const { formatName: formatProjectName } = useProjectAliasing();
    const targetMonth = viewDate || new Date();

    const myTasks = allocations.filter(a =>
        a.employeeId === employeeId &&
        a.status !== 'completed' &&
        isAllocationInEffectiveMonth(a.weekStartDate, targetMonth)
    );

    if (myTasks.length === 0) {
        return (
            <Card className="border shadow-sm bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200 text-slate-700 h-full flex flex-col">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        {t('employeeDashboard.widgets.allCaughtUpTitle')}
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex-1">
                    <p className="text-sm text-slate-500">
                        {t('employeeDashboard.widgets.allCaughtUpDesc')}
                    </p>
                </CardContent>
            </Card>
        );
    }

    const blockingTask = myTasks.find(task =>
        allocations.some(other => other.dependencyId === task.id && other.status !== 'completed')
    );

    const quickWinTask = myTasks.find(task => {
        const remaining = task.hoursAssigned - (task.hoursActual || 0);
        return remaining > 0 && remaining <= 2;
    });

    const heavyTask = [...myTasks].sort((a, b) => b.hoursAssigned - a.hoursAssigned)[0];

    let recommendation = null;

    if (blockingTask) {
        const allBlockedTasks = allocations.filter(other =>
            other.dependencyId === blockingTask.id && other.status !== 'completed'
        );
        const blockedUsers = allBlockedTasks.map(bt => {
            const user = employees.find(e => e.id === bt.employeeId);
            return { task: bt, user };
        });
        const proj = projects.find(p => p.id === blockingTask.projectId);

        const firstBlockedUser = blockedUsers[0]?.user?.name?.split(' ')[0] || t('employeeDashboard.common.unknown');

        recommendation = {
            icon: <Sparkles className="w-5 h-5 text-amber-600" />,
            title: t('employeeDashboard.widgets.teamNeedsYouTitle'),
            content: (
                <div className="space-y-3">
                    <p className="text-sm text-amber-800">
                        <AppTrans
                            i18nKey="employeeDashboard.widgets.teamNeedsYouLead"
                            components={[
                                blockedUsers[0]?.user ? (
                                    <SensitiveText kind="employee" id={blockedUsers[0].user.id}>
                                        {firstBlockedUser}
                                    </SensitiveText>
                                ) : (
                                    <strong>{firstBlockedUser}</strong>
                                ),
                            ]}
                        />
                    </p>
                    <div className="bg-white/60 rounded-lg p-3 border border-amber-100">
                        <p className="font-bold text-amber-900">
                            <SensitiveText kind="task" id={blockingTask.id}>
                                {blockingTask.taskName || t('employeeDashboard.widgets.unnamedTask')}
                            </SensitiveText>
                        </p>
                        <Badge variant="outline" className="mt-1 text-[9px] bg-white">
                            <SensitiveText kind="project" id={blockingTask.projectId}>
                                {formatProjectName(proj?.name || '')}
                            </SensitiveText>
                        </Badge>
                    </div>

                    <div className="space-y-1.5">
                        <p className="text-[10px] uppercase text-amber-600 font-semibold flex items-center gap-1">
                            <Sparkles className="w-3 h-3" /> {t('employeeDashboard.widgets.collaborateWith')}
                        </p>
                        {blockedUsers.map(({ task, user }) => (
                            <div key={task.id} className="flex items-center justify-between bg-white/80 px-2 py-1.5 rounded border border-amber-100">
                                <span className="text-xs text-amber-800 truncate max-w-[120px]">
                                    <SensitiveText kind="task" id={task.id}>{task.taskName}</SensitiveText>
                                </span>
                                <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded shrink-0">
                                    {user ? (
                                        <SensitiveText kind="employee" id={user.id}>
                                            {user.name?.split(' ')[0] ?? ''}
                                        </SensitiveText>
                                    ) : (
                                        ''
                                    )}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            ),
            style: 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-300 text-amber-900'
        };
    } else if (quickWinTask) {
        const proj = projects.find(p => p.id === quickWinTask.projectId);
        recommendation = {
            icon: <Flag className="w-5 h-5 text-emerald-600" />,
            title: t('employeeDashboard.widgets.quickWinTitle'),
            content: (
                <p className="text-sm">
                    <AppTrans
                        i18nKey="employeeDashboard.widgets.quickWinBody"
                        components={[
                            <em>
                                <SensitiveText kind="project" id={quickWinTask.projectId}>
                                    {formatProjectName(proj?.name || '')}
                                </SensitiveText>
                            </em>,
                        ]}
                    />
                </p>
            ),
            style: 'bg-emerald-50 border-emerald-200 text-emerald-900'
        };
    } else {
        const proj = projects.find(p => p.id === heavyTask?.projectId);
        recommendation = {
            icon: <Rocket className="w-5 h-5 text-primary" />,
            title: t('employeeDashboard.widgets.nextStepTitle'),
            content: (
                <p className="text-sm">
                    <AppTrans
                        i18nKey="employeeDashboard.widgets.nextStepBody"
                        values={{ hours: heavyTask?.hoursAssigned }}
                        components={[
                            <strong>
                                <SensitiveText kind="project" id={heavyTask?.projectId ?? 'unknown'}>
                                    {formatProjectName(proj?.name || '')}
                                </SensitiveText>
                            </strong>,
                        ]}
                    />
                </p>
            ),
            style: 'bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200 text-indigo-900'
        };
    }

    return (
        <Card className={`border shadow-sm h-full flex flex-col ${recommendation.style}`} data-tour="priority-widget">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    {recommendation.icon}
                    {recommendation.title}
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1">
                {recommendation.content}
            </CardContent>
        </Card>
    );
});

export const ProjectTeamPulse = memo(function ProjectTeamPulse({ employeeId, viewDate }: WidgetProps) {
    const { t } = useAppTranslation();
    const { allocations, projects, employees } = useAppOrDemo();
    const { formatName: formatProjectName } = useProjectAliasing();
    const targetMonth = viewDate || new Date();

    const myAllocations = allocations.filter(a =>
        a.employeeId === employeeId &&
        a.status !== 'completed' &&
        isAllocationInEffectiveMonth(a.weekStartDate, targetMonth)
    );

    const incomingDependencies = myAllocations
        .filter(a => a.dependencyId)
        .map(a => {
            const depTask = allocations.find(d => d.id === a.dependencyId);
            const depOwner = employees.find(e => e.id === depTask?.employeeId);
            const depProject = projects.find(p => p.id === depTask?.projectId);
            const myProject = projects.find(p => p.id === a.projectId);
            const isReady = depTask?.status === 'completed';
            return { myTask: a, myProject, depTask, depOwner, depProject, isReady };
        })
        .filter(item => item.depTask !== undefined);

    const outgoingBlocks = myAllocations
        .map(a => {
            const blockedTasks = allocations.filter(b =>
                b.dependencyId === a.id &&
                b.status !== 'completed'
            );
            const myProject = projects.find(p => p.id === a.projectId);
            return { myTask: a, myProject, blockedTasks };
        })
        .filter(item => item.blockedTasks.length > 0);

    return (
        <Card className="border-slate-200 shadow-sm h-full flex flex-col" data-tour="dependencies-widget">
            <CardHeader className="pb-3 border-b bg-slate-50/50">
                <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <Users className="w-4 h-4 text-indigo-500" />
                    {t('employeeDashboard.widgets.connectionsTitle')}
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto max-h-[300px] p-4 space-y-4">

                {incomingDependencies.length === 0 && outgoingBlocks.length === 0 && (
                    <p className="text-xs text-slate-400 text-center py-4">
                        {t('employeeDashboard.widgets.noDependencies')}
                    </p>
                )}

                {incomingDependencies.length > 0 && (
                    <div>
                        <h4 className="text-xs font-bold text-slate-500 mb-3 uppercase flex items-center gap-1">
                            <LinkIcon className="w-3 h-3" /> {t('employeeDashboard.widgets.waitingPass')}
                        </h4>
                        <div className="space-y-2">
                            {incomingDependencies.map((item, i) => (
                                <div key={i} className={`text-xs rounded-lg border overflow-hidden ${item.isReady ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
                                    <div className="px-3 py-1.5 bg-white/50 border-b border-slate-100 flex items-center justify-between">
                                        <Badge variant="outline" className="text-[9px] h-5 bg-white border-slate-200 text-slate-600">
                                            <SensitiveText kind="project" id={item.myTask.projectId}>
                                                {formatProjectName(item.myProject?.name || '')}
                                            </SensitiveText>
                                        </Badge>
                                        {item.isReady ? (
                                            <span className="flex items-center gap-1 text-[10px] text-emerald-700 font-bold">
                                                <CheckCircle2 className="w-3 h-3" /> {t('employeeDashboard.widgets.canStartNow')}
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1 text-[10px] text-slate-500">
                                                <Clock className="w-3 h-3" /> {t('employeeDashboard.widgets.onTheWay')}
                                            </span>
                                        )}
                                    </div>

                                    <div className="px-3 py-2">
                                        <p className="font-semibold text-slate-800 mb-2">
                                            <SensitiveText kind="task" id={item.myTask.id}>{item.myTask.taskName}</SensitiveText>
                                        </p>
                                        <div className={`flex items-center gap-2 text-[11px] px-2 py-1.5 rounded ${item.isReady ? 'bg-emerald-100/50' : 'bg-slate-100/50'}`}>
                                            <ArrowRight className="w-3 h-3 text-slate-400" />
                                            <span className="text-slate-600">
                                                {item.isReady
                                                    ? t('employeeDashboard.widgets.finished')
                                                    : t('employeeDashboard.widgets.waitingFor')}:
                                            </span>
                                            {item.depOwner && (
                                                <Avatar className="h-4 w-4 border border-slate-300 shrink-0">
                                                    <AvatarImage src={item.depOwner.avatarUrl} alt={item.depOwner.name} />
                                                    <AvatarFallback className="bg-primary/100 text-white text-[8px] font-bold">
                                                        {item.depOwner.name.substring(0, 2).toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                            )}
                                            <span className={`font-bold ${item.isReady ? 'text-emerald-700' : 'text-slate-700'}`}>
                                                {item.depOwner ? (
                                                    <SensitiveText kind="employee" id={item.depOwner.id}>
                                                        {item.depOwner.name?.split(' ')[0]}
                                                    </SensitiveText>
                                                ) : null}
                                            </span>
                                            <span className="text-slate-600 text-[10px] font-medium">
                                                (
                                                {item.depTask ? (
                                                    <SensitiveText kind="task" id={item.depTask.id}>{item.depTask.taskName}</SensitiveText>
                                                ) : null}
                                                )
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {outgoingBlocks.length > 0 && (
                    <div>
                        {incomingDependencies.length > 0 && <div className="border-t border-slate-200 my-4"></div>}
                        <h4 className="text-xs font-bold text-amber-600 mb-3 uppercase flex items-center gap-1">
                            <Sparkles className="w-3 h-3" /> {t('employeeDashboard.widgets.yourContribution')}
                        </h4>
                        <div className="space-y-3">
                            {outgoingBlocks.map((item, i) => (
                                <div key={i} className="text-xs bg-amber-50 rounded-lg border border-amber-200 overflow-hidden">
                                    <div className="px-3 py-1.5 bg-white/50 border-b border-amber-100 flex items-center justify-between">
                                        <Badge variant="outline" className="text-[9px] h-5 bg-white border-amber-200 text-amber-600">
                                            <SensitiveText kind="project" id={item.myTask.projectId}>
                                                {formatProjectName(item.myProject?.name || '')}
                                            </SensitiveText>
                                        </Badge>
                                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                                    </div>

                                    <div className="px-3 py-2">
                                        <p className="font-semibold text-amber-900 mb-2">
                                            <SensitiveText kind="task" id={item.myTask.id}>{item.myTask.taskName}</SensitiveText>
                                        </p>

                                        <div className="space-y-1.5 pl-2 border-l-2 border-amber-300">
                                            {item.blockedTasks.map(bt => {
                                                const waitingUser = employees.find(e => e.id === bt.employeeId);
                                                return (
                                                    <div key={bt.id} className="flex items-center justify-between">
                                                        <span className="text-amber-800 truncate max-w-[120px]">
                                                            <SensitiveText kind="task" id={bt.id}>{bt.taskName}</SensitiveText>
                                                        </span>
                                                        <span className="font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded text-[10px] shrink-0">
                                                            {waitingUser ? (
                                                                <SensitiveText kind="employee" id={waitingUser.id}>
                                                                    {waitingUser.name?.split(' ')[0]}
                                                                </SensitiveText>
                                                            ) : null}{' '}
                                                            {t('employeeDashboard.widgets.waiting')}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
});
