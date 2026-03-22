import { Project } from '@/types';
import { ProjectBudgetStatus } from '@/hooks/useAllocationSheet';
import { AlertTriangle, AlertOctagon, CheckCircle2, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useProjectAliasing } from '@/hooks/useProjectAliasing';
import { SensitiveText } from '@/components/privacy/SensitiveText';

interface AllocationProjectHeaderProps {
    project: Project | undefined;
    budgetStatus: ProjectBudgetStatus;
    allCompleted: boolean;
    taskCount: number;
    myHoursInProject: { estimated: number; completed: number; computed: number };
    currentEmployeeId: string;
}

export function AllocationProjectHeader({
    project,
    budgetStatus,
    allCompleted,
    taskCount,
    myHoursInProject,
    currentEmployeeId
}: AllocationProjectHeaderProps) {
    const { formatName: formatProjectName } = useProjectAliasing();

    if (!project) return <span className="font-bold text-xs truncate">Desc.</span>;

    const { totalComputed, totalPlanned, budgetMax, budgetMin, percentage, status, breakdown } = budgetStatus;

    const statusConfig = {
        healthy: { color: 'bg-emerald-500', bgLight: 'bg-emerald-50', textColor: 'text-emerald-700', icon: null },
        warning: { color: 'bg-amber-500', bgLight: 'bg-amber-50', textColor: 'text-amber-700', icon: <AlertTriangle className="w-3 h-3" /> },
        overload: { color: 'bg-red-500', bgLight: 'bg-red-50', textColor: 'text-red-700', icon: <AlertOctagon className="w-3 h-3" /> },
        under: { color: 'bg-blue-500', bgLight: 'bg-blue-50', textColor: 'text-blue-700', icon: null }
    };

    const config = statusConfig[status];
    const exceededBy = totalComputed > budgetMax ? totalComputed - budgetMax : 0;
    const projection = totalComputed + totalPlanned;

    // Calcular progreso del empleado
    const myProgress = myHoursInProject.estimated > 0
        ? Math.round((myHoursInProject.computed / myHoursInProject.estimated) * 100)
        : 0;

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <div className={cn(
                    "px-3 py-2 border-b cursor-help transition-colors",
                    allCompleted ? "bg-slate-100" : config.bgLight
                )}>
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                            {allCompleted && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                            <span className={cn("font-bold text-xs truncate", allCompleted && "text-slate-500")}>
                              <SensitiveText kind="project" id={project.id}>{formatProjectName(project.name)}</SensitiveText>
                            </span>
                            {allCompleted && <span className="text-[9px] text-slate-400">({taskCount})</span>}
                        </div>
                        {/* Mostrar horas del empleado en lugar del % global */}
                        <div className={cn("flex items-center gap-1.5 text-[10px]", allCompleted ? "text-slate-400" : "text-slate-600")}>
                            <span className="font-medium">{myHoursInProject.estimated}h</span>
                            {myHoursInProject.computed > 0 && (
                                <>
                                    <span className="text-slate-300">·</span>
                                    <span className="text-emerald-600 font-semibold">{myHoursInProject.computed}h comp</span>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Barra de progreso del empleado */}
                    {!allCompleted && myHoursInProject.estimated > 0 && (
                        <div className="mt-1.5">
                            <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                                <div
                                    className={cn("h-full transition-all duration-300", myProgress >= 100 ? "bg-emerald-500" : "bg-primary/100")}
                                    style={{ width: `${Math.min(myProgress, 100)}%` }}
                                />
                            </div>
                            <div className="flex justify-between items-center mt-1">
                                <span className="text-[9px] text-slate-500">
                                    {myHoursInProject.completed}/{taskCount} tareas
                                </span>
                                <span className={cn("text-[9px] font-medium", myProgress >= 100 ? "text-emerald-600" : "text-primary")}>
                                    {myProgress}%
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-xs p-0 z-50">
                <div className="p-3 space-y-2">
                    <div className="font-bold text-sm border-b pb-2">{project.name}</div>

                    {/* Horas del empleado actual */}
                    <div className="bg-primary/10 rounded p-2 border border-indigo-100">
                        <div className="text-[10px] font-semibold text-primary uppercase mb-1">Tus horas</div>
                        <div className="flex gap-3 text-xs">
                            <span className="text-blue-600">Plan: <strong>{myHoursInProject.estimated}h</strong></span>
                            <span className="text-emerald-600">Comp: <strong>{myHoursInProject.computed}h</strong></span>
                        </div>
                    </div>

                    {/* Horas globales del cliente */}
                    {budgetMax > 0 && (
                        <div className="text-xs space-y-1 border-t pt-2">
                            <div className="text-[10px] font-semibold text-slate-500 uppercase mb-1">Total cliente</div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Asignadas:</span>
                                <span className="font-medium">{budgetMin > 0 ? `${budgetMin}-` : ''}{budgetMax}h</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Planificado:</span>
                                <span className="text-blue-600">{totalPlanned.toFixed(1)}h</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Computado (todos):</span>
                                <span className={cn("font-bold", status === 'overload' ? 'text-red-600' : 'text-emerald-600')}>{totalComputed.toFixed(1)}h</span>
                            </div>

                            {/* Barra de progreso global */}
                            <div className="mt-2">
                                <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                                    <div className={cn("h-full", config.color)} style={{ width: `${Math.min(percentage, 100)}%` }} />
                                </div>
                                <div className="flex justify-between items-center mt-0.5">
                                    <span className="text-[9px] text-slate-400">{Math.round(percentage)}% usado</span>
                                    {exceededBy > 0 && <span className="text-[9px] font-bold text-red-600">+{exceededBy.toFixed(1)}h exceso</span>}
                                </div>
                            </div>
                        </div>
                    )}

                    {breakdown.length > 1 && (
                        <div className="border-t pt-2 mt-2">
                            <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-500 uppercase mb-1">
                                <Users className="w-3 h-3" /> Equipo
                            </div>
                            <div className="space-y-1">
                                {breakdown.map(({ employeeId: empId, employeeName, computed, planned }) => {
                                    const isCurrentEmployee = empId === currentEmployeeId;
                                    return (
                                        <div key={empId} className={cn("text-xs px-1.5 py-1 rounded", isCurrentEmployee ? "bg-primary/10" : "")}>
                                            <div className={cn("font-medium", isCurrentEmployee ? "text-indigo-700" : "text-slate-600")}>
                                                {employeeName} {isCurrentEmployee && "(tú)"}
                                            </div>
                                            <div className="flex gap-3 text-[10px] mt-0.5">
                                                <span className="text-blue-600">Plan: {planned.toFixed(1)}h</span>
                                                <span className="text-emerald-600">Comp: {computed.toFixed(1)}h</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {status === 'overload' && (
                        <div className="bg-red-50 text-red-700 text-[10px] p-2 rounded border border-red-200 mt-2">
                            ⚠️ Se han excedido las horas contratadas máximas. Revisar horas computadas.
                        </div>
                    )}
                    {status === 'warning' && (
                        <div className="bg-amber-50 text-amber-700 text-[10px] p-2 rounded border border-amber-200 mt-2">
                            {projection > budgetMax ? (
                                <span>⚠️ Cuidado: La proyección total ({projection.toFixed(1)}h) ya supera el límite de {budgetMax}h.</span>
                            ) : (
                                <span>⚡ Cerca del límite. Quedan {(budgetMax - totalComputed).toFixed(1)}h disponibles.</span>
                            )}
                        </div>
                    )}
                    {projection > budgetMax && status !== 'overload' && status !== 'warning' && (
                        <div className="bg-orange-50 text-orange-700 text-[10px] p-2 rounded border border-orange-200 mt-2">
                            📊 La proyección ({projection.toFixed(1)}h) supera las horas contratadas.
                        </div>
                    )}
                </div>
            </TooltipContent>
        </Tooltip>
    );
}
