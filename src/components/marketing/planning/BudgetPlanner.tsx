import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useMarketing } from '@/contexts/MarketingContext';
import { MarketingCategory } from '@/types/marketing';
import { format, addMonths, startOfYear } from 'date-fns';
import { es } from 'date-fns/locale';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    ChevronRight,
    ChevronDown,
    Plus,
    MoreHorizontal,
    Pencil,
    Trash2,
    FolderPlus,
    AlertTriangle,
    Search,
    CheckCircle2,
    XCircle,
    Eye,
    EyeOff,
    Download,
    Filter,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { TransferModal } from '../TransferModal';
import { ExpensesModal } from '../ExpensesModal';
import { PlanDetailsDialog } from './PlanDetailsDialog';

interface MonthData {
    date: Date;
    key: string;
    label: string;
    fullLabel: string;
}

interface QuarterData {
    quarter: string; // Q1, Q2, Q3, Q4
    months: MonthData[];
    label: string;
}

type ViewMode = 'monthly' | 'quarterly' | 'quarterly-expanded' | 'current-month' | 'annual';

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(amount);
};

export function BudgetPlanner() {
    const {
        currentBudget,
        categories,
        monthlyPlans,
        getCategoryTree,
        getMonthlyPlanForCategory,
        createCategory,
        updateCategory,
        deleteCategory,
        getRealSpentForPlan,
        getExpensesForPlan,
        updatePlanBudget,
        getOrCreateMonthlyPlan,
    } = useMarketing();

    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
    const [newCategoryName, setNewCategoryName] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [quickAddParentId, setQuickAddParentId] = useState<string | null>(null);

    const [transferModal, setTransferModal] = useState<{
        open: boolean;
        fromPlanId?: string;
        categoryId?: string;
        month?: string;
    }>({ open: false });

    const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: string | null; name: string }>({
        open: false, id: null, name: ''
    });

    const [detailsModal, setDetailsModal] = useState<{
        open: boolean;
        categoryId?: string;
        categoryName: string;
        month?: string;
    }>({ open: false, categoryName: '' });

    // View state
    const [viewMode, setViewMode] = useState<ViewMode>('quarterly-expanded');
    const [searchTerm, setSearchTerm] = useState('');
    const [hideEmpty, setHideEmpty] = useState(false);

    // Selected Quarter for filtering (null = current/all depending on view)
    const [selectedQuarter, setSelectedQuarter] = useState<number | null>(null);

    // Generate months and quarters (Logic from MarketingMatrix)
    const months: MonthData[] = useMemo(() => {
        if (!currentBudget) return [];
        const yearStart = startOfYear(new Date(currentBudget.year, 0, 1));
        return Array.from({ length: 12 }, (_, i) => {
            const date = addMonths(yearStart, i);
            return {
                date,
                key: format(date, 'yyyy-MM-dd'),
                label: format(date, 'MMM', { locale: es }),
                fullLabel: format(date, 'MMMM yyyy', { locale: es }),
            };
        });
    }, [currentBudget]);

    const allQuarters: QuarterData[] = useMemo(() => {
        if (months.length === 0) return [];
        return [
            { quarter: 'Q1', label: 'Ene - Mar', months: months.slice(0, 3) },
            { quarter: 'Q2', label: 'Abr - Jun', months: months.slice(3, 6) },
            { quarter: 'Q3', label: 'Jul - Sep', months: months.slice(6, 9) },
            { quarter: 'Q4', label: 'Oct - Dic', months: months.slice(9, 12) },
        ];
    }, [months]);

    const currentQuarter = useMemo(() => {
        const month = new Date().getMonth();
        return Math.floor(month / 3) + 1;
    }, []);

    const displayQuarter = useMemo(() => {
        return selectedQuarter !== null ? selectedQuarter : currentQuarter;
    }, [selectedQuarter, currentQuarter]);

    const visibleQuarters = useMemo(() => {
        if (viewMode === 'quarterly' || viewMode === 'quarterly-expanded') {
            return allQuarters.filter(q => parseInt(q.quarter.substring(1)) === displayQuarter);
        }
        return allQuarters;
    }, [allQuarters, displayQuarter, viewMode]);


    const categoryTree = getCategoryTree();

    const filteredTree = useMemo(() => {
        if (!hideEmpty) return categoryTree;

        const hasBudgetOrExpenses = (cat: MarketingCategory): boolean => {
            // Check if this category has any plan with budget or manual/real data
            // Since we don't have easy access to all plans here without iterating context's monthlyPlans,
            // we rely on the implementation.
            // A simpler approach for "hide empty" is: has children with data OR has own data.
            // For own data, we check if there are any plans for this category with non-zero values.
            const catPlans = monthlyPlans.filter(p => p.categoryId === cat.id);
            const hasOwnData = catPlans.some(p => p.budgetAllocated > 0 || p.realSpent > 0);

            if (hasOwnData) return true;
            if (cat.children && cat.children.length > 0) {
                return cat.children.some(child => hasBudgetOrExpenses(child));
            }
            return false;
        };

        const filterRecursive = (cats: MarketingCategory[]): MarketingCategory[] => {
            return cats.filter(cat => hasBudgetOrExpenses(cat)).map(cat => ({
                ...cat,
                children: cat.children ? filterRecursive(cat.children) : []
            }));
        };

        return filterRecursive(categoryTree);
    }, [categoryTree, hideEmpty, monthlyPlans]);

    // Initial Expansion
    const hasInitializedRef = useRef(false);
    useEffect(() => {
        if (categoryTree.length > 0 && !hasInitializedRef.current) {
            hasInitializedRef.current = true;
            const allIds = new Set<string>();
            const collectIds = (cats: MarketingCategory[]) => {
                cats.forEach(c => {
                    allIds.add(c.id); // Expand everything by default for better visibility
                    if (c.children) collectIds(c.children);
                });
            };
            collectIds(categoryTree);
            setExpandedCategories(allIds);
        }
    }, [categoryTree]);

    const toggleExpanded = (categoryId: string) => {
        setExpandedCategories(prev => {
            const next = new Set(prev);
            if (next.has(categoryId)) next.delete(categoryId);
            else next.add(categoryId);
            return next;
        });
    };

    // Helper Logic (reused/simplified)
    const getSmartProjectedForPlan = useCallback((planId: string) => {
        const realSpent = getRealSpentForPlan(planId);
        if (realSpent > 0) return realSpent;
        const estimatedExpenses = getExpensesForPlan(planId).filter(e => e.isEstimated);
        if (estimatedExpenses.length === 0) return 0;
        const latest = estimatedExpenses.reduce((latest, current) => {
            const latestDate = latest.updatedAt || latest.createdAt || '';
            const currentDate = current.updatedAt || current.createdAt || '';
            return currentDate > latestDate ? current : latest;
        });
        return latest.amount;
    }, [getRealSpentForPlan, getExpensesForPlan]);


    const getCategoryMonthlyTotal = useCallback((categoryId: string, month: string) => {
        const directChildren = categories.filter(c => c.parentId === categoryId);
        if (directChildren.length === 0) {
            const plan = getMonthlyPlanForCategory(categoryId, month);
            return plan?.budgetAllocated || 0;
        }
        return directChildren.reduce((sum, child) => {
            return sum + getCategoryMonthlyTotal(child.id, month);
        }, 0);
    }, [categories, getMonthlyPlanForCategory]);

    const onOpenDetails = (categoryId: string, month: string, categoryName: string) => {
        setDetailsModal({ open: true, categoryId, month, categoryName });
    };

    return (
        <Card className="border shadow-sm">
            {/* Planner Toolbar */}
            <div className="p-4 border-b flex flex-col sm:flex-row gap-4 items-center justify-between bg-slate-50/50 rounded-t-lg">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative w-full sm:w-[280px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Buscar categoría..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 h-9"
                        />
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setHideEmpty(!hideEmpty)}
                        className={cn("h-9 gap-2", hideEmpty && "bg-slate-100 border-slate-300")}
                    >
                        {hideEmpty ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        <span className="hidden sm:inline">{hideEmpty ? 'Mostrar Todo' : 'Ocultar Vacíos'}</span>
                    </Button>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <div className="flex items-center border rounded-md bg-white">
                        <Button
                            variant="ghost"
                            size="sm"
                            className={cn("h-8 rounded-none border-r px-3", displayQuarter === 1 && "bg-slate-100 font-medium")}
                            onClick={() => setSelectedQuarter(1)}
                        >
                            Q1
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className={cn("h-8 rounded-none border-r px-3", displayQuarter === 2 && "bg-slate-100 font-medium")}
                            onClick={() => setSelectedQuarter(2)}
                        >
                            Q2
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className={cn("h-8 rounded-none border-r px-3", displayQuarter === 3 && "bg-slate-100 font-medium")}
                            onClick={() => setSelectedQuarter(3)}
                        >
                            Q3
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className={cn("h-8 rounded-none px-3", displayQuarter === 4 && "bg-slate-100 font-medium")}
                            onClick={() => setSelectedQuarter(4)}
                        >
                            Q4
                        </Button>
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-9 gap-2">
                                <Filter className="h-4 w-4" />
                                <span>Vista</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setViewMode('quarterly-expanded')}>
                                Trimestral (Expandido)
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setViewMode('annual')}>
                                Anual Completo
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Button variant="default" size="sm" className="h-9 gap-2" onClick={() => {
                        setQuickAddParentId(null);
                        setNewCategoryName('');
                        setIsCreating(true);
                    }}>
                        <Plus className="h-4 w-4" />
                        Nueva Categoría
                    </Button>
                </div>
            </div>

            {/* Quick Add Form (if visible) */}
            {isCreating && (
                <div className="p-4 bg-blue-50/50 border-b flex items-center gap-2 animate-in slide-in-from-top-2">
                    <Input
                        placeholder="Nombre de la nueva partida..."
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        className="max-w-md h-9"
                        autoFocus
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                if (newCategoryName.trim()) {
                                    createCategory({
                                        budgetId: currentBudget!.id,
                                        parentId: quickAddParentId || undefined,
                                        name: newCategoryName.trim()
                                    });
                                    setNewCategoryName('');
                                    setIsCreating(false);
                                }
                            } else if (e.key === 'Escape') {
                                setIsCreating(false);
                            }
                        }}
                    />
                    <Button size="sm" onClick={() => {
                        if (newCategoryName.trim()) {
                            createCategory({
                                budgetId: currentBudget!.id,
                                parentId: quickAddParentId || undefined,
                                name: newCategoryName.trim()
                            });
                            setNewCategoryName('');
                            setIsCreating(false);
                        }
                    }}>
                        Guardar
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setIsCreating(false)}>
                        Cancelar
                    </Button>
                </div>
            )}

            {/* Main Grid Content */}
            <CardContent className="p-0">
                <ScrollArea className="h-[calc(100vh-320px)] min-h-[500px]">
                    <div className="min-w-[1200px]">
                        {/* Header Row */}
                        <div className="flex border-b bg-slate-50 sticky top-0 z-20 shadow-sm text-xs font-medium text-slate-500 uppercase tracking-wider">
                            <div className="w-[300px] p-3 pl-6 border-r sticky left-0 bg-slate-50 z-30">
                                Categoría / Partida
                            </div>
                            <div className="w-[100px] p-3 text-right border-r">Asignado</div>
                            <div className="w-[100px] p-3 text-right border-r">Gastado</div>
                            <div className="w-[100px] p-3 text-right border-r">Disponible</div>

                            {visibleQuarters.map(quarter => (
                                <div key={quarter.quarter} className="flex-1 flex border-r last:border-r-0">
                                    {quarter.months.map(month => (
                                        <div key={month.key} className="flex-1 min-w-[100px] border-r last:border-r-0">
                                            <div className="p-2 text-center border-b bg-white/50">{month.label}</div>
                                            <div className="flex text-[10px] text-slate-400">
                                                <div className="flex-1 text-center py-1 border-r">Plan</div>
                                                <div className="flex-1 text-center py-1">Real</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>

                        {/* Rows */}
                        {filteredTree.map(category => (
                            <CategoryRow
                                key={category.id}
                                category={category}
                                level={0}
                                visibleQuarters={visibleQuarters}
                                expandedCategories={expandedCategories}
                                toggleExpanded={toggleExpanded}
                                onAddSubcategory={(parentId) => {
                                    setQuickAddParentId(parentId);
                                    setNewCategoryName('');
                                    setIsCreating(true);
                                }}
                                onTransfer={(catId, month, planId) => setTransferModal({ open: true, categoryId: catId, month, fromPlanId: planId })}
                                onDeleteCategory={(catId: string, name: string) => setDeleteConfirm({ open: true, id: catId, name })}
                                onOpenDetails={onOpenDetails}
                                getCategoryMonthlyTotal={getCategoryMonthlyTotal}
                                getSmartProjectedForPlan={getSmartProjectedForPlan}
                            />
                        ))}

                        {/* Grand Total Row */}
                        <div className="flex border-b bg-slate-100 font-bold text-xs sticky bottom-0 z-20 shadow-[0_-1px_2px_rgba(0,0,0,0.1)]">
                            <div className="w-[300px] p-3 pl-6 border-r sticky left-0 bg-slate-100 z-30 flex justify-between items-center">
                                <span>TOTALES</span>
                                <span className={cn(
                                    "text-xs px-2 py-0.5 rounded",
                                    (currentBudget?.totalBudget ?? 0) < (monthlyPlans.reduce((acc, p) => acc + p.budgetAllocated, 0))
                                        ? "bg-red-100 text-red-700"
                                        : "bg-emerald-100 text-emerald-700"
                                )}>
                                    {((monthlyPlans.reduce((acc, p) => acc + p.budgetAllocated, 0) / (currentBudget?.totalBudget || 1)) * 100).toFixed(1)}%
                                </span>
                            </div>
                            <div className="w-[100px] p-3 text-right border-r">
                                {formatCurrency(categories.filter(c => !c.parentId).reduce((acc, c) => acc + (c.assignedBudget || 0), 0)).replace(' €', '')}
                            </div>
                            <div className="w-[100px] p-3 text-right border-r text-slate-500">-</div>
                            <div className="w-[100px] p-3 text-right border-r text-slate-500">-</div>

                            {visibleQuarters.map(quarter => (
                                <div key={quarter.quarter} className="flex-1 flex border-r last:border-r-0">
                                    {quarter.months.map(month => {
                                        // Calculate totals for this month
                                        const monthPlans = monthlyPlans.filter(p => p.month === month.key);
                                        const totalAllocated = monthPlans.reduce((acc, p) => acc + p.budgetAllocated, 0);
                                        const totalSpent = monthPlans.reduce((acc, p) => acc + getRealSpentForPlan(p.id), 0);

                                        return (
                                            <div key={month.key} className="flex-1 min-w-[100px] border-r last:border-r-0 flex">
                                                <div className="flex-1 text-center px-2 py-3 border-r border-slate-200">
                                                    {totalAllocated > 0 ? formatCurrency(totalAllocated).replace(' €', '') : '-'}
                                                </div>
                                                <div className={cn(
                                                    "flex-1 text-right px-2 py-3",
                                                    totalSpent > 0 ? "text-slate-700" : "text-slate-300"
                                                )}>
                                                    {totalSpent > 0 ? formatCurrency(totalSpent).replace(' €', '') : '-'}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                </ScrollArea>
            </CardContent>

            <TransferModal
                open={transferModal.open}
                onOpenChange={(open) => setTransferModal({ ...transferModal, open })}
                fromPlanId={transferModal.fromPlanId}
                categoryId={transferModal.categoryId}
                month={transferModal.month}
            />

            <Dialog open={deleteConfirm.open} onOpenChange={(open) => !open && setDeleteConfirm({ ...deleteConfirm, open: false })}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>¿Eliminar categoría?</DialogTitle>
                        <DialogDescription>
                            Estás a punto de eliminar <span className="font-medium text-foreground">"{deleteConfirm.name}"</span>.
                            Esta acción eliminará también todos sus planes y datos asociados.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteConfirm({ open: false, id: null, name: '' })}>
                            Cancelar
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => {
                                if (deleteConfirm.id) {
                                    deleteCategory(deleteConfirm.id);
                                    setDeleteConfirm({ open: false, id: null, name: '' });
                                }
                            }}
                        >
                            Eliminar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            {/* Details Dialog */}
            {detailsModal.open && detailsModal.categoryId && detailsModal.month && (
                <PlanDetailsDialog
                    open={detailsModal.open}
                    onOpenChange={(open) => setDetailsModal(prev => ({ ...prev, open }))}
                    categoryId={detailsModal.categoryId}
                    month={detailsModal.month}
                    categoryName={detailsModal.categoryName}
                />
            )}
        </Card>
    );
}

// Subcomponent for efficient rendering
function CategoryRow({
    category,
    level,
    visibleQuarters,
    expandedCategories,
    toggleExpanded,
    onAddSubcategory,
    onTransfer,
    onDeleteCategory,
    onOpenDetails,
    getCategoryMonthlyTotal,
    getSmartProjectedForPlan
}: any) {
    const marketingContext = useMarketing();
    const { getMonthlyPlanForCategory, getRealSpentForPlan } = marketingContext;
    const isExpanded = expandedCategories.has(category.id);
    const hasChildren = category.children && category.children.length > 0;
    const indent = level * 24;

    // Calculate totals on the fly (simplified for visual speed, ideally memoized in parent)
    // Note: In a real heavy app we should pass down pre-calculated totals
    const assignedBudget = category.assignedBudget || 0;

    // Calculate total allocated for this category (Leaf = Sum of months, Parent = Sum of children)
    // IMPORTANT: This is a heavy calculation to do in render. Memoizing in parent or context is better.
    // For now, we only check immediate children for parents, or own months for leaf.
    // Actually, for a PARENT, we want to know if the Sum of ALL its descendants allocations exceeds its assignedBudget.
    // But `BudgetPlanner` doesn't have a flattened tree or easy access to all descendants' plans in this component scope easily without traversing.
    // Let's do a simpler check: If I am a Parent, my "Allocated" is the sum of my Children's "Allocated".
    // We can pass a `calcAllocated(catId)` function? 
    // Or we can assume `marketingContext` can provide `getCategoryTotalAllocated(catId)`.

    // Let's implement a simplified visual check for the User Request "avisos si nos pasamos".
    // We will assume `assignedBudget` is the target.

    // Calculate Annual Allocated (Sum of 12 months)
    // We can use a simple loop over the 12 months generated in parent, but we only have `visibleQuarters` passed.
    // We might need to access `allMonths` or just approximate if view is limited? 
    // Ideally we should compute based on ALL plans for this category.
    // For a Leaf: Sum of its plans.
    // For a Parent: Sum of its children's Annual Allocated.

    // Using marketingContext.monthlyPlans is safer to get full year data.
    const annualAllocated = useMemo(() => {
        if (!marketingContext?.monthlyPlans) return 0;
        if (hasChildren && category.children) {
            // Recursive sum helper (simplified as we don't have full recursion here easily without perf hit)
            // But we have `getCategoryMonthlyTotal` which sums children for a month. 
            // We could loop 12 months.
            // Let's rely on stored plans for leaf nodes and aggregate up?
            // Actually, for visual check, maybe just summing visible months is enough? 
            // NO, "Annual Target" implies full year.

            // Let's try to sum "Allocated" for all leaf descendants.
            // This might be expensive.
            // Alternative: `getCategoryMonthlyTotal` for all 12 key months.
            // We need the keys. 
            // Let's assume standard keys 'YYYY-MM-01'. 
            // We don't have the keys handy here. 
            // Let's leave this calculation simple: Sum of *visible* months for now or better, 
            // Filter `monthlyPlans` by categoryId (if leaf). 
            // If parent, we need to sum children.

            // Re-implementing correctly:
            return 0; // Placeholder until we can access allMonths or calculation from parent. 
            // NOTE: To fix this properly, `BudgetPlanner` should pass `annualData` map.
        } else {
            const plans = marketingContext.monthlyPlans.filter((p: any) => p.categoryId === category.id);
            return plans.reduce((acc: number, p: any) => acc + p.budgetAllocated, 0);
        }
    }, [marketingContext.monthlyPlans, category.id, hasChildren]);

    // Calculate Annual Spent
    const annualSpent = useMemo(() => {
        if (!marketingContext?.monthlyPlans) return 0;
        // Similar logic...
        const plans = marketingContext.monthlyPlans.filter((p: any) => p.categoryId === category.id); // Only own plans?
        // If parent, we want sum of children spent?
        // This is complex for a purely client-side recursive component without pre-calc.
        return 0;
    }, [marketingContext.monthlyPlans, category.id]);


    // Correction: BudgetPlanner has `months` array. We should pass `months` to `CategoryRow` to allow iterating all of them.
    // But `BudgetPlanner` didn't pass `months`.
    // Let's use `visibleQuarters` and sum what we see for now, 
    // OR BETTER: fix `annualAllocated` for Leaf nodes is easy (filter plans). 
    // For Parent nodes, it's sum of children. 
    // Providing an accurate total requires tree traversal.

    // Let's implement a `getAnnualTotal(categoryId, type)` in context or parent?
    // Doing it here:

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const calculatedAnnualAllocated = hasChildren
        ? (category.children?.reduce((acc: number, child: any) => acc + (child.assignedBudget || 0), 0) || 0) // Fallback: Sum of Children ASSIGNED budgets? No, Allocated.
        : annualAllocated;

    // Wait, if I am a parent, my "Allocated" (Real Plan) is the sum of my children's plans.
    // If I want to validate my Target vs Children Plans:
    // If I set 10k Target, and my kids have planned 12k, I want red.

    // To get Children Plans Sum efficiently:
    // `marketingContext.monthlyPlans` contains ALL plans.
    // We can filter `monthlyPlans` where `plan.category.parentId === category.id`? No, plans link to category.
    // We need to find all descendants of this category.
    // This is O(N) where N is plans.
    // Let's try:
    const allDescendantIds = useMemo(() => {
        const ids = new Set<string>();
        const collect = (cat: any) => {
            ids.add(cat.id);
            if (cat.children) cat.children.forEach(collect);
        };
        collect(category);
        return ids;
    }, [category]);

    const realAnnualAllocated = useMemo(() => {
        if (!marketingContext?.monthlyPlans) return 0;
        return marketingContext.monthlyPlans
            .filter((p: any) => allDescendantIds.has(p.categoryId))
            .reduce((acc: number, p: any) => acc + p.budgetAllocated, 0);
    }, [marketingContext.monthlyPlans, allDescendantIds]);

    const realAnnualSpent = useMemo(() => {
        if (!marketingContext?.monthlyPlans) return 0;
        return marketingContext.monthlyPlans
            .filter((p: any) => allDescendantIds.has(p.categoryId))
            .reduce((acc: number, p: any) => acc + (p.realSpent || 0) + (p.manualResultValue || 0), 0); // Approx spent
    }, [marketingContext.monthlyPlans, allDescendantIds]);

    return (
        <>
            <div className={cn(
                "flex border-b hover:bg-slate-50/50 transition-colors group text-sm",
                hasChildren ? "bg-slate-50/30" : "bg-white"
            )}>
                {/* Name Column */}
                <div
                    className="w-[300px] pl-4 pr-2 py-2 border-r flex items-center gap-2 sticky left-0 bg-white z-10 group-hover:bg-slate-50/50 transition-colors"
                    style={{ paddingLeft: `${indent + 16}px` }}
                >
                    {hasChildren ? (
                        <button onClick={() => toggleExpanded(category.id)} className="p-0.5 hover:bg-slate-200 rounded">
                            {isExpanded ? <ChevronDown className="h-4 w-4 text-slate-500" /> : <ChevronRight className="h-4 w-4 text-slate-500" />}
                        </button>
                    ) : (
                        <div className="w-5" />
                    )}
                    <span className={cn("truncate font-medium text-slate-700", hasChildren ? "text-slate-900" : "")}>
                        {category.name}
                    </span>

                    {/* Actions on Hover */}
                    <div className="ml-auto opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onAddSubcategory(category.id)}>
                            <Plus className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6 hover:text-red-600" onClick={() => onDeleteCategory(category.id, category.name)}>
                            <Trash2 className="h-3 3-3" />
                        </Button>
                    </div>
                </div>

                {/* Annual Totals / Target */}
                <div className={cn(
                    "w-[100px] p-2 text-right border-r font-mono text-slate-600 relative group/target",
                    assignedBudget > 0 && realAnnualAllocated > assignedBudget ? "bg-red-50" : ""
                )}>
                    <input
                        className={cn(
                            "w-full h-full text-right bg-transparent outline-none focus:bg-blue-50 transition-colors placeholder:text-slate-300",
                            assignedBudget > 0 && realAnnualAllocated > assignedBudget ? "text-red-600 font-bold" : ""
                        )}
                        placeholder="-"
                        defaultValue={assignedBudget > 0 ? formatCurrency(assignedBudget).replace(' €', '') : ''}
                        onBlur={(e) => {
                            const val = parseFloat(e.target.value.replace(/\./g, '').replace(',', '.'));
                            const newValue = isNaN(val) ? 0 : val;
                            if (newValue !== assignedBudget) {
                                marketingContext.updateCategory(category.id, { assignedBudget: newValue });
                            }
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') e.currentTarget.blur();
                        }}
                    />
                    {/* Visual Validation for Parents: Show if Allocated > Target */}
                    {hasChildren && assignedBudget > 0 && (
                        <div className="absolute top-0 right-1 text-[9px] text-slate-400 opacity-0 group-hover/target:opacity-100 pointer-events-none">
                            Plan: {formatCurrency(realAnnualAllocated)}
                        </div>
                    )}
                </div>
                <div className="w-[100px] p-2 text-right border-r font-mono text-slate-600">
                    {/* Gastado (Annual) */}
                    {realAnnualSpent > 0 ? formatCurrency(realAnnualSpent).replace(' €', '') : '-'}
                </div>
                <div className="w-[100px] p-2 text-right border-r font-mono text-slate-600">
                    {/* Disponible (Target - Spent) OR (Target - Allocated)? Usually Target - Spent */}
                    {assignedBudget > 0 ? formatCurrency(assignedBudget - realAnnualSpent).replace(' €', '') : '-'}
                </div>

                {/* Months */}
                {visibleQuarters.map((quarter: any) => (
                    <div key={quarter.quarter} className="flex-1 flex border-r last:border-r-0">
                        {quarter.months.map((month: any) => {
                            const plan = marketingContext.getMonthlyPlanForCategory(category.id, month.key);
                            const estimated = hasChildren
                                ? getCategoryMonthlyTotal(category.id, month.key)
                                : (plan?.budgetAllocated ?? 0);

                            // For spent, we can also recurse if we want parents to show total spent
                            const spent = plan ? marketingContext.getRealSpentForPlan(plan.id) : 0; // Keeping leaf spent logic for now, or update to recursive?
                            // User asked for "total sumatorio", likely implies both allocated and maybe spent. 
                            // Let's stick to Allocated for the main input view for now as requested.

                            return (
                                <div key={month.key} className="flex-1 min-w-[100px] border-r last:border-r-0 flex">
                                    {hasChildren ? (
                                        <div className="flex-1 text-center px-2 py-2 font-mono text-xs text-slate-500 font-semibold bg-slate-50/50 border-r border-dashed border-slate-200 flex items-center justify-center">
                                            {estimated > 0 ? formatCurrency(estimated) : '-'}
                                        </div>
                                    ) : (
                                        <div className="flex-1 border-r border-dashed border-slate-200 relative group/cell">
                                            <input
                                                className={cn(
                                                    "w-full h-full text-center px-2 py-2 font-mono text-xs bg-transparent outline-none focus:bg-blue-50 transition-colors",
                                                    estimated > 0 ? "text-slate-700" : "text-slate-400"
                                                )}
                                                placeholder="-"
                                                defaultValue={estimated > 0 ? formatCurrency(estimated).replace(' €', '') : ''}
                                                onBlur={async (e) => {
                                                    const val = parseFloat(e.target.value.replace(/\./g, '').replace(',', '.'));
                                                    const newValue = isNaN(val) ? 0 : val;
                                                    if (newValue !== estimated) {
                                                        let currentPlanId = plan?.id;
                                                        if (!currentPlanId) {
                                                            const newPlan = await marketingContext.getOrCreateMonthlyPlan(category.id, month.key);
                                                            if (newPlan) currentPlanId = newPlan.id;
                                                        }
                                                        if (currentPlanId) {
                                                            await marketingContext.updatePlanBudget(currentPlanId, newValue);
                                                        }
                                                    }
                                                }}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.currentTarget.blur();
                                                    }
                                                }}
                                                onDoubleClick={() => {
                                                    onOpenDetails(category.id, month.key, category.name);
                                                }}
                                            />
                                        </div>
                                    )}
                                    <div className={cn(
                                        "flex-1 text-right px-2 py-2 font-mono text-xs",
                                        spent > 0 ? "text-slate-700 font-medium" : "text-slate-300"
                                    )}>
                                        {spent > 0 ? formatCurrency(spent) : '-'}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>

            {/* Render Children */}
            {isExpanded && category.children && category.children.map((child: any) => (
                <CategoryRow
                    key={child.id}
                    category={child}
                    level={level + 1}
                    visibleQuarters={visibleQuarters}
                    expandedCategories={expandedCategories}
                    toggleExpanded={toggleExpanded}
                    onAddSubcategory={onAddSubcategory}
                    onTransfer={onTransfer}
                    onDeleteCategory={onDeleteCategory}
                    onOpenDetails={onOpenDetails}
                    getCategoryMonthlyTotal={getCategoryMonthlyTotal}
                    getSmartProjectedForPlan={getSmartProjectedForPlan}
                />
            ))}
        </>
    );
}

