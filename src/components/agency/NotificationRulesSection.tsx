import { useCallback, useEffect, useState } from 'react';
import { Bell, Eye, Loader2, Plus, Trash2 } from 'lucide-react';
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
import { useToast } from '@/hooks/use-toast';
import {
  mapNotificationRuleFromDb,
  type CoherenceOpStatus,
  type NotificationEvaluationMode,
  type NotificationIssueFlag,
  type NotificationRecipientPolicy,
  type NotificationRule,
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

function rowToInsertPayload(r: Partial<NotificationRule> & { agencyId: string }) {
  const trigger = r.triggerType ?? 'task_transfer_pending';
  let conditions: Record<string, unknown> = {};
  if (trigger === 'scheduled') {
    const evalMode: NotificationEvaluationMode = r.conditions?.evaluation ?? 'project_month_health';
    if (evalMode === 'deadline_coherence') {
      const opIn =
        r.conditions?.coherence_op_status_in && r.conditions.coherence_op_status_in.length > 0
          ? r.conditions.coherence_op_status_in
          : [...DEFAULT_COHERENCE_STATUSES];
      conditions = {
        evaluation: 'deadline_coherence',
        project_ids: r.conditions?.project_ids?.length ? r.conditions.project_ids : undefined,
        client_ids: r.conditions?.client_ids?.length ? r.conditions.client_ids : undefined,
        coherence_min_abs_hours: r.conditions?.coherence_min_abs_hours ?? 0.05,
        coherence_op_status_in: opIn,
        coherence_delivery_mode: r.conditions?.coherence_delivery_mode ?? 'per_project',
        coherence_digest_max: r.conditions?.coherence_digest_max ?? 12,
      };
    } else {
      conditions = {
        evaluation: 'project_month_health',
        match_any: r.conditions?.match_any?.length ? r.conditions.match_any : defaultConditions(),
        project_ids: r.conditions?.project_ids?.length ? r.conditions.project_ids : undefined,
        client_ids: r.conditions?.client_ids?.length ? r.conditions.client_ids : undefined,
      };
    }
  }

  return {
    agency_id: r.agencyId,
    name: r.name ?? '',
    enabled: r.enabled ?? true,
    trigger_type: trigger,
    schedule_hour_utc: trigger === 'scheduled' ? r.scheduleHourUtc : null,
    conditions,
    recipient_policy: r.recipientPolicy ?? 'transfer_target',
    recipient_role_name:
      r.recipientPolicy === 'role_name' ? (r.recipientRoleName?.trim() || null) : null,
    extra_emails: r.extraEmails?.length ? r.extraEmails : [],
  };
}

export function NotificationRulesSection({ agencyId }: { agencyId: string }) {
  const { toast } = useToast();
  const { currentAgency } = useAgency();
  const { allocations } = useAppAllocations();
  const { projects } = useAppProjects();
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

  const load = useCallback(async () => {
    setLoading(true);
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
    const full = rowToInsertPayload({
      ...rule,
      agencyId,
    });
    const updatePayload = { ...full };
    delete (updatePayload as { agency_id?: string }).agency_id;
    const { error } = await supabase.from('notification_rules').update(updatePayload).eq('id', rule.id);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Guardado' });
      await load();
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
        <p className="text-sm text-slate-600">
          Los correos se envían con Resend (misma configuración que invitaciones y reset de contraseña). Las
          reglas programadas requieren llamar a la Edge Function <code className="text-xs bg-slate-100 px-1 rounded">process-notification-rules</code> con un cron y el secreto{' '}
          <code className="text-xs bg-slate-100 px-1 rounded">NOTIFICATIONS_CRON_SECRET</code> (ver documentación).
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
                  <CardTitle className="text-base">Regla de notificación</CardTitle>
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
              <CardDescription>Se evalúa en el servidor; no expone claves de Resend al navegador.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label>Nombre interno</Label>
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
                      <SelectItem value="scheduled">Programada (revisión mensual de proyectos)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {rule.triggerType === 'scheduled' ? (
                <>
                  <div className="space-y-2 max-w-xs">
                    <Label>Hora UTC de envío (opcional)</Label>
                    <Input
                      type="number"
                      min={0}
                      max={23}
                      placeholder="Vacío = cada vez que ejecute el cron"
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
                    <p className="text-xs text-slate-500">
                      Si indicas 0–23, la regla solo se evalúa en esa hora UTC cuando el cron llama cada hora.
                    </p>
                  </div>
                  <div className="space-y-2 max-w-lg">
                    <Label>Tipo de revisión programada</Label>
                    <Select
                      value={evalMode}
                      onValueChange={(v) => {
                        const mode = v as NotificationEvaluationMode;
                        if (mode === 'deadline_coherence') {
                          updateLocal(rule.id, {
                            conditions: {
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
                          Indicadores mensuales (presupuesto / planificación genérica)
                        </SelectItem>
                        <SelectItem value="deadline_coherence">
                          Coherencia deadlines (como “Coherencia de planificación global” en Operaciones)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-slate-500">
                      La opción de coherencia envía el detalle por proyecto: deadline, plan, computado y fila por
                      empleado (quien se pasa o queda por debajo).
                    </p>
                  </div>
                  {evalMode === 'project_month_health' ? (
                    <div className="space-y-2">
                      <Label>Condiciones (cualquiera dispara el aviso)</Label>
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
}
