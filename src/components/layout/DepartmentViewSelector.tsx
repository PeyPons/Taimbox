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

export function DepartmentViewSelector() {
  const { currentAgency } = useAgency();
  const { selectedDepartmentId, setSelectedDepartmentId } = useDepartmentView();
  const departments = normalizeDepartments(currentAgency?.settings?.departments);

  if (!departments.length) return null;

  const selectedDept = selectedDepartmentId
    ? departments.find(d => d.id === selectedDepartmentId || d.name === selectedDepartmentId)
    : null;

  return (
    <div className="space-y-2 pt-2 border-t border-slate-800">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-between text-left h-auto py-1.5 px-2 hover:bg-slate-800 text-slate-300 text-xs"
          >
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              <Eye className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              <span className="truncate text-xs font-medium">
                {selectedDept ? selectedDept.name : 'Vista Global'}
              </span>
              {selectedDept && (
                <span
                  className="ml-1.5 h-2 w-2 rounded-full shrink-0 border border-slate-600"
                  style={{ backgroundColor: selectedDept.color }}
                />
              )}
            </div>
            <ChevronDown className="h-3 w-3 shrink-0 text-slate-400 ml-1" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56 bg-slate-800 border-slate-700">
          <DropdownMenuLabel className="text-slate-300 text-xs">Vista por departamento</DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-slate-700" />
          <DropdownMenuItem
            onClick={() => setSelectedDepartmentId(null)}
            className={cn(
              "cursor-pointer text-slate-200 hover:bg-slate-700 hover:text-white text-xs",
              !selectedDepartmentId && "bg-slate-700"
            )}
          >
            <Globe className="h-3.5 w-3.5 mr-2 text-slate-400" />
            <span>Vista Global</span>
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
