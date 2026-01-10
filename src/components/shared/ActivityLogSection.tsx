/**
 * ActivityLogSection Component (V7 - Recursive Tree)
 * 
 * True hierarchical view:
 * Root Task
 * ├── Modification 1
 * ├── Modification 2
 * └── Child Task (Collapsible)
 *     ├── Child Mod 1
 *     └── Grandchild Task (Collapsible)
 */

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useApp } from '@/contexts/AppContext';
import { useAgency } from '@/contexts/AgencyContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
    Plus, Pencil, Trash2, Clock, RefreshCw, ChevronDown, ChevronRight,
    Activity, FolderOpen, User, ArrowRight, GitBranch, CheckCircle2, CornerDownRight
} from 'lucide-react';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

// --- Types ---

interface AuditLog {
    id: string;
    action: 'CREATE' | 'UPDATE' | 'DELETE';
    resource_id: string;
    details: {
        previousValue?: Record<string, unknown>;
        newValue?: Record<string, unknown>;
    };
    created_at: string;
}

interface Modification {
    id: string;
    action: 'created' | 'transferred' | 'distributed' | 'completed' | 'deleted' | 'updated' | 'continued';
    timestamp: string;
    employeeName: string;
    employeeAvatar?: string;
    hoursAssigned: number;
    weekNum: number;
    details: string;
}

interface TaskNode {
    id: string; // allocationId
    taskName: string;
    projectId: string;
    projectName: string;
    clientName: string;

    modifications: Modification[];
    children: TaskNode[]; // Nested sub-tasks

    // Aggregated info for the header
    latestTimestamp: string;
    latestAction: Modification['action'];
    participants: { name: string; avatar?: string }[];
    weekRange: string;

    isVirtual?: boolean; // If true, this node exists only as a parent container locally constructed
    parentId?: string;
}

interface ActivityLogSectionProps {
    currentMonth?: Date;
    maxItems?: number;
}

export function ActivityLogSection({ currentMonth, maxItems = 200 }: ActivityLogSectionProps) {
    const { employees, projects, clients, allocations } = useApp();
    const { currentAgency } = useAgency();
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filterEmployee, setFilterEmployee] = useState<string>('all');
    const [filterProject, setFilterProject] = useState<string>('all');
    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

    // --- Helpers ---
    const getEmployeeName = (id: unknown) => {
        if (typeof id !== 'string') return 'Desconocido';
        return employees.find(e => e.id === id)?.name || 'Empleado eliminado';
    };

    const getEmployeeAvatar = (id: unknown) => {
        if (typeof id !== 'string') return undefined;
        return employees.find(e => e.id === id)?.avatarUrl;
    };

    const getProjectName = (id: unknown) => {
        if (typeof id !== 'string') return 'Sin proyecto';
        return projects.find(p => p.id === id)?.name || 'Proyecto eliminado';
    };

    const getClientName = (projectId: string) => {
        const project = projects.find(p => p.id === projectId);
        if (!project) return '';
        return clients.find(c => c.id === project.clientId)?.name || '';
    };

    const getWeekNumber = (dateStr: unknown) => {
        if (!dateStr) return 0;
        try {
            const date = new Date(String(dateStr));
            return Math.ceil(date.getDate() / 7);
        } catch { return 0; }
    };

    // --- Fetch Logs ---
    useEffect(() => {
        async function fetchLogs() {
            if (!currentAgency?.id) return;
            setIsLoading(true);
            setError(null);

            try {
                let query = supabase
                    .from('audit_logs')
                    .select('*')
                    .eq('agency_id', currentAgency.id)
                    .eq('resource', 'ALLOCATION')
                    .order('created_at', { ascending: false })
                    .limit(maxItems);

                if (currentMonth) {
                    const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
                    const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
                    query = query
                        .gte('created_at', monthStart.toISOString())
                        .lte('created_at', monthEnd.toISOString());
                }

                const { data, error: fetchError } = await query;
                if (fetchError) throw fetchError;
                setLogs(data || []);
            } catch (err: any) {
                setError('Error al cargar historial (verificar migración audit_logs)');
            } finally {
                setIsLoading(false);
            }
        }
        fetchLogs();
    }, [currentAgency?.id, currentMonth, maxItems]);

    // --- Recursive Tree Building ---
    const rootNodes = useMemo(() => {
        const nodes = new Map<string, TaskNode>();
        const parentLinks = new Map<string, string>(); // childId -> parentId

        // 1. Helper to get or create a node
        const getNode = (id: string, initialData?: Partial<TaskNode>) => {
            if (!nodes.has(id)) {
                nodes.set(id, {
                    id,
                    taskName: 'Tarea desconocida',
                    projectId: '',
                    projectName: '',
                    clientName: '',
                    modifications: [],
                    children: [],
                    latestAction: 'updated',
                    latestTimestamp: '2000-01-01',
                    participants: [],
                    weekRange: '',
                    ...initialData
                });
            }
            return nodes.get(id)!;
        };

        // 2. Identify Parent Relationships (Recursive Trace)
        // We try to find the parent for every allocation involved in the logs or current state

        const findParentId = (allocId: string, visited = new Set<string>()): string | null => {
            if (visited.has(allocId)) return null; // Cycle
            visited.add(allocId);

            // A) Check current allocations state
            const alloc = allocations.find(a => a.id === allocId);
            if (alloc) {
                if (alloc.transferredFromAllocationId) return alloc.transferredFromAllocationId;
                if (alloc.distributionSourceAllocationId) return alloc.distributionSourceAllocationId;
                if (alloc.parentAllocationId) return alloc.parentAllocationId;
            }

            // B) Check logs for "CREATE" event if executed deleted
            // This is crucial for tracing deleted parents
            const createLog = logs.find(l => l.resource_id === allocId && l.action === 'CREATE');
            if (createLog?.details?.newValue) {
                const val = createLog.details.newValue as any;
                if (val.transferredFromAllocationId) return val.transferredFromAllocationId;
                if (val.distributionSourceAllocationId) return val.distributionSourceAllocationId;
                if (val.parentAllocationId) return val.parentAllocationId;
            }

            return null;
        };

        // 3. Process logs to populate nodes
        logs.forEach(log => {
            const taskId = log.resource_id;
            const data = log.details?.newValue || log.details?.previousValue;
            if (!data) return;

            const projectId = String(data.projectId || '');
            const employeeId = String(data.employeeId || '');

            // Apply filters
            if (filterEmployee !== 'all' && employeeId !== filterEmployee) return;
            if (filterProject !== 'all' && projectId !== filterProject) return;

            const node = getNode(taskId, {
                taskName: String(data.taskName || ''),
                projectId,
                projectName: getProjectName(projectId),
                clientName: getClientName(projectId)
            });

            // Just update basic info if missing
            if (!node.taskName && data.taskName) node.taskName = String(data.taskName);
            if (!node.projectId && projectId) {
                node.projectId = projectId;
                node.projectName = getProjectName(projectId);
                node.clientName = getClientName(projectId);
            }

            // Action determination
            let action: Modification['action'] = 'updated';
            let details = '';
            const rawTaskName = String(data.taskName || '');

            if (log.action === 'CREATE') {
                // Nuevo sistema de tracking + Legacy regex fallback
                const isTransfer = (data.transferSourceEmployeeId) || rawTaskName.includes('transferida de');

                if (isTransfer) {
                    action = 'transferred';
                    let sourceName = 'otro';
                    if (data.transferSourceEmployeeId) {
                        sourceName = getEmployeeName(data.transferSourceEmployeeId);
                    } else {
                        const match = rawTaskName.match(/transferida de (.+?)\)/);
                        if (match) sourceName = match[1];
                    }
                    const recipientName = getEmployeeName(employeeId);
                    details = `Recibida de ${sourceName} por ${recipientName} (${data.hoursAssigned}h)`;
                } else if (data.distributionSourceAllocationId) {
                    action = 'distributed';
                    details = `Redistribución recibida (${data.hoursAssigned}h)`;
                } else if (data.parentAllocationId) {
                    action = 'continued';
                    details = `Continuación de semana previa (${data.hoursAssigned}h)`;
                } else {
                    action = 'created';
                    details = `Creada para ${getEmployeeName(employeeId)} (${data.hoursAssigned}h)`;
                }
            } else if (log.action === 'DELETE') {
                action = 'deleted';
                details = `Eliminada de ${getEmployeeName(employeeId)}`;
            } else if (log.action === 'UPDATE') {
                const oldVal = log.details?.previousValue;
                const newVal = log.details?.newValue;
                if (newVal?.status === 'completed' && oldVal?.status !== 'completed') {
                    // Check if this task triggered a distribution (heuristic: was it completed with 0h or have we seen children?)
                    // Note: We can only confirm children later in the grouping phase, so we might need a post-processing step.
                    // However, we can use the '0h' heuristic or check if the user logged "Distribuidas" in comments (if we had access).
                    // For now, let's keep the redistributed check but rely on tree assembly to overwrite this if needed.
                    const isRedistributedCompletion = (newVal?.hoursActual || newVal?.hoursAssigned || 0) === 0;
                    action = isRedistributedCompletion ? 'distributed' : 'completed';
                    details = isRedistributedCompletion
                        ? `Distribuida a compañeros por ${getEmployeeName(employeeId)}`
                        : `Completada por ${getEmployeeName(employeeId)} (${newVal?.hoursActual || newVal?.hoursAssigned}h)`;
                } else if (oldVal?.employeeId !== newVal?.employeeId) {
                    action = 'transferred';
                    details = `${getEmployeeName(oldVal?.employeeId)} → ${getEmployeeName(newVal?.employeeId)}`;
                } else {
                    action = 'updated';
                    const changes = [];
                    if (oldVal?.hoursAssigned !== newVal?.hoursAssigned) changes.push(`${oldVal?.hoursAssigned}h → ${newVal?.hoursAssigned}h`);
                    if (oldVal?.weekStartDate !== newVal?.weekStartDate) changes.push(`S${getWeekNumber(oldVal?.weekStartDate)} → S${getWeekNumber(newVal?.weekStartDate)}`);
                    details = changes.length ? changes.join(', ') : 'Actualizada';
                }
            }

            const weekNum = getWeekNumber(data.weekStartDate);
            const mod: Modification = {
                id: log.id,
                action,
                timestamp: log.created_at,
                employeeName: getEmployeeName(employeeId),
                employeeAvatar: getEmployeeAvatar(employeeId),
                hoursAssigned: Number(data.hoursAssigned) || 0,
                weekNum,
                details
            };

            node.modifications.push(mod);

            // Add participant
            if (!node.participants.find(p => p.name === mod.employeeName)) {
                node.participants.push({ name: mod.employeeName, avatar: mod.employeeAvatar });
            }

            // Update timestamps
            if (new Date(mod.timestamp) > new Date(node.latestTimestamp)) {
                node.latestTimestamp = mod.timestamp;
                node.latestAction = mod.action;
            }
        });

        // 4. Trace lineage for all known nodes
        const nodeIds = Array.from(nodes.keys());
        nodeIds.forEach(nodeId => {
            const parentId = findParentId(nodeId);
            if (parentId) {
                parentLinks.set(nodeId, parentId);
                // Ensure parent exists even if no logs
                if (!nodes.has(parentId)) {
                    // Try to look up allocation for basic info
                    const pAlloc = allocations.find(a => a.id === parentId);
                    getNode(parentId, pAlloc ? {
                        taskName: pAlloc.taskName,
                        projectId: pAlloc.projectId,
                        projectName: getProjectName(pAlloc.projectId),
                        clientName: getClientName(pAlloc.projectId)
                    } : undefined);
                }
            }
        });

        // 5. Assemble Tree with Deduplication
        const roots: TaskNode[] = [];
        nodes.forEach(node => {
            const parentId = parentLinks.get(node.id);
            if (parentId && nodes.has(parentId)) {
                const parent = nodes.get(parentId)!;

                // DEDUPLICATION LOGIC:
                // If child has same name as parent AND is effectively just a cleanup node (deleted/completed),
                // merge its logs into parent instead of nesting
                const isSameName = node.taskName.trim().toLowerCase() === parent.taskName.trim().toLowerCase();
                if (isSameName) {
                    parent.modifications.push(...node.modifications);
                    // Add participants
                    node.participants.forEach(p => {
                        if (!parent.participants.find(pp => pp.name === p.name)) parent.participants.push(p);
                    });
                    // Update latest info
                    if (new Date(node.latestTimestamp) > new Date(parent.latestTimestamp)) {
                        parent.latestTimestamp = node.latestTimestamp;
                        parent.latestAction = node.latestAction;
                    }
                    // Do NOT add as child
                } else {
                    parent.children.push(node);
                    node.parentId = parentId;
                }
            } else {
                roots.push(node);
            }
        });

        // Sort logs inside nodes and calculate ranges
        nodes.forEach(node => {
            // Updated Sort Order: ASCENDING (Oldest First) as per request "Como un libro"
            node.modifications.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

            // Refine actions based on children presence (Post-processing)
            // If a node has children of type 'distributed' or 'transferred', ensure its completion/deletion logic reflects that.
            if (node.children.length > 0) {
                const lastMod = node.modifications[node.modifications.length - 1]; // Now the last one is the NEWEST
                if (lastMod && (lastMod.action === 'completed' || lastMod.action === 'deleted')) {
                    // Check if children naturally follow this action
                    // If we have children, it's highly likely this "end" was a distribution
                    lastMod.action = 'distributed';
                    lastMod.details = `Distribuida en ${node.children.length} sub-tarea(s)`;
                }
            }

            node.children.sort((a, b) => new Date(a.latestTimestamp).getTime() - new Date(b.latestTimestamp).getTime());

            const weeks = [...new Set(node.modifications.map(m => m.weekNum).concat(
                node.children.flatMap(c => c.modifications.map(m => m.weekNum))
            ).filter(w => w > 0))].sort((a, b) => a - b);

            if (weeks.length > 1) node.weekRange = `S${weeks[0]} → S${weeks[weeks.length - 1]}`;
            else if (weeks.length === 1) node.weekRange = `S${weeks[0]}`;
        });

        // Sort roots by latest activity (deep)
        const getDeepLatest = (n: TaskNode): number => {
            let max = new Date(n.latestTimestamp).getTime();
            n.children.forEach(c => {
                const childMax = getDeepLatest(c);
                if (childMax > max) max = childMax;
            });
            return max;
        };

        return roots
            .filter(r => r.modifications.length > 0 || r.children.length > 0)
            .sort((a, b) => getDeepLatest(b) - getDeepLatest(a));
    }, [logs, allocations, filterEmployee, filterProject, employees, projects, clients]);

    // --- Group roots by project ---
    const projectGroups = useMemo(() => {
        const groups = new Map<string, { projectName: string; clientName: string; nodes: TaskNode[] }>();
        rootNodes.forEach(node => {
            const key = node.projectId || 'no-project';
            if (!groups.has(key)) {
                groups.set(key, { projectName: node.projectName, clientName: node.clientName, nodes: [] });
            }
            groups.get(key)!.nodes.push(node);
        });
        return Array.from(groups.entries()).map(([id, data]) => ({ projectId: id, ...data }));
    }, [rootNodes]);

    // --- Recursive Node Renderer ---
    const toggleNode = (id: string) => {
        setExpandedNodes(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const getActionIcon = (action: Modification['action']) => {
        const iconClass = "h-3 w-3";
        switch (action) {
            case 'created': return <Plus className={`${iconClass} text-emerald-600`} />;
            case 'transferred': return <ArrowRight className={`${iconClass} text-purple-600`} />;
            case 'distributed': return <GitBranch className={`${iconClass} text-orange-600`} />;
            case 'continued': return <ArrowRight className={`${iconClass} text-blue-600`} />;
            case 'completed': return <CheckCircle2 className={`${iconClass} text-emerald-600`} />;
            case 'deleted': return <Trash2 className={`${iconClass} text-red-600`} />;
            default: return <Pencil className={`${iconClass} text-slate-600`} />;
        }
    };

    const getActionBadge = (action: Modification['action']) => {
        const styles: Record<string, string> = {
            created: 'bg-emerald-100 text-emerald-700',
            transferred: 'bg-purple-100 text-purple-700',
            distributed: 'bg-orange-100 text-orange-700',
            continued: 'bg-blue-100 text-blue-700',
            completed: 'bg-emerald-100 text-emerald-700',
            deleted: 'bg-red-100 text-red-700',
            updated: 'bg-slate-100 text-slate-700'
        };
        const labels: Record<string, string> = {
            created: 'Nueva', transferred: 'Transferida', distributed: 'Redistribuida',
            continued: 'Continuación', completed: 'Completada', deleted: 'Eliminada', updated: 'Editada'
        };
        return <Badge className={cn('text-[9px] px-1.5 py-0', styles[action])}>{labels[action]}</Badge>;
    };

    const TaskNodeRenderer = ({ node, level = 0 }: { node: TaskNode, level?: number }) => {
        const isOpen = expandedNodes.has(node.id);
        const hasContent = node.modifications.length > 0 || node.children.length > 0;

        // Clean task name of artifacts
        const displayTaskName = node.taskName
            .replace(/\s*\(transferida de .+\)/, '')
            .replace(/\s*\(continuación\)/, '');

        return (
            <Collapsible open={isOpen} onOpenChange={() => toggleNode(node.id)} className="w-full">
                <div className={cn("relative flex flex-col", level > 0 && "ml-4 mt-2")}>
                    {/* Connecting line for children */}
                    {level > 0 && (
                        <div className="absolute -left-4 top-3 w-4 h-4 border-b-2 border-l-2 border-slate-200 rounded-bl-lg -z-10" />
                    )}

                    <CollapsibleTrigger className="w-full text-left filter hover:brightness-95 transition-all">
                        <div className={cn(
                            "flex items-center gap-2 p-2 rounded-lg border",
                            level === 0 ? "bg-slate-50 border-slate-100" : "bg-white border-slate-200 shadow-sm"
                        )}>
                            {hasContent ? (
                                isOpen ? <ChevronDown className="h-3.5 w-3.5 text-slate-400" /> : <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                            ) : <div className="w-3.5" />}

                            {/* Participants */}
                            <div className="flex -space-x-1 shrink-0">
                                {node.modifications.slice(0, 1).map((m, i) => (
                                    <Avatar key={i} className="h-5 w-5 border border-white">
                                        <AvatarImage src={m.employeeAvatar} />
                                        <AvatarFallback className="text-[8px] bg-slate-500 text-white">
                                            {m.employeeName.slice(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                ))}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                    <span className={cn("truncate", level === 0 ? "font-medium text-xs" : "font-normal text-xs text-slate-700")}>
                                        {displayTaskName}
                                    </span>
                                    {getActionBadge(node.latestAction)}
                                </div>
                                <div className="text-[10px] text-slate-500">
                                    {node.modifications.length} event{node.modifications.length !== 1 ? 'os' : ''}
                                    {node.children.length > 0 && `, ${node.children.length} sub-tareas`}
                                    {node.weekRange && ` · ${node.weekRange}`}
                                </div>
                            </div>

                            <span className="text-[10px] text-slate-400 shrink-0">
                                {formatDistanceToNow(parseISO(node.latestTimestamp), { addSuffix: true, locale: es })}
                            </span>
                        </div>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                        <div className="pl-4 border-l-2 border-slate-100 ml-2 space-y-1 py-1">
                            {/* Modifications Timeline */}
                            {node.modifications.map(mod => (
                                <div key={mod.id} className="relative flex items-start gap-2 py-1 group">
                                    <div className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full border border-slate-300 bg-white" />

                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                        <div className="bg-slate-100 w-5 h-5 rounded-full flex items-center justify-center shrink-0">
                                            {getActionIcon(mod.action)}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-[11px] text-slate-700 leading-tight">{mod.details}</p>
                                            <p className="text-[9px] text-slate-400">
                                                S{mod.weekNum} · {format(parseISO(mod.timestamp), "HH:mm dd/MM", { locale: es })}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* Recursive Children */}
                            {node.children.length > 0 && (
                                <div className="mt-2 pt-2 border-t border-slate-100">
                                    <div className="text-[10px] font-semibold text-slate-400 mb-1 flex items-center gap-1">
                                        <CornerDownRight className="h-3 w-3" /> Sub-tareas distribuidas
                                    </div>
                                    {node.children.map(child => (
                                        <TaskNodeRenderer key={child.id} node={child} level={level + 1} />
                                    ))}
                                </div>
                            )}
                        </div>
                    </CollapsibleContent>
                </div>
            </Collapsible>
        );
    };

    if (error) {
        return (
            <Card className="border-amber-200 bg-amber-50">
                <CardContent className="py-6 text-center">
                    <Activity className="h-8 w-8 text-amber-500 mx-auto mb-2" />
                    <p className="text-amber-800 font-medium text-sm">{error}</p>
                </CardContent>
            </Card>
        );
    }

    const activeEmployees = employees.filter(e => e.isActive).sort((a, b) => a.name.localeCompare(b.name));
    const activeProjects = projects.filter(p => p.status === 'active').sort((a, b) => a.name.localeCompare(b.name));

    return (
        <Card>
            <CardHeader className="pb-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <CardTitle className="text-base flex items-center gap-2">
                        <Activity className="h-4 w-4 text-primary" />
                        Historial de cambios
                        {!isLoading && <Badge variant="outline" className="text-xs">{rootNodes.length} raíces</Badge>}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                        <Select value={filterEmployee} onValueChange={setFilterEmployee}>
                            <SelectTrigger className="w-[120px] h-7 text-xs">
                                <User className="h-3 w-3 mr-1" />
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos</SelectItem>
                                {activeEmployees.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Select value={filterProject} onValueChange={setFilterProject}>
                            <SelectTrigger className="w-[120px] h-7 text-xs">
                                <FolderOpen className="h-3 w-3 mr-1" />
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos</SelectItem>
                                {activeProjects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => window.location.reload()}>
                            <RefreshCw className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex items-center justify-center py-6">
                        <RefreshCw className="h-5 w-5 animate-spin text-slate-400" />
                    </div>
                ) : projectGroups.length === 0 ? (
                    <div className="text-center py-6 text-slate-500 text-sm">
                        <Clock className="h-6 w-6 mx-auto mb-1.5 opacity-50" />
                        <p>No hay cambios registrados</p>
                    </div>
                ) : (
                    <ScrollArea className="h-[500px] pr-2">
                        <div className="space-y-4">
                            {projectGroups.map(group => (
                                <div key={group.projectId} className="space-y-2">
                                    <div className="flex items-center gap-2 text-sm font-medium text-slate-700 pb-1 border-b bg-slate-50/50 p-1 rounded-t">
                                        <FolderOpen className="h-3.5 w-3.5 text-primary" />
                                        {group.projectName}
                                        {group.clientName && <span className="text-[10px] text-slate-500">({group.clientName})</span>}
                                    </div>
                                    <div className="space-y-2 pl-1">
                                        {group.nodes.map(node => (
                                            <TaskNodeRenderer key={node.id} node={node} />
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                )}
            </CardContent>
        </Card>
    );
}
