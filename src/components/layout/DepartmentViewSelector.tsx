import { useAgency } from '@/contexts/AgencyContext';
import { useDepartmentView } from '@/contexts/DepartmentViewContext';
import { normalizeDepartments } from '@/utils/departmentUtils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Eye, ChevronDown, Check, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppTranslation } from '@/hooks/useAppTranslation';

interface DepartmentViewSelectorProps {
  /** En true, se muestra sin borde superior ni padding extra para integrar en una fila (ej. junto al nombre de la agencia) */
  inline?: boolean;
}

export function DepartmentViewSelector({ inline }: DepartmentViewSelectorProps) {
  const { currentAgency } = useAgency();
  const { selectedDepartmentId, setSelectedDepartmentId } = useDepartmentView();
  const departments = normalizeDepartments(currentAgency?.settings?.departments);
  const { t } = useAppTranslation();

  if (!departments.length) return null;

  const selectedDept = selectedDepartmentId
    ? departments.find(d => d.id === selectedDepartmentId || d.name === selectedDepartmentId)
    : null;

  return (
    <div className={cn(
      "shrink-0",
      !inline && "space-y-2 pt-2 border-t border-slate-800"
    )}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            title={t('layout.departmentSelector.byDepartment', 'Vista por departamento')}
            className={cn(
              "justify-between text-left h-auto hover:bg-slate-800 hover:text-white text-slate-300",
              inline ? "py-1 px-1.5 text-[11px] w-auto min-w-0" : "w-full py-1.5 px-2 text-xs"
            )}
          >
            <div className="flex items-center gap-1 min-w-0 flex-1">
              <Eye className={cn("shrink-0 text-slate-400", inline ? "h-3 w-3" : "h-3.5 w-3.5")} />
              <span className={cn("truncate font-medium", inline ? "text-[11px]" : "text-xs")}>
                {selectedDept ? selectedDept.name : t('layout.departmentSelector.globalView', 'Vista Global')}
              </span>
              {selectedDept && (
                <span
                  className={cn("rounded-full shrink-0 border border-slate-600", inline ? "ml-1 h-1.5 w-1.5" : "ml-1.5 h-2 w-2")}
                  style={{ backgroundColor: selectedDept.color }}
                />
              )}
            </div>
            <ChevronDown className={cn("shrink-0 text-slate-400 ml-0.5", inline ? "h-2.5 w-2.5" : "h-3 w-3 ml-1")} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56 bg-slate-800 border-slate-700">
          <DropdownMenuLabel className="text-slate-300 text-xs">{t('layout.departmentSelector.byDepartment', 'Vista por departamento')}</DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-slate-700" />
          <DropdownMenuItem
            onClick={() => setSelectedDepartmentId(null)}
            className={cn(
              "cursor-pointer text-slate-200 hover:bg-slate-700 hover:text-white text-xs",
              !selectedDepartmentId && "bg-slate-700"
            )}
          >
            <Globe className="h-3.5 w-3.5 mr-2 text-slate-400" />
            <span>{t('layout.departmentSelector.globalView', 'Vista Global')}</span>
            {!selectedDepartmentId && <Check className="h-3.5 w-3.5 ml-auto" />}
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-slate-700" />
          {departments.map((dept) => (
            <DropdownMenuItem
              key={dept.id}
              onClick={() => setSelectedDepartmentId(dept.id)}
              className={cn(
                "cursor-pointer text-slate-200 hover:bg-slate-700 hover:text-white text-xs",
                selectedDepartmentId === dept.id && "bg-slate-700"
              )}
            >
              <span
                className="h-3 w-3 rounded-full shrink-0 mr-2 border border-slate-600"
                style={{ backgroundColor: dept.color }}
              />
              <span className="truncate">{dept.name}</span>
              {selectedDepartmentId === dept.id && <Check className="h-3.5 w-3.5 ml-auto shrink-0" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
