import { useState } from 'react';
import { useMarketing } from '@/contexts/MarketingContext';
import { useApp } from '@/contexts/AppContext';
import { MarketingCategory } from '@/types/marketing';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Plus,
  ChevronRight,
  ChevronDown,
  Pencil,
  Trash2,
  FolderTree,
  Users,
  Target,
  GripVertical,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CategoryFormData {
  name: string;
  kpiName: string;
  kpiTargetCost: string;
  allowedEmployees: string[];
}

export function MarketingSetup() {
  const { currentBudget, categories, createCategory, updateCategory, deleteCategory, getCategoryTree } = useMarketing();
  const { employees } = useApp();

  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [parentForNewCategory, setParentForNewCategory] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<MarketingCategory | null>(null);

  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    kpiName: '',
    kpiTargetCost: '',
    allowedEmployees: [],
  });

  const activeEmployees = employees.filter(e => e.isActive);
  const categoryTree = getCategoryTree();

  const toggleExpanded = (categoryId: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  const openCreateDialog = (parentId: string | null = null) => {
    setParentForNewCategory(parentId);
    setFormData({
      name: '',
      kpiName: '',
      kpiTargetCost: '',
      allowedEmployees: [],
    });
    setIsCreateDialogOpen(true);
  };

  const openEditDialog = (category: MarketingCategory) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      kpiName: category.kpiName || '',
      kpiTargetCost: category.kpiTargetCost?.toString() || '',
      allowedEmployees: category.allowedEmployees || [],
    });
    setIsEditDialogOpen(true);
  };

  const handleCreate = async () => {
    if (!currentBudget || !formData.name.trim()) return;

    await createCategory({
      budgetId: currentBudget.id,
      parentId: parentForNewCategory || undefined,
      name: formData.name.trim(),
      kpiName: formData.kpiName.trim() || undefined,
      kpiTargetCost: formData.kpiTargetCost ? parseFloat(formData.kpiTargetCost) : undefined,
      allowedEmployees: formData.allowedEmployees,
    });

    setIsCreateDialogOpen(false);
  };

  const handleUpdate = async () => {
    if (!editingCategory || !formData.name.trim()) return;

    await updateCategory(editingCategory.id, {
      name: formData.name.trim(),
      kpiName: formData.kpiName.trim() || undefined,
      kpiTargetCost: formData.kpiTargetCost ? parseFloat(formData.kpiTargetCost) : undefined,
      allowedEmployees: formData.allowedEmployees,
    });

    setIsEditDialogOpen(false);
    setEditingCategory(null);
  };

  const handleDelete = async (categoryId: string) => {
    await deleteCategory(categoryId);
    setDeleteConfirm(null);
  };

  const toggleEmployee = (employeeId: string) => {
    setFormData(prev => ({
      ...prev,
      allowedEmployees: prev.allowedEmployees.includes(employeeId)
        ? prev.allowedEmployees.filter(id => id !== employeeId)
        : [...prev.allowedEmployees, employeeId],
    }));
  };

  const renderCategory = (category: MarketingCategory, level: number = 0) => {
    const hasChildren = category.children && category.children.length > 0;
    const isExpanded = expandedCategories.has(category.id);

    return (
      <div key={category.id} className={cn("border-b last:border-b-0", level > 0 && "ml-6")}>
        <div className={cn(
          "flex items-center gap-2 py-3 px-4 hover:bg-slate-50 group",
          level === 0 && "bg-slate-50/50"
        )}>
          {/* Expand/Collapse */}
          <button
            onClick={() => toggleExpanded(category.id)}
            className={cn(
              "p-1 rounded hover:bg-slate-200 transition-colors",
              !hasChildren && "invisible"
            )}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-slate-500" />
            ) : (
              <ChevronRight className="h-4 w-4 text-slate-500" />
            )}
          </button>

          {/* Drag Handle (visual only for now) */}
          <GripVertical className="h-4 w-4 text-slate-300 cursor-grab" />

          {/* Category Name */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className={cn(
                "font-medium truncate",
                level === 0 ? "text-slate-900" : "text-slate-700"
              )}>
                {category.name}
              </span>
              {category.kpiName && (
                <Badge variant="outline" className="text-xs">
                  <Target className="h-3 w-3 mr-1" />
                  {category.kpiName}
                </Badge>
              )}
            </div>
            {category.allowedEmployees && category.allowedEmployees.length > 0 && (
              <div className="flex items-center gap-1 mt-1">
                <Users className="h-3 w-3 text-slate-400" />
                <span className="text-xs text-slate-500">
                  {category.allowedEmployees.length} usuario(s)
                </span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openCreateDialog(category.id)}
              title="Agregar subcategoria"
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openEditDialog(category)}
              title="Editar"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDeleteConfirm(category.id)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
              title="Eliminar"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div className="border-l-2 border-slate-200 ml-4">
            {category.children!.map(child => renderCategory(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (!currentBudget) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Selecciona un presupuesto para configurar las categorias.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Estructura de Categorias</h2>
          <p className="text-sm text-muted-foreground">
            Organiza las partidas presupuestarias en una jerarquia
          </p>
        </div>
        <Button onClick={() => openCreateDialog(null)} className="gap-2">
          <Plus className="h-4 w-4" />
          Nueva Categoria Principal
        </Button>
      </div>

      {/* Category Tree */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <FolderTree className="h-5 w-5 text-slate-500" />
            <CardTitle className="text-base">Arbol de Categorias</CardTitle>
          </div>
          <CardDescription>
            {categories.length} categoria(s) configuradas para {currentBudget.year}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {categoryTree.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <FolderTree className="h-12 w-12 mx-auto mb-4 text-slate-300" />
              <p>No hay categorias configuradas.</p>
              <p className="text-sm">Crea categorias como SEM, Social, Display, etc.</p>
            </div>
          ) : (
            <div className="divide-y">
              {categoryTree.map(category => renderCategory(category))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {parentForNewCategory ? 'Nueva Subcategoria' : 'Nueva Categoria Principal'}
            </DialogTitle>
            <DialogDescription>
              {parentForNewCategory
                ? 'Crea una subcategoria dentro de la categoria seleccionada.'
                : 'Crea una categoria principal como SEM, Social Ads, Display, etc.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ej: Campana Colombia"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="kpiName">KPI Principal</Label>
              <Input
                id="kpiName"
                value={formData.kpiName}
                onChange={(e) => setFormData(prev => ({ ...prev, kpiName: e.target.value }))}
                placeholder="Ej: Leads, Registros, Ventas"
              />
              <p className="text-xs text-muted-foreground">
                El indicador que se medira para esta partida
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="kpiTargetCost">Coste Objetivo por KPI (EUR)</Label>
              <Input
                id="kpiTargetCost"
                type="number"
                step="0.01"
                value={formData.kpiTargetCost}
                onChange={(e) => setFormData(prev => ({ ...prev, kpiTargetCost: e.target.value }))}
                placeholder="Ej: 15.00 (CPL objetivo)"
              />
            </div>

            <div className="space-y-2">
              <Label>Usuarios con Acceso</Label>
              <p className="text-xs text-muted-foreground mb-2">
                Si no seleccionas ninguno, solo los administradores veran esta categoria
              </p>
              <div className="max-h-40 overflow-y-auto border rounded-md p-2 space-y-2">
                {activeEmployees.map(employee => (
                  <div key={employee.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`emp-${employee.id}`}
                      checked={formData.allowedEmployees.includes(employee.id)}
                      onCheckedChange={() => toggleEmployee(employee.id)}
                    />
                    <Label htmlFor={`emp-${employee.id}`} className="text-sm font-normal cursor-pointer">
                      {employee.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={!formData.name.trim()}>
              Crear Categoria
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Categoria</DialogTitle>
            <DialogDescription>
              Modifica la configuracion de esta categoria.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nombre *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-kpiName">KPI Principal</Label>
              <Input
                id="edit-kpiName"
                value={formData.kpiName}
                onChange={(e) => setFormData(prev => ({ ...prev, kpiName: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-kpiTargetCost">Coste Objetivo por KPI (EUR)</Label>
              <Input
                id="edit-kpiTargetCost"
                type="number"
                step="0.01"
                value={formData.kpiTargetCost}
                onChange={(e) => setFormData(prev => ({ ...prev, kpiTargetCost: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Usuarios con Acceso</Label>
              <div className="max-h-40 overflow-y-auto border rounded-md p-2 space-y-2">
                {activeEmployees.map(employee => (
                  <div key={employee.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`edit-emp-${employee.id}`}
                      checked={formData.allowedEmployees.includes(employee.id)}
                      onCheckedChange={() => toggleEmployee(employee.id)}
                    />
                    <Label htmlFor={`edit-emp-${employee.id}`} className="text-sm font-normal cursor-pointer">
                      {employee.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdate} disabled={!formData.name.trim()}>
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Categoria</AlertDialogTitle>
            <AlertDialogDescription>
              Esta accion eliminara la categoria y todas sus subcategorias.
              Los movimientos y gastos asociados tambien se eliminaran.
              Esta accion no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
              className="bg-red-600 hover:bg-red-700"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
