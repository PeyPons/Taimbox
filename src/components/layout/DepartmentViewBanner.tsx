import { useAgency } from '@/contexts/AgencyContext';
import { useDepartmentView } from '@/contexts/DepartmentViewContext';
import { normalizeDepartments } from '@/utils/departmentUtils';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { useAppTranslation } from '@/hooks/useAppTranslation';

export function DepartmentViewBanner() {
  const { currentAgency } = useAgency();
  const { selectedDepartmentId, clearDepartmentFilter } = useDepartmentView();
  const departments = normalizeDepartments(currentAgency?.settings?.departments);
  const { t } = useAppTranslation();

  if (!selectedDepartmentId || !departments.length) return null;

  const dept = departments.find(
    d => d.id === selectedDepartmentId || d.name === selectedDepartmentId
  );
  if (!dept) return null;

  return (
    <div
      className="text-xs sm:text-sm font-medium px-3 sm:px-4 py-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2 sm:gap-4 lg:pl-64"
      style={{
        backgroundColor: `${dept.color}22`,
        color: dept.color,
        borderBottom: `2px solid ${dept.color}66`,
      }}
    >
      <span className="min-w-0 leading-snug text-center sm:text-left">
        {t('layout.departmentBanner.viewing', 'Estás viendo la vista filtrada de:')} <strong>{dept.name}</strong>
        <span className="hidden sm:inline">. {t('layout.departmentBanner.hidden', 'El resto de datos están ocultos.')}</span>
      </span>
      <Button
        size="sm"
        variant="outline"
        className="h-8 sm:h-7 gap-1 border-current hover:bg-black/10 w-full sm:w-auto shrink-0"
        style={{ color: dept.color }}
        onClick={clearDepartmentFilter}
      >
        <X className="h-3.5 w-3.5" />
        {t('layout.departmentBanner.clear', 'Borrar filtro')}
      </Button>
    </div>
  );
}
