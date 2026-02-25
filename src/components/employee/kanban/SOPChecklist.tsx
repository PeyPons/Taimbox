import { SOPItem } from '@/types';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SOPChecklistProps {
  items: SOPItem[];
  onChange: (items: SOPItem[]) => void;
  readOnly?: boolean;
}

export function SOPChecklist({ items, onChange, readOnly = false }: SOPChecklistProps) {
  const completed = items.filter(i => i.isCompleted).length;
  const total = items.length;
  const progress = total > 0 ? (completed / total) * 100 : 0;
  const allCompleted = completed === total && total > 0;

  const handleToggle = (itemId: string) => {
    if (readOnly) return;
    onChange(items.map(item =>
      item.id === itemId ? { ...item, isCompleted: !item.isCompleted } : item
    ));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
          <CheckCircle2 className="h-4 w-4 text-primary" />
          Protocolo de Lanzamiento
        </h4>
        <span className={cn(
          "text-xs font-mono font-medium",
          allCompleted ? "text-emerald-600" : "text-slate-500"
        )}>
          {completed}/{total}
        </span>
      </div>

      <Progress value={progress} className="h-2" />

      <div className="space-y-2">
        {items.map(item => (
          <div
            key={item.id}
            className={cn(
              "flex items-start gap-3 rounded-md p-2.5 transition-colors",
              item.isCompleted ? "bg-emerald-50/50" : "bg-white border border-slate-100",
              !readOnly && "cursor-pointer hover:bg-slate-50"
            )}
            onClick={() => handleToggle(item.id)}
          >
            <Checkbox
              checked={item.isCompleted}
              disabled={readOnly}
              className="mt-0.5"
              onCheckedChange={() => handleToggle(item.id)}
            />
            <Label className={cn(
              "text-sm cursor-pointer flex-1",
              item.isCompleted ? "text-slate-400 line-through" : "text-slate-700"
            )}>
              {item.text}
            </Label>
          </div>
        ))}
      </div>

      {allCompleted && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-md p-2.5 text-xs text-emerald-700 text-center font-medium">
          Todos los pasos completados
        </div>
      )}
    </div>
  );
}
