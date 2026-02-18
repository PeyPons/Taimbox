import { useAgency } from '@/contexts/AgencyContext';
import { useDepartmentView } from '@/contexts/DepartmentViewContext';
import { normalizeDepartments } from '@/utils/departmentUtils';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

export function DepartmentViewBanner() {
  const { currentAgency } = useAgency();
  const { selectedDepartmentId, clearDepartmentFilter } = useDepartmentView();
  const departments = normalizeDepartments(currentAgency?.settings?.departments);

  if (!selectedDepartmentId || !departments.length) return null;

  const dept = departments.find(
    d => d.id === selectedDepartmentId || d.name === selectedDepartmentId
  );
  if (!dept) return null;

  return (
    <div
      className="text-sm font-medium px-4 py-2 flex items-center justify-center gap-4 flex-wrap"
      style={{
        backgroundColor: `${dept.color}22`,
        color: dept.color,
        borderBottom: `2px solid ${dept.color}66`,
      }}
    >
      <span>
        Estás viendo la vista filtrada de: <strong>{dept.name}</strong>. El resto de datos están ocultos.
      </span>
      <Button
        size="sm"
        variant="outline"
        className="h-7 gap-1 border-current hover:bg-black/10"
        style={{ color: dept.color }}
        onClick={clearDepartmentFilter}
      >
        <X className="h-3.5 w-3.5" />
        Borrar filtro
      </Button>
    </div>
  );
}
