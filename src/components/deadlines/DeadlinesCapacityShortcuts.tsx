/**
 * Accesos rápidos desde Deadlines para vacaciones/ausencias y festivos del equipo.
 * Evita usar «Otras asignaciones» para reducir disponibilidad.
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AbsencesSheet } from '@/components/team/AbsencesSheet';
import { TeamEventManager } from '@/components/team/TeamEventManager';
import { CalendarOff, Palmtree } from 'lucide-react';
import { cn } from '@/lib/utils';

const shortcutBtnClass =
  'w-full min-w-0 h-auto min-h-8 py-1.5 px-2 whitespace-normal justify-start text-left gap-1.5 [&_svg]:size-3.5';

export function DeadlinesCapacityShortcuts({
  employees,
}: {
  employees: { id: string; name: string; first_name?: string; avatarUrl?: string }[];
}) {
  const [pickEmployeeOpen, setPickEmployeeOpen] = useState(false);
  const [absenceSheetOpen, setAbsenceSheetOpen] = useState(false);
  const [eventsOpen, setEventsOpen] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);

  const openAbsenceFor = (employeeId: string) => {
    setSelectedEmployeeId(employeeId);
    setPickEmployeeOpen(false);
    setAbsenceSheetOpen(true);
  };

  return (
    <>
      <div
        className="rounded-lg border border-dashed border-amber-200/90 bg-amber-50/50 p-2.5 space-y-2 mt-2.5 min-w-0 overflow-hidden"
        data-tour="deadlines-capacity-shortcuts"
      >
        <p className="text-[10px] text-slate-600 leading-snug">
          <span className="font-medium text-slate-800">¿Vacaciones o festivo?</span> No van en «Otras
          asignaciones»: aquí se <span className="font-medium">resta</span> disponibilidad del mes, no se suma carga
          de proyecto.
        </p>
        <div className="flex flex-col gap-1.5 min-w-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn(shortcutBtnClass, 'text-[11px] bg-white hover:bg-emerald-50/80 border-slate-200')}
            onClick={() => setPickEmployeeOpen(true)}
            disabled={employees.length === 0}
            title="Vacaciones o ausencia"
          >
            <Palmtree className="shrink-0 text-emerald-600" />
            <span className="flex-1 min-w-0 leading-snug">Vacaciones o ausencia</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn(shortcutBtnClass, 'text-[11px] bg-white hover:bg-orange-50/80 border-slate-200')}
            onClick={() => setEventsOpen(true)}
            title="Festivo o evento del equipo"
          >
            <CalendarOff className="shrink-0 text-orange-500" />
            <span className="flex-1 min-w-0 leading-snug">Festivo o evento del equipo</span>
          </Button>
        </div>
      </div>

      <Dialog open={pickEmployeeOpen} onOpenChange={setPickEmployeeOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>¿De quién es la ausencia?</DialogTitle>
            <DialogDescription>
              Vacaciones, baja o permiso. Se aplicará al mes que estás viendo en Deadlines.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[min(50vh,360px)] overflow-y-auto space-y-0.5 py-1 -mx-1">
            {employees.map((emp) => {
              const label = emp.first_name?.trim() || emp.name;
              return (
                <button
                  key={emp.id}
                  type="button"
                  className="w-full flex items-center gap-2.5 p-2.5 rounded-lg hover:bg-slate-50 text-left transition-colors"
                  onClick={() => openAbsenceFor(emp.id)}
                >
                  <Avatar className="h-8 w-8 border border-slate-200 shrink-0">
                    <AvatarImage src={emp.avatarUrl} alt={label} />
                    <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                      {label.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium text-slate-800 truncate">{label}</span>
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={eventsOpen} onOpenChange={setEventsOpen}>
        <DialogContent className="max-w-2xl max-h-[min(90vh,720px)] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Festivo o evento del equipo</DialogTitle>
            <DialogDescription>
              Días que reducen la capacidad de varias personas (festivos, formación, team building…).
            </DialogDescription>
          </DialogHeader>
          <TeamEventManager />
        </DialogContent>
      </Dialog>

      {selectedEmployeeId && (
        <AbsencesSheet
          open={absenceSheetOpen}
          onOpenChange={(open) => {
            setAbsenceSheetOpen(open);
            if (!open) setSelectedEmployeeId(null);
          }}
          employeeId={selectedEmployeeId}
        />
      )}
    </>
  );
}
