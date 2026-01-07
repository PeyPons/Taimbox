import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { GanttView } from '@/components/planner/GanttView';
import { Calendar } from 'lucide-react';

interface TimelineSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialViewDate?: Date;
}

export function TimelineSheet({ open, onOpenChange, initialViewDate }: TimelineSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className="w-full sm:max-w-[95vw] overflow-y-auto px-6 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-xl border-l shadow-2xl pt-10"
      >
        <SheetHeader className="pb-6 border-b mb-6">
          <SheetTitle className="text-2xl font-bold flex items-center gap-2">
            <Calendar className="h-6 w-6" />
            Timeline (Vista Gantt)
          </SheetTitle>
          <SheetDescription>
            Vista temporal de todas las tareas del equipo organizadas por proyecto
          </SheetDescription>
        </SheetHeader>
        <div className="h-[calc(100vh-12rem)] overflow-auto">
          <GanttView initialViewDate={initialViewDate} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
