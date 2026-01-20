import { useState } from 'react';
import { useMarketing } from '@/contexts/MarketingContext';
import { MarketingCategory } from '@/types/marketing';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Plus,
  ChevronRight,
  ChevronDown,
  Trash2,
  FolderTree,
  FolderPlus,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function MarketingSetup() {
  const { currentBudget, categories, createCategory, deleteCategory, getCategoryTree } = useMarketing();

  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [parentForNewCategory, setParentForNewCategory] = useState<string | null>(null);
  const [parentName, setParentName] = useState<string>('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

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

  const openCreateDialog = (parentId: string | null = null, parentCategoryName: string = '') => {
    setParentForNewCategory(parentId);
    setParentName(parentCategoryName);
    setNewCategoryName('');
    setIsCreateDialogOpen(true);
  };

  const handleCreate = async () => {
    if (!currentBudget || !newCategoryName.trim()) return;

    setIsCreating(true);
    try {
      await createCategory({
        budgetId: currentBudget.id,
        parentId: parentForNewCategory || undefined,
        name: newCategoryName.trim(),
      });
      setIsCreateDialogOpen(false);
      setNewCategoryName('');

      // Auto-expand parent if creating a child
      if (parentForNewCategory) {
        setExpandedCategories(prev => new Set([...prev, parentForNewCategory]));
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (categoryId: string) => {
    await deleteCategory(categoryId);
    setDeleteConfirm(null);
  };

  const renderCategory = (category: MarketingCategory, level: number = 0) => {
    const hasChildren = category.children && category.children.length > 0;
    const isExpanded = expandedCategories.has(category.id);

    return (
      <div key={category.id} className={cn("border-b last:border-b-0", level > 0 && "ml-6 border-l pl-4")}>
        <div className={cn(
          "flex items-center gap-2 py-3 px-4 hover:bg-slate-50 group",
          level === 0 && "bg-emerald-50/50"
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

          {/* Category Name */}
          <div className="flex-1 min-w-0">
            <span className={cn(
              "font-medium truncate",
              level === 0 ? "text-emerald-900" : "text-slate-700"
            )}>
              {category.name}
            </span>
            {hasChildren && (
              <span className="text-xs text-slate-400 ml-2">
                ({category.children!.length} subcategorías)
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openCreateDialog(category.id, category.name)}
              title="Añadir subcategoría"
              className="h-8 px-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
            >
              <FolderPlus className="h-4 w-4 mr-1" />
              Subcategoría
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDeleteConfirm(category.id)}
              className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
              title="Eliminar"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div>
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
          Selecciona un presupuesto para configurar las categorías.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Estructura de Categorías</h2>
          <p className="text-sm text-muted-foreground">
            Organiza las partidas presupuestarias (ej: SEM, Social, Display)
          </p>
        </div>
        <Button onClick={() => openCreateDialog(null)} className="gap-2">
          <Plus className="h-4 w-4" />
          Nueva Categoría
        </Button>
      </div>

      {/* Category Tree */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <FolderTree className="h-5 w-5 text-emerald-600" />
            <CardTitle className="text-base">Árbol de Categorías</CardTitle>
          </div>
          <CardDescription>
            {categories.length} categoría(s) configuradas para {currentBudget.year}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {categoryTree.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <FolderTree className="h-12 w-12 mx-auto mb-4 text-slate-300" />
              <p>No hay categorías configuradas.</p>
              <p className="text-sm mt-2">Crea categorías como SEM, Social, Display, etc.</p>
              <Button
                onClick={() => openCreateDialog(null)}
                className="mt-4 gap-2"
                variant="outline"
              >
                <Plus className="h-4 w-4" />
                Crear primera categoría
              </Button>
            </div>
          ) : (
            <div className="divide-y">
              {categoryTree.map(category => renderCategory(category))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Simple Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>
              {parentForNewCategory ? 'Nueva Subcategoría' : 'Nueva Categoría'}
            </DialogTitle>
            <DialogDescription>
              {parentForNewCategory
                ? `Dentro de "${parentName}"`
                : 'Crea una categoría principal (ej: SEM, Social Ads, Display)'}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Label htmlFor="name">Nombre de la categoría</Label>
            <Input
              id="name"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder={parentForNewCategory ? "Ej: Google Ads, Colombia..." : "Ej: SEM, Social Ads..."}
              className="mt-2"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && !isCreating && handleCreate()}
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
              disabled={isCreating}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!newCategoryName.trim() || isCreating}
            >
              {isCreating ? 'Creando...' : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Categoría</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará la categoría y todas sus subcategorías.
              Los datos de presupuesto asociados también se eliminarán.
              Esta acción no se puede deshacer.
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
