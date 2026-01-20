import { useState, useMemo } from 'react';
import { useMarketing } from '@/contexts/MarketingContext';
import { useApp } from '@/contexts/AppContext';
import { BudgetMovement } from '@/types/marketing';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  History,
  Search,
  Filter,
  ArrowRight,
  ArrowDownLeft,
  RotateCcw,
  Download,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function MarketingAudit() {
  const { currentBudget, movements, categories, monthlyPlans } = useMarketing();
  const { employees } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterEmployee, setFilterEmployee] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Enrich movements with category and employee names
  const enrichedMovements = useMemo(() => {
    return movements.map(movement => {
      const fromPlan = monthlyPlans.find(p => p.id === movement.fromPlanId);
      const toPlan = monthlyPlans.find(p => p.id === movement.toPlanId);
      const fromCategory = fromPlan ? categories.find(c => c.id === fromPlan.categoryId) : null;
      const toCategory = toPlan ? categories.find(c => c.id === toPlan.categoryId) : null;
      const employee = employees.find(e => e.id === movement.createdBy);

      return {
        ...movement,
        fromCategoryName: fromCategory?.name || null,
        fromMonth: fromPlan?.month || null,
        toCategoryName: toCategory?.name || null,
        toMonth: toPlan?.month || null,
        employeeName: employee?.name || 'Usuario desconocido',
        employeeAvatar: employee?.avatarUrl,
      };
    });
  }, [movements, monthlyPlans, categories, employees]);

  // Filter movements
  const filteredMovements = useMemo(() => {
    return enrichedMovements.filter(movement => {
      // Search filter
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const matchesDescription = movement.description?.toLowerCase().includes(search);
        const matchesCategory = movement.fromCategoryName?.toLowerCase().includes(search) ||
          movement.toCategoryName?.toLowerCase().includes(search);
        const matchesEmployee = movement.employeeName.toLowerCase().includes(search);
        if (!matchesDescription && !matchesCategory && !matchesEmployee) {
          return false;
        }
      }

      // Type filter
      if (filterType !== 'all' && movement.type !== filterType) {
        return false;
      }

      // Employee filter
      if (filterEmployee !== 'all' && movement.createdBy !== filterEmployee) {
        return false;
      }

      // Category filter
      if (filterCategory !== 'all') {
        const fromPlan = monthlyPlans.find(p => p.id === movement.fromPlanId);
        const toPlan = monthlyPlans.find(p => p.id === movement.toPlanId);
        if (fromPlan?.categoryId !== filterCategory && toPlan?.categoryId !== filterCategory) {
          return false;
        }
      }

      return true;
    });
  }, [enrichedMovements, searchTerm, filterType, filterEmployee, filterCategory, monthlyPlans]);

  // Get unique employees who made movements
  const movementEmployees = useMemo(() => {
    const employeeIds = new Set(movements.map(m => m.createdBy));
    return employees.filter(e => employeeIds.has(e.id));
  }, [movements, employees]);

  const getTypeLabel = (type: BudgetMovement['type']) => {
    switch (type) {
      case 'initial_deposit':
        return { label: 'Inyeccion', color: 'bg-green-100 text-green-700' };
      case 'transfer':
        return { label: 'Transferencia', color: 'bg-blue-100 text-blue-700' };
      case 'correction':
        return { label: 'Correccion', color: 'bg-amber-100 text-amber-700' };
      default:
        return { label: type, color: 'bg-slate-100 text-slate-700' };
    }
  };

  const getTypeIcon = (type: BudgetMovement['type']) => {
    switch (type) {
      case 'initial_deposit':
        return <ArrowDownLeft className="h-4 w-4 text-green-600" />;
      case 'transfer':
        return <ArrowRight className="h-4 w-4 text-blue-600" />;
      case 'correction':
        return <RotateCcw className="h-4 w-4 text-amber-600" />;
      default:
        return null;
    }
  };

  const formatMonth = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return format(new Date(dateStr), 'MMM yyyy', { locale: es });
  };

  const exportToCSV = () => {
    const headers = ['Fecha', 'Tipo', 'Importe', 'Origen', 'Destino', 'Descripcion', 'Usuario'];
    const rows = filteredMovements.map(m => [
      format(new Date(m.createdAt), 'dd/MM/yyyy HH:mm'),
      getTypeLabel(m.type).label,
      m.amount.toFixed(2),
      m.fromCategoryName ? `${m.fromCategoryName} (${formatMonth(m.fromMonth)})` : 'Capital externo',
      m.toCategoryName ? `${m.toCategoryName} (${formatMonth(m.toMonth)})` : 'Retirada',
      m.description || '',
      m.employeeName,
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `movimientos_marketing_${currentBudget?.year || 'export'}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!currentBudget) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Selecciona un presupuesto para ver la auditoria de movimientos.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <History className="h-5 w-5" />
            Auditoria de Movimientos
          </h2>
          <p className="text-sm text-muted-foreground">
            Historial completo de transferencias y asignaciones - {currentBudget.year}
          </p>
        </div>
        <Button variant="outline" onClick={exportToCSV} className="gap-2">
          <Download className="h-4 w-4" />
          Exportar CSV
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="space-y-1">
              <Label className="text-xs">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Descripcion, categoria..."
                  className="pl-9"
                />
              </div>
            </div>

            {/* Type Filter */}
            <div className="space-y-1">
              <Label className="text-xs">Tipo</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  <SelectItem value="initial_deposit">Inyeccion de capital</SelectItem>
                  <SelectItem value="transfer">Transferencia</SelectItem>
                  <SelectItem value="correction">Correccion</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Employee Filter */}
            <div className="space-y-1">
              <Label className="text-xs">Usuario</Label>
              <Select value={filterEmployee} onValueChange={setFilterEmployee}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los usuarios" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los usuarios</SelectItem>
                  {movementEmployees.map(emp => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Category Filter */}
            <div className="space-y-1">
              <Label className="text-xs">Categoria</Label>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas las categorias" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categorias</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Movements Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>
            {filteredMovements.length} movimiento(s)
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[500px]">
            <Table>
              <TableHeader className="sticky top-0 bg-white z-10">
                <TableRow>
                  <TableHead className="w-[140px]">Fecha</TableHead>
                  <TableHead className="w-[120px]">Tipo</TableHead>
                  <TableHead className="w-[100px] text-right">Importe</TableHead>
                  <TableHead>Origen</TableHead>
                  <TableHead>Destino</TableHead>
                  <TableHead>Descripcion</TableHead>
                  <TableHead className="w-[150px]">Usuario</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMovements.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No se encontraron movimientos
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMovements.map((movement) => {
                    const typeInfo = getTypeLabel(movement.type);
                    return (
                      <TableRow key={movement.id}>
                        <TableCell className="font-mono text-sm">
                          {format(new Date(movement.createdAt), 'dd/MM/yy HH:mm')}
                        </TableCell>
                        <TableCell>
                          <Badge className={cn("gap-1", typeInfo.color)}>
                            {getTypeIcon(movement.type)}
                            {typeInfo.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {movement.amount.toLocaleString('es-ES')} EUR
                        </TableCell>
                        <TableCell>
                          {movement.fromCategoryName ? (
                            <div>
                              <span className="font-medium">{movement.fromCategoryName}</span>
                              <span className="text-xs text-muted-foreground ml-1">
                                ({formatMonth(movement.fromMonth)})
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground italic">Capital externo</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {movement.toCategoryName ? (
                            <div>
                              <span className="font-medium">{movement.toCategoryName}</span>
                              <span className="text-xs text-muted-foreground ml-1">
                                ({formatMonth(movement.toMonth)})
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground italic">Retirada</span>
                          )}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate" title={movement.description}>
                          {movement.description || '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={movement.employeeAvatar} />
                              <AvatarFallback className="text-xs">
                                {movement.employeeName.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm truncate">{movement.employeeName}</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
