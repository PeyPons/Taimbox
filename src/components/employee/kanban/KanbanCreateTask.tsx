import { useState } from 'react';
import { KanbanTaskType, KanbanTaskPriority, KanbanTaskStatus } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useApp } from '@/contexts/AppContext';
import { CreateKanbanTaskInput } from '@/hooks/useKanbanTasks';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface KanbanCreateTaskProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateTask: (input: CreateKanbanTaskInput) => Promise<unknown>;
  defaultStatus?: KanbanTaskStatus;
  currentMonth: Date;
}

const TASK_TYPES: { value: KanbanTaskType; label: string }[] = [
  { value: 'ROUTINE', label: 'Rutina' },
  { value: 'PROJECT', label: 'Proyecto' },
  { value: 'FIRE', label: 'Urgente' },
];

const PRIORITIES: { value: KanbanTaskPriority; label: string }[] = [
  { value: 'low', label: 'Baja' },
  { value: 'medium', label: 'Media' },
  { value: 'high', label: 'Alta' },
  { value: 'urgent', label: 'Urgente' },
];

const PLATFORMS = ['Google Ads', 'Meta Ads', 'TikTok Ads', 'LinkedIn Ads'];

export function KanbanCreateTask({ open, onOpenChange, onCreateTask, defaultStatus = 'backlog', currentMonth }: KanbanCreateTaskProps) {
  const { clients } = useApp();
  const [title, setTitle] = useState('');
  const [clientId, setClientId] = useState('');
  const [taskType, setTaskType] = useState<KanbanTaskType>('ROUTINE');
  const [priority, setPriority] = useState<KanbanTaskPriority>('medium');
  const [platform, setPlatform] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const activeClients = (clients || []).filter(c => c.name).sort((a, b) => a.name.localeCompare(b.name));

  const resetForm = () => {
    setTitle('');
    setClientId('');
    setTaskType('ROUTINE');
    setPriority('medium');
    setPlatform('');
    setDueDate('');
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error('El título es obligatorio');
      return;
    }
    if (!clientId) {
      toast.error('Selecciona un cliente');
      return;
    }

    setIsSaving(true);
    const today = new Date();
    const dayOfWeek = today.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset);

    await onCreateTask({
      title: title.trim(),
      clientId,
      taskType,
      status: defaultStatus,
      priority,
      platform: platform || undefined,
      dueDate: dueDate || undefined,
      weekStartDate: format(monday, 'yyyy-MM-dd'),
    });

    setIsSaving(false);
    resetForm();
    onOpenChange(false);
    toast.success('Tarea creada');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nueva tarea</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-sm">Título *</Label>
            <Input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Ej: Revisar search terms"
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm">Cliente *</Label>
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger><SelectValue placeholder="Seleccionar cliente..." /></SelectTrigger>
              <SelectContent>
                {activeClients.map(c => (
                  <SelectItem key={c.id} value={c.id}>
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                      {c.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm">Tipo</Label>
              <Select value={taskType} onValueChange={v => setTaskType(v as KanbanTaskType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TASK_TYPES.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm">Prioridad</Label>
              <Select value={priority} onValueChange={v => setPriority(v as KanbanTaskPriority)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map(p => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm">Plataforma</Label>
              <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value=" ">Sin plataforma</SelectItem>
                  {PLATFORMS.map(p => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm">Fecha límite</Label>
              <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => { resetForm(); onOpenChange(false); }} disabled={isSaving}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSaving}>
            {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            Crear tarea
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
