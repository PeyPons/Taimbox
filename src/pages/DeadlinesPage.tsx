import { useState, useMemo, useEffect, useCallback } from 'react';
import { useAppAbsencesAndEvents, useAppEmployees, useAppProjects } from '@/contexts/AppContext';
import { usePermissions } from '@/hooks/usePermissions';
import { useAgency } from '@/contexts/AgencyContext';
import { useDepartmentView } from '@/contexts/DepartmentViewContext';
import { normalizeDepartments, employeeBelongsToDepartment } from '@/utils/departmentUtils';

import { useProjectFilters } from '@/hooks/useProjectFilters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Plus, Pencil, Trash2, Save, Search, Eye, EyeOff, ChevronDown, ChevronRight, ChevronLeft,
  Calendar, Users, AlertTriangle, CheckCircle2, XCircle, Copy, Filter, Sparkles, Edit, HelpCircle, PanelRight, Check, Maximize2, ChevronUp, FolderKanban, ArrowRight, Inbox, Share2
} from 'lucide-react';
import { DeadlinesTour, useDeadlinesTour } from '@/components/deadlines/DeadlinesTour';
import { DeadlinesFilters, type DeadlinesFiltersValues } from '@/components/deadlines/DeadlinesFilters';
import { GlobalAssignmentDialog, type GlobalAssignmentFormValues } from '@/components/deadlines/GlobalAssignmentDialog';
import { DeadlinesSuggestionsPreview } from '@/components/deadlines/DeadlinesSuggestionsPreview';
import { DeadlinesSuggestionsPanel } from '@/components/deadlines/DeadlinesSuggestionsPanel';
import { DeadlinesAvailabilityCard } from '@/components/deadlines/DeadlinesAvailabilityCard';
import { DeadlinesProjectEditSheet } from '@/components/deadlines/DeadlinesProjectEditSheet';
import { DeadlinesSidebar } from '@/components/deadlines/DeadlinesSidebar';
import { DeadlinesPageHeader } from '@/components/deadlines/DeadlinesPageHeader';
import { DeadlinesConfirmDialog } from '@/components/deadlines/DeadlinesConfirmDialog';
import { DeadlinesProjectList } from '@/components/deadlines/DeadlinesProjectList';
import { toast } from '@/lib/notify';
import { supabase } from '@/lib/supabase';
import { Deadline, GlobalAssignment } from '@/types';
import { fetchDeadlinesForMonth } from '@/utils/deadlineUtils';
import { cn } from '@/lib/utils';
import { useProjectAliasing } from '@/hooks/useProjectAliasing';
import { format, addMonths, subMonths } from 'date-fns';
import { useIsMobile } from '@/hooks/use-mobile';
import { useDeadlinesRedistribution } from '@/hooks/useDeadlinesRedistribution';
import { useDeadlinesPageData } from '@/hooks/useDeadlinesPageData';
import { useDeadlinesEditing } from '@/hooks/useDeadlinesEditing';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useAppTranslation } from '@/hooks/useAppTranslation';

export default function DeadlinesPage() {
  const { t } = useAppTranslation();
  const { projects, clients } = useAppProjects();
  const { employees, currentUser } = useAppEmployees();
  const { absences, teamEvents } = useAppAbsencesAndEvents();
  const { canAccess } = usePermissions();
  const isManager = canAccess('/planner') || canAccess('/reports') || canAccess('/operaciones') || canAccess('/finanzas');
  const canEditDeadlines = isManager || canAccess('/deadlines');
  const { currentAgency } = useAgency();
  const { selectedDepartmentId } = useDepartmentView();

  const departments = useMemo(() => normalizeDepartments(currentAgency?.settings?.departments), [currentAgency?.settings?.departments]);
  const employeesForView = useMemo(() => {
    if (!selectedDepartmentId || !departments.length) return employees ?? [];
    const dept = departments.find(d => d.id === selectedDepartmentId || d.name === selectedDepartmentId);
    if (!dept) return employees ?? [];
    return (employees ?? []).filter(e => employeeBelongsToDepartment(e.department, dept.id, dept.name));
  }, [employees, selectedDepartmentId, departments]);
  const { showTour } = useDeadlinesTour();
  const isMobile = useIsMobile();
  const { formatName: formatProjectName } = useProjectAliasing();

  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [filterSnapshot, setFilterSnapshot] = useState<DeadlinesFiltersValues>({
    searchTerm: '',
    filterId: 'all',
    showHidden: false,
    showUnassignedOnly: false,
    filterByEmployee: 'all',
    sortBy: 'client',
  });
  const { activeFilters, filterProject } = useProjectFilters();
  const [expandedClients, setExpandedClients] = useState<Set<string>>(new Set());
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());

  const data = useDeadlinesPageData({
    selectedMonth,
    currentAgency,
    projects,
    clients,
    employees,
    employeesForView,
    absences,
    teamEvents,
    currentUser,
    filterSnapshot,
    filterProject,
  });

  const {
    deadlines,
    setDeadlines,
    globalAssignments,
    setGlobalAssignments,
    hiddenProjects,
    setHiddenProjects,
    isLoading,
    setIsLoading,
    editingLocks,
    setEditingLocks,
    activeEmployees,
    filteredProjects,
    projectsByClient,
    getMonthlyCapacity,
    getEmployeeAssignedHours,
    getProjectDeadline,
    loadDeadlines,
    loadGlobalAssignments,
    broadcastChannelRef,
  } = data;

  const editing = useDeadlinesEditing({
    canEditDeadlines,
    selectedMonth,
    currentUser,
    employees: employees ?? [],
    getProjectDeadline,
    hiddenProjects,
    setHiddenProjects,
    setDeadlines,
    setEditingLocks,
    broadcastChannelRef,
    setExpandedProjects,
  });

  const {
    editingProjectId,
    inlineFormData,
    autoSaveStatus,
    startEditingProject,
    updateInlineEmployeeHours,
    handleFormPatch,
    autoSaveDeadline,
    toggleProjectExpanded,
    cancelEditingProject,
  } = editing;

  const [isGlobalDialogOpen, setIsGlobalDialogOpen] = useState(false);
  const [editingDeadline, setEditingDeadline] = useState<Deadline | null>(null);
  const [editingGlobal, setEditingGlobal] = useState<GlobalAssignment | null>(null);
  const [isSuggestionsExpandedOpen, setIsSuggestionsExpandedOpen] = useState(false);
  const [expandedSuggestionsProjects, setExpandedSuggestionsProjects] = useState<Set<string>>(new Set());
  const [expandedSuggestionsEmployees, setExpandedSuggestionsEmployees] = useState<Set<string>>(new Set());
  const [excludedDonorIds, setExcludedDonorIds] = useState<string[]>([]);
  const [maxReceiverLoadPct, setMaxReceiverLoadPct] = useState<number>(100);
  const [maxReceiverLoadPctInput, setMaxReceiverLoadPctInput] = useState<string>('100');
  const [minSenderLoadPct, setMinSenderLoadPct] = useState<number>(30);
  const [minSenderLoadPctInput, setMinSenderLoadPctInput] = useState<string>('30');
  const [suggestionsCondicionantesOpen, setSuggestionsCondicionantesOpen] = useState(true);
  const [rightPanelPorProyectoOpen, setRightPanelPorProyectoOpen] = useState(false);
  const [onlySharedProjects, setOnlySharedProjects] = useState(false);
  const [includedProjectIds, setIncludedProjectIds] = useState<Set<string>>(new Set());

  const [confirmAction, setConfirmAction] = useState<{ type: 'delete_deadline' | 'delete_allocation' | 'copy_month' | 'delete_month', id?: string, data?: any } | null>(null);

  // Expandir todos los clientes por defecto
  useEffect(() => {
    const allClientIds = Object.keys(projectsByClient);
    setExpandedClients(new Set(allClientIds));
  }, [projectsByClient]);

  const openGlobalDialog = (assignment?: GlobalAssignment) => {
    setEditingGlobal(assignment ?? null);
    setIsGlobalDialogOpen(true);
  };

  const onSaveGlobal = async (data: GlobalAssignmentFormValues) => {

    try {
      const assignmentData = {
        month: selectedMonth,
        name: data.name,
        hours: data.hours,
        affects_all: data.affectsAll,
        affected_employee_ids: data.affectsAll ? null : data.affectedEmployeeIds,
        employee_id: undefined as string | undefined,
        agency_id: currentAgency?.id
      };

      // Al crear, guardar el employee_id del usuario actual
      if (!editingGlobal && currentUser) {
        assignmentData.employee_id = currentUser.id;
      }

      if (editingGlobal) {
        const { error } = await supabase
          .from('global_assignments')
          .update(assignmentData)
          .eq('id', editingGlobal.id);

        if (error) throw error;

        setGlobalAssignments(prev => prev.map(a =>
          a.id === editingGlobal.id
            ? { ...a, ...assignmentData, month: selectedMonth, name: data.name, hours: data.hours, affectsAll: data.affectsAll, affectedEmployeeIds: data.affectedEmployeeIds || [], employeeId: editingGlobal.employeeId }
            : a
        ));
        toast.success(t('deadlines.toasts.globalAssignment.updated'));
      } else {
        const { data: inserted, error } = await supabase
          .from('global_assignments')
          .insert(assignmentData)
          .select()
          .single();

        if (error) throw error;

        if (inserted) {
          setGlobalAssignments(prev => [...prev, {
            id: inserted.id,
            month: inserted.month,
            name: inserted.name,
            hours: inserted.hours,
            affectsAll: inserted.affects_all,
            affectedEmployeeIds: inserted.affected_employee_ids || [],
            employeeId: (inserted as { employee_id?: string; created_by?: string }).employee_id || (inserted as { created_by?: string }).created_by
          }]);
        }
        toast.success(t('deadlines.toasts.globalAssignment.created'));
      }
    } catch (error) {
      console.error('Error guardando asignación global:', error);
      const fallbackMessage = t('deadlines.toasts.globalAssignment.saveError');
      const errorMessage = (error as Error)?.message || fallbackMessage;
      toast.error(errorMessage);
    }
  };

  const confirmDeleteDeadline = async () => {
    if (!editingDeadline) return;

    try {
      const { error } = await supabase
        .from('deadlines')
        .delete()
        .eq('id', editingDeadline.id);

      if (error) throw error;

      setDeadlines(prev => prev.filter(d => d.id !== editingDeadline.id));
      setEditingDeadline(null);
      toast.success('Deadline eliminado');
    } catch (error) {
      console.error('Error eliminando deadline:', error);
      toast.error('Error al eliminar deadline');
    }
  };

  const confirmDeleteGlobal = async (id: string) => {
    try {
      const { error } = await supabase
        .from('global_assignments')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setGlobalAssignments(prev => prev.filter(a => a.id !== id));
      toast.success('Asignación eliminada');
      if (isGlobalDialogOpen) setIsGlobalDialogOpen(false);
    } catch (error) {
      console.error('Error eliminando asignación global:', error);
      toast.error('Error al eliminar asignación global');
    }
  };



  const handleDeleteGlobal = (id: string) => {
    if (!currentUser) {
      toast.error('No hay usuario autenticado');
      return;
    }

    const assignment = globalAssignments.find(a => a.id === id);
    if (!assignment) {
      toast.error('Asignación no encontrada');
      return;
    }

    // Solo permitir eliminar asignaciones propias
    if (assignment.employeeId && assignment.employeeId !== currentUser.id) {
      toast.error('Solo puedes eliminar tus propias asignaciones');
      return;
    }

    setConfirmAction({ type: 'delete_allocation', id: id });
  };

  const handleConfirmAction = async () => {
    if (!confirmAction) return;

    if (confirmAction.type === 'delete_deadline') {
      await confirmDeleteDeadline();
    } else if (confirmAction.type === 'delete_allocation') {
      if (confirmAction.id) {
        await confirmDeleteGlobal(confirmAction.id);
      }
    } else if (confirmAction.type === 'copy_month') {
      await executeCopyFromPreviousMonth();
    } else if (confirmAction.type === 'delete_month') {
      await executeDeleteMonth();
    }
    setConfirmAction(null);
  };

  const handleDeleteMonth = () => {
    if (deadlines.length === 0) {
      toast.info('No hay deadlines para eliminar en este mes');
      return;
    }
    setConfirmAction({
      type: 'delete_month',
      data: { count: deadlines.length }
    });
  };

  const executeDeleteMonth = async () => {
    if (!currentAgency?.id) return;
    setIsLoading(true);
    try {
      // Solo borrar deadlines de proyectos de esta agencia (evitar borrar otras agencias en mismo Supabase)
      const agencyProjectIds = projects.map(p => p.id);
      if (agencyProjectIds.length === 0) {
        setDeadlines([]);
        setHiddenProjects(new Set());
        setIsLoading(false);
        return;
      }
      const { error } = await supabase
        .from('deadlines')
        .delete()
        .eq('month', selectedMonth)
        .in('project_id', agencyProjectIds);

      if (error) throw error;

      setDeadlines([]);
      setHiddenProjects(new Set());
      toast.success('Mes reseteado correctamente');
    } catch (error) {
      console.error('Error reseteando mes:', error);
      toast.error('Error al resetear el mes');
    } finally {
      setIsLoading(false);
    }
  };

  /** Mes anterior calendario (misma lógica que handlePrevMonth; evita ambigüedades de parseISO/UTC). */
  const getPreviousMonthKey = useCallback((monthKey: string) => {
    const [year, month] = monthKey.split('-').map(Number);
    const firstOfMonth = new Date(year, month - 1, 1);
    return format(subMonths(firstOfMonth, 1), 'yyyy-MM');
  }, []);

  const executeCopyFromPreviousMonth = async () => {
    setIsLoading(true);
    try {
      const previousMonth = getPreviousMonthKey(selectedMonth);
      // 1. Obtener solo deadlines de esta agencia (mes anterior)
      const { data: previousDeadlines, error: fetchError } = await fetchDeadlinesForMonth(previousMonth, currentAgency?.id);
      if (fetchError) throw fetchError;

      if (!previousDeadlines || previousDeadlines.length === 0) {
        toast.info('No hay deadlines en el mes anterior');
        return;
      }

      const existingProjectIds = new Set(deadlines.map((d) => d.projectId));
      const validProjectIds = new Set(projects.map((p) => p.id));
      const sourceDeadlines = previousDeadlines.filter(
        (d) => validProjectIds.has(d.projectId) && !existingProjectIds.has(d.projectId)
      );
      const skippedExisting = previousDeadlines.length - sourceDeadlines.length;

      if (sourceDeadlines.length === 0) {
        toast.info(
          skippedExisting > 0
            ? 'Todos los deadlines del mes anterior ya existen en este mes (o el proyecto ya no está en la agencia).'
            : 'No hay deadlines aplicables para copiar.'
        );
        return;
      }

      // 2. Insertarlos en el mes actual
      const newDeadlines = sourceDeadlines.map(d => ({
        project_id: d.projectId,
        month: selectedMonth,
        notes: d.notes ?? null,
        employee_hours: d.employeeHours,
        is_hidden: d.isHidden ?? false,
        budget_override: d.budgetOverride ?? null
      }));

      const { data: insertedData, error: insertError } = await supabase
        .from('deadlines')
        .insert(newDeadlines)
        .select();

      if (insertError) throw insertError;

      // 3. Sincronizar con BD (evita duplicados por proyecto+mes y orden coherente con fetchDeadlinesForMonth)
      const { data: refreshed, error: refreshError } = await fetchDeadlinesForMonth(selectedMonth, currentAgency?.id);
      if (refreshError) throw refreshError;
      if (refreshed && refreshed.length > 0) {
        setDeadlines(refreshed);
        const hidden = new Set<string>();
        refreshed.forEach((d) => {
          if (d.isHidden) hidden.add(d.projectId);
        });
        setHiddenProjects(hidden);
      }

      const insertedCount = insertedData?.length ?? 0;
      toast.success(
        skippedExisting > 0
          ? `Se copiaron ${insertedCount} deadlines (${skippedExisting} omitidos: ya existían u otro motivo).`
          : `Se copiaron ${insertedCount} deadlines`
      );
    } catch (error) {
      console.error('Error copiando deadlines:', error);
      toast.error('Error al copiar deadlines');
    } finally {
      setIsLoading(false);
    }
  };

  const copyFromPreviousMonth = async () => {
    setIsLoading(true);
    try {
      const previousMonth = getPreviousMonthKey(selectedMonth);
      const { data: previousDeadlines, error: fetchError } = await fetchDeadlinesForMonth(previousMonth, currentAgency?.id);
      if (fetchError) throw fetchError;

      if (!previousDeadlines || previousDeadlines.length === 0) {
        toast.info('No hay deadlines en el mes anterior');
        return;
      }

      const existingProjectIds = new Set(deadlines.map((d) => d.projectId));
      const validProjectIds = new Set(projects.map((p) => p.id));
      const copyableCount = previousDeadlines.filter(
        (d) => validProjectIds.has(d.projectId) && !existingProjectIds.has(d.projectId)
      ).length;

      if (copyableCount === 0) {
        toast.info('No hay deadlines nuevos para copiar (todos los del mes anterior ya están en este mes).');
        return;
      }

      setConfirmAction({
        type: 'copy_month',
        data: { count: copyableCount }
      });
    } catch (error) {
      console.error('Error checking previous deadlines:', error);
      toast.error('Error al verificar deadlines anteriores');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleClient = (clientId: string) => {
    setExpandedClients(prev => {
      const newSet = new Set(prev);
      if (newSet.has(clientId)) {
        newSet.delete(clientId);
      } else {
        newSet.add(clientId);
      }
      return newSet;
    });
  };

  // Funciones para navegar entre meses
  const handlePrevMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const date = new Date(year, month - 1, 1);
    const prevDate = subMonths(date, 1);
    setSelectedMonth(format(prevDate, 'yyyy-MM'));
  };

  const handleNextMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const date = new Date(year, month - 1, 1);
    const nextDate = addMonths(date, 1);
    setSelectedMonth(format(nextDate, 'yyyy-MM'));
  };

  const handleToday = () => {
    setSelectedMonth(format(new Date(), 'yyyy-MM'));
  };

  // Formatear el mes actual para mostrar
  const currentMonthDate = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    return new Date(year, month - 1, 1);
  }, [selectedMonth]);

  const {
    getHoursOnProject,
    suggestionDonors,
    suggestionsByEmployeeAndProject,
    suggestionsByEmployee,
  } = useDeadlinesRedistribution({
    activeEmployees,
    deadlines,
    projects,
    hiddenProjects,
    getMonthlyCapacity,
    getEmployeeAssignedHours,
    formatProjectName,
    excludedDonorIds,
    maxReceiverLoadPct,
    minSenderLoadPct,
    employees,
    onlySharedProjects,
    includedProjectIds: includedProjectIds.size > 0 ? includedProjectIds : null,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-slate-400">{t('deadlines.loading')}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row gap-4 md:gap-6 p-4 md:p-6 min-h-screen bg-slate-50">
      <DeadlinesTour forceShow={showTour} />
      {/* Columna principal - Proyectos */}
      <div className="flex-1 min-w-0 space-y-4">
        <DeadlinesPageHeader
          currentMonthDate={currentMonthDate}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
          canEditDeadlines={canEditDeadlines}
          onCopyFromPreviousMonth={copyFromPreviousMonth}
          onDeleteMonth={() => handleDeleteMonth()}
          isMobile={isMobile}
          employees={activeEmployees}
          getMonthlyCapacity={getMonthlyCapacity}
          getEmployeeAssignedHours={getEmployeeAssignedHours}
        />

        {/* Filtros: estado interno en DeadlinesFilters; página solo recibe snapshot vía onFiltersChange */}
        {isMobile ? (
          <div className="flex items-center gap-2">
            <DeadlinesFilters
              activeFilters={activeFilters}
              employees={activeEmployees}
              isMobile
              onFiltersChange={setFilterSnapshot}
              renderMobileFilterTrigger={(onClick) => (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-11 px-4 gap-2 text-sm touch-manipulation"
                  onClick={onClick}
                >
                  <Filter className="h-4 w-4" />
                  {t('deadlines.filters.button')}
                </Button>
              )}
            />
            {canEditDeadlines && (
              <Button variant="outline" size="sm" className="h-11 px-4 gap-1" onClick={() => openGlobalDialog()}>
                <Plus className="h-4 w-4" />
                {t('deadlines.globalAssignments.button')}
              </Button>
            )}
          </div>
        ) : (
          <DeadlinesFilters
            activeFilters={activeFilters}
            employees={activeEmployees}
            isMobile={false}
            onFiltersChange={setFilterSnapshot}
          />
        )}

        {/* Proyectos por cliente */}
        <DeadlinesProjectList
          projectsByClient={projectsByClient}
          clients={clients}
          expandedClients={expandedClients}
          toggleClient={toggleClient}
          getProjectDeadline={getProjectDeadline}
          editingProjectId={editingProjectId}
          inlineFormData={inlineFormData}
          hiddenProjects={hiddenProjects}
          editingLocks={editingLocks}
          currentUserId={currentUser?.id}
          employees={activeEmployees}
          formatProjectName={formatProjectName}
          isMobile={isMobile}
          startEditingProject={startEditingProject}
          updateInlineEmployeeHours={updateInlineEmployeeHours}
          onFormPatch={handleFormPatch}
          autoSaveDeadline={autoSaveDeadline}
          autoSaveStatus={autoSaveStatus}
          cancelEditingProject={cancelEditingProject}
          onRequestDeleteDeadline={(project) => {
            const deadline = deadlines.find(d => d.projectId === project.id && d.month === selectedMonth);
            if (deadline) {
              setEditingDeadline(deadline);
              setConfirmAction({ type: 'delete_deadline', id: deadline.id });
            } else {
              toast.info(t('deadlines.toasts.noConfigToDelete'));
            }
          }}
        />
      </div>

      {/* Sheet de edición de proyecto (solo móvil) */}
      {isMobile && editingProjectId && (() => {
        const project = projects.find(p => p.id === editingProjectId);
        const deadline = getProjectDeadline(editingProjectId);
        if (!project) return null;
        return (
          <DeadlinesProjectEditSheet
            open={true}
            onOpenChange={(o) => !o && cancelEditingProject()}
            project={{ id: project.id, name: project.name, budgetHours: project.budgetHours }}
            deadline={deadline ? { budgetOverride: deadline.budgetOverride } : null}
            formData={inlineFormData}
            employees={activeEmployees}
            formatProjectName={formatProjectName}
            onEmployeeHoursChange={updateInlineEmployeeHours}
            onFormPatch={handleFormPatch}
            saveStatus={autoSaveStatus}
            onClose={cancelEditingProject}
          />
        );
      })()}

      {!isMobile && canEditDeadlines && (
        <DeadlinesSidebar
          employees={activeEmployees}
          getMonthlyCapacity={getMonthlyCapacity}
          getEmployeeAssignedHours={getEmployeeAssignedHours}
          suggestionsPreview={suggestionsByEmployeeAndProject.slice(0, 3)}
          onOpenSuggestionsFull={() => setIsSuggestionsExpandedOpen(true)}
          globalAssignments={globalAssignments}
          currentUserId={currentUser?.id}
          onOpenGlobalDialog={openGlobalDialog}
          onDeleteGlobal={handleDeleteGlobal}
        />
      )}

      {/* Dialog para asignaciones globales (estado del formulario en GlobalAssignmentDialog) */}
      <GlobalAssignmentDialog
        open={isGlobalDialogOpen}
        onOpenChange={setIsGlobalDialogOpen}
        initialData={editingGlobal}
        onSave={onSaveGlobal}
        employees={activeEmployees}
      />

      {/* Popup ampliable de sugerencias de redistribución */}
      <DeadlinesSuggestionsPanel
        open={isSuggestionsExpandedOpen}
        onOpenChange={setIsSuggestionsExpandedOpen}
        isMobile={isMobile}
        expandedProjects={expandedSuggestionsProjects}
        setExpandedProjects={setExpandedSuggestionsProjects}
        expandedEmployees={expandedSuggestionsEmployees}
        setExpandedEmployees={setExpandedSuggestionsEmployees}
        excludedDonorIds={excludedDonorIds}
        setExcludedDonorIds={setExcludedDonorIds}
        maxReceiverLoadPct={maxReceiverLoadPct}
        setMaxReceiverLoadPct={setMaxReceiverLoadPct}
        maxReceiverLoadPctInput={maxReceiverLoadPctInput}
        setMaxReceiverLoadPctInput={setMaxReceiverLoadPctInput}
        minSenderLoadPct={minSenderLoadPct}
        setMinSenderLoadPct={setMinSenderLoadPct}
        minSenderLoadPctInput={minSenderLoadPctInput}
        setMinSenderLoadPctInput={setMinSenderLoadPctInput}
        suggestionsCondicionantesOpen={suggestionsCondicionantesOpen}
        setSuggestionsCondicionantesOpen={setSuggestionsCondicionantesOpen}
        rightPanelPorProyectoOpen={rightPanelPorProyectoOpen}
        setRightPanelPorProyectoOpen={setRightPanelPorProyectoOpen}
        suggestionDonors={suggestionDonors}
        suggestionsByEmployeeAndProject={suggestionsByEmployeeAndProject}
        getMonthlyCapacity={getMonthlyCapacity}
        getEmployeeAssignedHours={getEmployeeAssignedHours}
        onlySharedProjects={onlySharedProjects}
        setOnlySharedProjects={setOnlySharedProjects}
        includedProjectIds={includedProjectIds}
        setIncludedProjectIds={setIncludedProjectIds}
        filteredProjects={filteredProjects}
      />

      <DeadlinesConfirmDialog
        open={!!confirmAction}
        onOpenChange={(open) => !open && setConfirmAction(null)}
        type={confirmAction?.type ?? null}
        data={confirmAction?.data}
        onConfirm={handleConfirmAction}
      />
    </div>
  );
}
