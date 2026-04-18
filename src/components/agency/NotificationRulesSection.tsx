import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { Bell, Check, ChevronsUpDown, Eye, Loader2, Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAgency } from '@/contexts/AgencyContext';
import { useAppAllocations, useAppEmployees, useAppProjects } from '@/contexts/AppContext';
import { NotificationEmailPreviewDialog } from '@/components/agency/NotificationEmailPreviewDialog';
import { buildNotificationEmailPreview } from '@/utils/buildNotificationEmailPreview';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import {
  mapNotificationRuleFromDb,
  type CoherenceOpStatus,
  type NotificationEvaluationMode,
  type NotificationIssueFlag,
  type NotificationRecipientPolicy,
  type NotificationRule,
  type NotificationRuleConditions,
  type NotificationTriggerType,
} from '@/types/notifications';

const ISSUE_FLAGS: { id: NotificationIssueFlag; label: string }[] = [
  { id: 'needs_planning', label: 'Falta planificación' },
  { id: 'behind_schedule', label: 'Ritmo bajo (vs avance del mes)' },
  { id: 'over_budget', label: 'Sobre presupuesto planificado' },
  { id: 'no_activity', label: 'Sin actividad con presupuesto' },
];

const RECIPIENT_OPTIONS_TRANSFER: { value: NotificationRecipientPolicy; label: string }[] = [
  { value: 'transfer_target', label: 'Quien recibe la tarea' },
  { value: 'transfer_source', label: 'Quien envía la solicitud' },
  { value: 'all_with_hours_in_month', label: 'Todos con horas en el proyecto (mes)' },
  { value: 'role_name', label: 'Por nombre de rol' },
  { value: 'agency_admins', label: 'Perfiles con acceso a configuración de agencia' },
  { value: 'custom_emails', label: 'Solo correos adicionales' },
];

const RECIPIENT_OPTIONS_SCHEDULED: { value: NotificationRecipientPolicy; label: string }[] = [
  { value: 'all_with_hours_in_month', label: 'Todos con horas en el proyecto (mes)' },
  { value: 'role_name', label: 'Por nombre de rol' },
  { value: 'agency_admins', label: 'Perfiles con acceso a configuración de agencia' },
  { value: 'custom_emails', label: 'Solo correos adicionales' },
];

function defaultConditions(): NotificationIssueFlag[] {
  return ['needs_planning', 'behind_schedule', 'over_budget', 'no_activity'];
}

const DEFAULT_COHERENCE_STATUSES: CoherenceOpStatus[] = [
  'over-budget',
  'behind-schedule',
  'needs-planning',
  'no-activity',
];

const COHERENCE_STATUS_OPTIONS: { id: CoherenceOpStatus; label: string }[] = [
  { id: 'over-budget', label: 'Exceso horas' },
  { id: 'behind-schedule', label: 'Retrasados (ritmo)' },
  { id: 'needs-planning', label: 'Falta planificar' },
  { id: 'no-activity', label: 'Sin actividad' },
  { id: 'in-rule', label: 'En regla (solo si quieres avisos incluso OK)' },
];

/** Conserva periodicidad, día de la semana y filtros al cambiar el modo de evaluación. */
function preservedScheduleScopeAndFilters(rule: NotificationRule): Pick<
  NotificationRuleConditions,
  'periodicity' | 'schedule_day_of_week' | 'project_ids' | 'client_ids'
> {
  const c = rule.conditions;
  const out: Pick<
    NotificationRuleConditions,
    'periodicity' | 'schedule_day_of_week' | 'project_ids' | 'client_ids'
  > = {
    periodicity: c.periodicity ?? 'monthly',
    project_ids: c.project_ids?.length ? [...c.project_ids] : undefined,
    client_ids: c.client_ids?.length ? [...c.client_ids] : undefined,
  };
  if (c.periodicity === 'weekly' && typeof c.schedule_day_of_week === 'number') {
    out.schedule_day_of_week = c.schedule_day_of_week;
  }
  return out;
}

function scheduledConditionsPayload(r: Partial<NotificationRule>): Record<string, unknown> {
  const evalMode: NotificationEvaluationMode = r.conditions?.evaluation ?? 'project_month_health';
  const periodicity = r.conditions?.periodicity ?? 'monthly';
  const schedule: Record<string, unknown> = { periodicity };
  if (periodicity === 'weekly') {
    const dow = r.conditions?.schedule_day_of_week;
    schedule.schedule_day_of_week =
      typeof dow === 'number' && dow >= 1 && dow <= 7 ? Math.floor(dow) : 1;
  }
  const scope = {
    project_ids: r.conditions?.project_ids?.length ? r.conditions.project_ids : undefined,
    client_ids: r.conditions?.client_ids?.length ? r.conditions.client_ids : undefined,
  };
  if (evalMode === 'deadline_coherence') {
    const opIn =
      r.conditions?.coherence_op_status_in && r.conditions.coherence_op_status_in.length > 0
        ? r.conditions.coherence_op_status_in
        : [...DEFAULT_COHERENCE_STATUSES];
    return {
      evaluation: 'deadline_coherence',
      ...scope,
      ...schedule,
      coherence_min_abs_hours: r.conditions?.coherence_min_abs_hours ?? 0.05,
      coherence_op_status_in: opIn,
      coherence_delivery_mode: r.conditions?.coherence_delivery_mode ?? 'per_project',
      coherence_digest_max: r.conditions?.coherence_digest_max ?? 12,
    };
  }
  return {
    evaluation: 'project_month_health',
    ...scope,
    ...schedule,
    match_any: r.conditions?.match_any?.length ? r.conditions.match_any : defaultConditions(),
  };
}

function rowToInsertPayload(r: Partial<NotificationRule> & { agencyId: string }) {
  const trigger = r.triggerType ?? 'task_transfer_pending';
  let conditions: Record<string, unknown> = {};
  if (trigger === 'scheduled') {
    conditions = scheduledConditionsPayload(r);
  }

  let schedule_hour_utc: number | null = null;
  if (trigger === 'scheduled') {
    const raw = r.scheduleHourUtc;
    if (raw !== null && raw !== undefined) {
      const h = Number(raw);
      if (Number.isFinite(h)) {
        schedule_hour_utc = Math.min(23, Math.max(0, Math.trunc(h)));
      }
    }
  }

  return {
    agency_id: r.agencyId,
    name: String(r.name ?? '').trim(),
    enabled: r.enabled ?? true,
    trigger_type: trigger,
    schedule_hour_utc,
    conditions,
    recipient_policy: r.recipientPolicy ?? 'transfer_target',
    recipient_role_name:
      r.recipientPolicy === 'role_name' ? (r.recipientRoleName?.trim() || null) : null,
    extra_emails: r.extraEmails?.length ? r.extraEmails : [],
  };
}

export type NotificationRulesSectionHandle = {
  /** Persiste todas las reglas en pantalla (p. ej. al pulsar «Guardar cambios» global). */
  saveAllRules: () => Promise<boolean>;
};

type ClientRow = { id: string; name: string };
type ProjectRow = { id: string; name: string; clientId: string };

function RuleScheduledScopeFilters({
  rule,
  clients,
  projects,
  updateLocal,
}: {
  rule: NotificationRule;
  clients: ClientRow[];
  projects: ProjectRow[];
  updateLocal: (id: string, patch: Partial<NotificationRule>) => void;
}) {
  const [openClients, setOpenClients] = useState(false);
  const [openProjects, setOpenProjects] = useState(false);

  const selectedClientIds = rule.conditions.client_ids ?? [];
  const selectedProjectIds = rule.conditions.project_ids ?? [];

  const sortedClients = useMemo(
    () => [...clients].sort((a, b) => a.name.localeCompare(b.name, 'es')),
    [clients],
  );
  const sortedProjects = useMemo(
    () => [...projects].sort((a, b) => a.name.localeCompare(b.name, 'es')),
    [projects],
  );

  const toggleClient = (clientId: string) => {
    const set = new Set(selectedClientIds);
    if (set.has(clientId)) set.delete(clientId);
    else set.add(clientId);
    const next = [...set];
    updateLocal(rule.id, {
      conditions: {
        ...rule.conditions,
        client_ids: next.length ? next : undefined,
      },
    });
  };

  const toggleProject = (projectId: string) => {
    const set = new Set(selectedProjectIds);
    if (set.has(projectId)) set.delete(projectId);
    else set.add(projectId);
    const next = [...set];
    updateLocal(rule.id, {
      conditions: {
        ...rule.conditions,
        project_ids: next.length ? next : undefined,
      },
    });
  };

  const clearClients = () =>
    updateLocal(rule.id, { conditions: { ...rule.conditions, client_ids: undefined } });
  const clearProjects = () =>
    updateLocal(rule.id, { conditions: { ...rule.conditions, project_ids: undefined } });

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-2">
        <Label>Clientes (opcional)</Label>
        <Popover open={openClients} onOpenChange={setOpenClients}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className="w-full justify-between font-normal"
              aria-expanded={openClients}
            >
              <span className="truncate text-left">
                {selectedClientIds.length === 0
                  ? 'Todos los clientes'
                  : `${selectedClientIds.length} cliente(s)`}
              </span>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
            <Command>
              <CommandInput placeholder="Buscar cliente…" />
              <CommandList>
                <CommandEmpty>Sin resultados.</CommandEmpty>
                <CommandGroup>
                  {sortedClients.map((c) => {
                    const sel = selectedClientIds.includes(c.id);
                    return (
                      <CommandItem
                        key={c.id}
                        value={`${c.name} ${c.id}`}
                        onSelect={() => toggleClient(c.id)}
                      >
                        <Check className={cn('mr-2 h-4 w-4', sel ? 'opacity-100' : 'opacity-0')} />
                        {c.name}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </CommandList>
            </Command>
            {selectedClientIds.length > 0 ? (
              <div className="border-t p-2">
                <Button type="button" variant="ghost" size="sm" className="w-full" onClick={clearClients}>
                  Quitar filtro de clientes
                </Button>
              </div>
            ) : null}
          </PopoverContent>
        </Popover>
        <p className="text-xs text-slate-500">Si eliges uno o más, solo cuentan proyectos de esos clientes.</p>
      </div>
      <div className="space-y-2">
        <Label>Proyectos (opcional)</Label>
        <Popover open={openProjects} onOpenChange={setOpenProjects}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className="w-full justify-between font-normal"
              aria-expanded={openProjects}
            >
              <span className="truncate text-left">
                {selectedProjectIds.length === 0
                  ? 'Todos los proyectos'
                  : `${selectedProjectIds.length} proyecto(s)`}
              </span>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
            <Command>
              <CommandInput placeholder="Buscar proyecto…" />
              <CommandList>
                <CommandEmpty>Sin resultados.</CommandEmpty>
                <CommandGroup>
                  {sortedProjects.map((p) => {
                    const sel = selectedProjectIds.includes(p.id);
                    return (
                      <CommandItem
                        key={p.id}
                        value={`${p.name} ${p.id}`}
                        onSelect={() => toggleProject(p.id)}
                      >
                        <Check className={cn('mr-2 h-4 w-4', sel ? 'opacity-100' : 'opacity-0')} />
                        {p.name}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </CommandList>
            </Command>
            {selectedProjectIds.length > 0 ? (
              <div className="border-t p-2">
                <Button type="button" variant="ghost" size="sm" className="w-full" onClick={clearProjects}>
                  Quitar filtro de proyectos
                </Button>
              </div>
            ) : null}
          </PopoverContent>
        </Popover>
        <p className="text-xs text-slate-500">Si eliges proyectos concretos, la regla solo los evalúa.</p>
      </div>
    </div>
  );
}

export const NotificationRulesSection = forwardRef<NotificationRulesSectionHandle, { agencyId: string }>(
  function NotificationRulesSection({ agencyId }, ref) {
  const { toast } = useToast();
  const { currentAgency } = useAgency();
  const { allocations } = useAppAllocations();
  const { projects, clients } = useAppProjects();
  const { employees } = useAppEmployees();
  const [rules, setRules] = useState<NotificationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewSubject, setPreviewSubject] = useState<string | null>(null);
  const [previewNote, setPreviewNote] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const rulesRef = useRef(rules);
  rulesRef.current = rules;

  const load = useCallback(async (skipLoadingState = false) => {
    if (!skipLoadingState) setLoading(true);
    const { data, error } = await supabase
      .from('notification_rules')
      .select('*')
      .eq('agency_id', agencyId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error(error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las reglas de notificación.',
        variant: 'destructive',
      });
      setRules([]);
    } else {
      setRules((data || []).map((row) => mapNotificationRuleFromDb(row as Record<string, unknown>)));
    }
    setLoading(false);
  }, [agencyId, toast]);

  const persistRule = useCallback(
    async (rule: NotificationRule) => {
      const full = rowToInsertPayload({ ...rule, agencyId });
      const updatePayload = { ...full };
      delete (updatePayload as { agency_id?: string }).agency_id;
      const result = await supabase
        .from('notification_rules')
        .update(updatePayload)
        .eq('id', rule.id)
        .select('id, name, schedule_hour_utc')
        .single();
      if (!result.error && result.data) {
        const saved = result.data as Record<string, unknown>;
        if (saved.name !== updatePayload.name || saved.schedule_hour_utc !== updatePayload.schedule_hour_utc) {
          console.warn('[NotificationRules] Saved data mismatch', { sent: updatePayload, got: saved });
        }
      }
      return result;
    },
    [agencyId],
  );

  useImperativeHandle(
    ref,
    () => ({
      async saveAllRules() {
        const list = rulesRef.current;
        if (list.length === 0) return true;
        for (const rule of list) {
          const { error } = await persistRule(rule);
          if (error) {
            toast({
              title: 'Error al guardar reglas de notificación',
              description: error.message,
              variant: 'destructive',
            });
            return false;
          }
        }
        await load();
        return true;
      },
    }),
    [persistRule, load, toast],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const addRule = async () => {
    const payload = rowToInsertPayload({
      agencyId,
      name: 'Nueva regla',
      enabled: true,
      triggerType: 'task_transfer_pending',
      recipientPolicy: 'transfer_target',
      extraEmails: [],
      conditions: { match_any: defaultConditions() },
    });

    const { data, error } = await supabase.from('notification_rules').insert(payload).select('*').single();

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }
    if (data) {
      setRules((prev) => [...prev, mapNotificationRuleFromDb(data as Record<string, unknown>)]);
      toast({ title: 'Regla creada' });
    }
  };

  const saveRule = async (rule: NotificationRule) => {
    setSavingId(rule.id);
    const { error } = await persistRule(rule);

    if (error) {
      console.error('[NotificationRules] save error', error);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Guardado' });
      await load(true);
    }
    setSavingId(null);
  };

  const deleteRule = async (id: string) => {
    if (!confirm('¿Eliminar esta regla?')) return;
    const { error } = await supabase.from('notification_rules').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }
    setRules((prev) => prev.filter((r) => r.id !== id));
    toast({ title: 'Regla eliminada' });
  };

  const updateLocal = (id: string, patch: Partial<NotificationRule>) => {
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const openEmailPreview = async (rule: NotificationRule) => {
    setPreviewOpen(true);
    setPreviewLoading(true);
    setPreviewHtml(null);
    setPreviewSubject(null);
    setPreviewNote(null);
    setPreviewError(null);
    try {
      const result = await buildNotificationEmailPreview({
        rule,
        agencyId,
        agencyName: currentAgency?.name?.trim() || 'Agencia',
        hoursTrackingPreference: currentAgency?.settings?.hoursTrackingPreference,
        allocations,
        projects,
        employees,
      });
      setPreviewHtml(result.html);
      setPreviewSubject(result.subject);
      setPreviewNote(result.note ?? null);
    } catch (e) {
      console.error(e);
      setPreviewError(e instanceof Error ? e.message : 'No se pudo generar la vista previa.');
      toast({
        title: 'Vista previa',
        description: 'No se pudo generar la vista previa del correo.',
        variant: 'destructive',
      });
    } finally {
      setPreviewLoading(false);
    }
  };

  const toggleIssueFlag = (rule: NotificationRule, flag: NotificationIssueFlag) => {
    const current = rule.conditions.match_any?.length ? rule.conditions.match_any : defaultConditions();
    const next = current.includes(flag) ? current.filter((f) => f !== flag) : [...current, flag];
    updateLocal(rule.id, { conditions: { ...rule.conditions, match_any: next } });
  };

  const toggleCoherenceOpStatus = (rule: NotificationRule, st: CoherenceOpStatus) => {
    const current =
      rule.conditions.coherence_op_status_in && rule.conditions.coherence_op_status_in.length > 0
        ? rule.conditions.coherence_op_status_in
        : [...DEFAULT_COHERENCE_STATUSES];
    const next = current.includes(st) ? current.filter((x) => x !== st) : [...current, st];
    updateLocal(rule.id, { conditions: { ...rule.conditions, coherence_op_status_in: next } });
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-slate-500 py-8">
        <Loader2 className="h-5 w-5 animate-spin" />
        Cargando reglas…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <NotificationEmailPreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        subject={previewSubject}
        html={previewHtml}
        note={previewNote}
        loading={previewLoading}
        error={previewError}
      />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-sm text-slate-600 max-w-3xl">
          Aquí defines <strong>cuándo</strong> y <strong>a quién</strong> enviamos avisos por correo (el mismo canal
          que usamos para invitaciones o recuperar contraseña). Las reglas <strong>programadas</strong> se revisan de
          forma automática según la frecuencia y la hora que elijas. Si tu organización aloja Taimbox en servidores
          propios, quien gestione esa instalación debe tener activada la revisión periódica en segundo plano; en el
          servicio gestionado por Taimbox no tienes que configurar nada extra en esta pantalla.
        </p>
        <Button type="button" onClick={() => void addRule()} className="shrink-0">
          <Plus className="h-4 w-4 mr-2" />
          Añadir regla
        </Button>
      </div>

      {rules.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-10 text-center text-slate-500 text-sm">
            No hay reglas. Añade una para avisar por email (p. ej. al solicitar una transferencia de tarea).
          </CardContent>
        </Card>
      ) : null}

      {rules.map((rule) => {
        const recipientOpts =
          rule.triggerType === 'scheduled' ? RECIPIENT_OPTIONS_SCHEDULED : RECIPIENT_OPTIONS_TRANSFER;
        const matchAny = rule.conditions.match_any?.length
          ? rule.conditions.match_any
          : defaultConditions();
        const evalMode: NotificationEvaluationMode = rule.conditions.evaluation ?? 'project_month_health';
        const coherenceOps =
          rule.conditions.coherence_op_status_in && rule.conditions.coherence_op_status_in.length > 0
            ? rule.conditions.coherence_op_status_in
            : [...DEFAULT_COHERENCE_STATUSES];

        return (
          <Card key={rule.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-primary shrink-0" />
                  <CardTitle className="text-base">
                    {rule.name && rule.name !== 'Nueva regla' ? rule.name : 'Regla de notificación'}
                  </CardTitle>
                  {rule.scheduleHourUtc !== null && rule.triggerType === 'scheduled' && (
                    <span
                      className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full"
                      title="Hora universal (UTC). Súmale el desfase de tu zona horaria para calcular la hora local."
                    >
                      {String(rule.scheduleHourUtc).padStart(2, '0')}:00 UTC
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-destructive"
                    onClick={() => void deleteRule(rule.id)}
                    aria-label="Eliminar regla"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <CardDescription>
                Los avisos se envían de forma segura desde el sistema; aquí solo eliges reglas y destinatarios.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label>Nombre de la regla</Label>
                  <Input
                    value={rule.name}
                    onChange={(e) => updateLocal(rule.id, { name: e.target.value })}
                    placeholder="Ej. Aviso transferencias"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={rule.enabled}
                    onCheckedChange={(v) => updateLocal(rule.id, { enabled: v })}
                  />
                  <Label>Activa</Label>
                </div>
                <div className="space-y-2">
                  <Label>Disparador</Label>
                  <Select
                    value={rule.triggerType}
                    onValueChange={(v) => {
                      const tt = v as NotificationTriggerType;
                      const patch: Partial<NotificationRule> = { triggerType: tt };
                      if (tt === 'task_transfer_pending') {
                        patch.scheduleHourUtc = null;
                        patch.recipientPolicy = 'transfer_target';
                      } else {
                        patch.recipientPolicy = 'all_with_hours_in_month';
                        patch.conditions = {
                          evaluation: 'project_month_health',
                          match_any: defaultConditions(),
                          periodicity: 'monthly',
                        };
                      }
                      updateLocal(rule.id, patch);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="task_transfer_pending">Al solicitar transferencia de tarea</SelectItem>
                      <SelectItem value="scheduled">Programada (revisiones periódicas de proyectos)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {rule.triggerType === 'scheduled' ? (
                <>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label>Frecuencia de envío</Label>
                      <Select
                        value={rule.conditions.periodicity || 'monthly'}
                        onValueChange={(v) => {
                          const p = v as 'daily' | 'weekly' | 'monthly';
                          updateLocal(rule.id, {
                            conditions: { ...rule.conditions, periodicity: p }
                          });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Diaria</SelectItem>
                          <SelectItem value="weekly">Semanal</SelectItem>
                          <SelectItem value="monthly">Mensual</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {(rule.conditions.periodicity === 'weekly') && (
                      <div className="space-y-2">
                        <Label>Día de la semana</Label>
                        <Select
                          value={rule.conditions.schedule_day_of_week ? String(rule.conditions.schedule_day_of_week) : '1'}
                          onValueChange={(v) => {
                            updateLocal(rule.id, {
                              conditions: { ...rule.conditions, schedule_day_of_week: parseInt(v, 10) }
                            });
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">Lunes</SelectItem>
                            <SelectItem value="2">Martes</SelectItem>
                            <SelectItem value="3">Miércoles</SelectItem>
                            <SelectItem value="4">Jueves</SelectItem>
                            <SelectItem value="5">Viernes</SelectItem>
                            <SelectItem value="6">Sábado</SelectItem>
                            <SelectItem value="7">Domingo</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label>Hora preferida (UTC, 0–23)</Label>
                      <Input
                        type="number"
                        min={0}
                        max={23}
                        placeholder="Cualquier hora"
                        value={rule.scheduleHourUtc ?? ''}
                        onChange={(e) => {
                          const v = e.target.value;
                          if (v === '') updateLocal(rule.id, { scheduleHourUtc: null });
                          else {
                            const n = parseInt(v, 10);
                            if (!Number.isNaN(n) && n >= 0 && n <= 23) {
                              updateLocal(rule.id, { scheduleHourUtc: n });
                            }
                          }
                        }}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-slate-500">
                    Si indicas una hora, solo en esa franja (UTC) comprobamos si hay que enviar el aviso. Si la dejas
                    vacía, el sistema puede comprobarla en cada pasada automática (habitualmente una vez por hora).
                    Para pasar a hora local, suma el desfase de tu zona respecto a UTC.
                  </p>
                  <RuleScheduledScopeFilters
                    rule={rule}
                    clients={clients.map((c) => ({ id: c.id, name: c.name }))}
                    projects={projects.map((p) => ({ id: p.id, name: p.name, clientId: p.clientId }))}
                    updateLocal={updateLocal}
                  />
                  <div className="space-y-2 max-w-lg">
                    <Label>Tipo de revisión programada</Label>
                    <Select
                      value={evalMode}
                      onValueChange={(v) => {
                        const mode = v as NotificationEvaluationMode;
                        const preserved = preservedScheduleScopeAndFilters(rule);
                        if (mode === 'deadline_coherence') {
                          updateLocal(rule.id, {
                            conditions: {
                              ...preserved,
                              evaluation: 'deadline_coherence',
                              coherence_min_abs_hours: rule.conditions.coherence_min_abs_hours ?? 0.05,
                              coherence_op_status_in: [...DEFAULT_COHERENCE_STATUSES],
                              coherence_delivery_mode: 'per_project',
                              coherence_digest_max: 12,
                            },
                          });
                        } else {
                          updateLocal(rule.id, {
                            conditions: {
                              ...preserved,
                              evaluation: 'project_month_health',
                              match_any: rule.conditions.match_any?.length
                                ? rule.conditions.match_any
                                : defaultConditions(),
                            },
                          });
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="project_month_health">
                          Indicadores del mes (presupuesto, ritmo y planificación)
                        </SelectItem>
                        <SelectItem value="deadline_coherence">
                          Coherencia con deadlines (misma lógica que en Operaciones → seguimiento del mes)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-slate-500">
                      Con coherencia, el correo incluye por proyecto el resumen del mes y, si aplica, una fila por
                      persona con su parte del objetivo y las horas planificadas o imputadas.
                    </p>
                  </div>
                  {evalMode === 'project_month_health' ? (
                    <div className="space-y-2">
                      <Label>Avisar si se cumple alguna de estas condiciones</Label>
                      <div className="grid sm:grid-cols-2 gap-2">
                        {ISSUE_FLAGS.map((f) => (
                          <label key={f.id} className="flex items-center gap-2 text-sm cursor-pointer">
                            <input
                              type="checkbox"
                              className="rounded border-slate-300"
                              checked={matchAny.includes(f.id)}
                              onChange={() => toggleIssueFlag(rule, f.id)}
                            />
                            {f.label}
                          </label>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2 max-w-xs">
                        <Label>Umbral mínimo (horas)</Label>
                        <Input
                          type="number"
                          min={0}
                          step={0.25}
                          value={rule.conditions.coherence_min_abs_hours ?? 0.05}
                          onChange={(e) => {
                            const n = parseFloat(e.target.value);
                            updateLocal(rule.id, {
                              conditions: {
                                ...rule.conditions,
                                coherence_min_abs_hours: Number.isFinite(n) ? n : 0.05,
                              },
                            });
                          }}
                        />
                        <p className="text-xs text-slate-500">
                          Solo se avisa si el total o algún empleado se desvía al menos estas horas respecto al
                          deadline.
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label>Estados operativos a incluir</Label>
                        <div className="grid sm:grid-cols-2 gap-2">
                          {COHERENCE_STATUS_OPTIONS.map((o) => (
                            <label key={o.id} className="flex items-center gap-2 text-sm cursor-pointer">
                              <input
                                type="checkbox"
                                className="rounded border-slate-300"
                                checked={coherenceOps.includes(o.id)}
                                onChange={() => toggleCoherenceOpStatus(rule, o.id)}
                              />
                              {o.label}
                            </label>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2 max-w-md">
                        <Label>Envío</Label>
                        <Select
                          value={rule.conditions.coherence_delivery_mode ?? 'per_project'}
                          onValueChange={(v) =>
                            updateLocal(rule.id, {
                              conditions: {
                                ...rule.conditions,
                                coherence_delivery_mode: v as 'per_project' | 'digest',
                              },
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="per_project">
                              Un correo por proyecto (asunto con el estado)
                            </SelectItem>
                            <SelectItem value="digest">
                              Un solo resumen con varios proyectos (máx. configurable)
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {(rule.conditions.coherence_delivery_mode ?? 'per_project') === 'digest' ? (
                        <div className="space-y-2 max-w-xs">
                          <Label>Máx. proyectos en el resumen</Label>
                          <Input
                            type="number"
                            min={1}
                            max={50}
                            value={rule.conditions.coherence_digest_max ?? 12}
                            onChange={(e) => {
                              const n = parseInt(e.target.value, 10);
                              updateLocal(rule.id, {
                                conditions: {
                                  ...rule.conditions,
                                  coherence_digest_max: Number.isFinite(n) ? Math.min(50, Math.max(1, n)) : 12,
                                },
                              });
                            }}
                          />
                        </div>
                      ) : null}
                    </>
                  )}
                </>
              ) : null}

              <div className="space-y-2">
                <Label>Destinatarios</Label>
                <Select
                  value={rule.recipientPolicy}
                  onValueChange={(v) =>
                    updateLocal(rule.id, { recipientPolicy: v as NotificationRecipientPolicy })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {recipientOpts.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {rule.recipientPolicy === 'role_name' ? (
                <div className="space-y-2">
                  <Label>Nombre del rol (como en Equipo)</Label>
                  <Input
                    value={rule.recipientRoleName ?? ''}
                    onChange={(e) => updateLocal(rule.id, { recipientRoleName: e.target.value })}
                    placeholder="Ej. Project Manager"
                  />
                </div>
              ) : null}

              <div className="space-y-2">
                <Label>Correos adicionales (opcional)</Label>
                <Input
                  value={rule.extraEmails.join(', ')}
                  onChange={(e) =>
                    updateLocal(rule.id, {
                      extraEmails: e.target.value
                        .split(',')
                        .map((s) => s.trim())
                        .filter(Boolean),
                    })
                  }
                  placeholder="uno@empresa.com, otro@empresa.com"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void openEmailPreview(rule)}
                  disabled={
                    (rule.triggerType === 'scheduled' &&
                      evalMode === 'project_month_health' &&
                      matchAny.length === 0) ||
                    (rule.triggerType === 'scheduled' &&
                      evalMode === 'deadline_coherence' &&
                      coherenceOps.length === 0)
                  }
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Vista previa del correo
                </Button>
                <Button
                  type="button"
                  onClick={() => void saveRule(rule)}
                  disabled={
                    savingId === rule.id ||
                    (rule.triggerType === 'scheduled' &&
                      evalMode === 'project_month_health' &&
                      matchAny.length === 0) ||
                    (rule.triggerType === 'scheduled' &&
                      evalMode === 'deadline_coherence' &&
                      coherenceOps.length === 0)
                  }
                >
                  {savingId === rule.id ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Guardando…
                    </>
                  ) : (
                    'Guardar regla'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
});
