import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useMarketing } from '@/contexts/MarketingContext';
import { MarketingCategory, MarketingMonthlyPlan } from '@/types/marketing';
import { format, addMonths, startOfYear } from 'date-fns';
import { es } from 'date-fns/locale';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ChevronRight,
  ChevronDown,
  ChevronLeft,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  FolderPlus,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  Euro,
  Search,
  Filter,
  Info,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  EyeOff,
  BarChart3,
  Calendar,
  Layers,
  X,
  Download,
  FileSpreadsheet,
  TrendingUp as TrendingUpIcon,
  Printer,
  ArrowUpDown,
  FileText,
  Presentation,
} from 'lucide-react';
import { cn } from '@/lib/utils';

import { TransferModal } from './TransferModal';
import { ExpensesModal } from './ExpensesModal';
import { CategoryDetailPanel } from './CategoryDetailPanel';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface MonthData {
  date: Date;
  key: string;
  label: string;
  fullLabel: string;
}

interface QuickAddDialogState {
  open: boolean;
  parentId: string | null;
  parentName: string;
}

type ViewMode = 'monthly' | 'quarterly' | 'quarterly-expanded' | 'current-month' | 'annual';
type CompactView = 'full' | 'compact';

interface QuarterData {
  quarter: string; // Q1, Q2, Q3, Q4
  months: MonthData[];
  label: string;
}

export function MarketingMatrix() {
  const {
    currentBudget,
    categories,
    monthlyPlans,
    expenses,
    getCategoryTree,
    getMonthlyPlanForCategory,
    hasRemainder,
    createCategory,
    updateCategory,
    deleteCategory,
    getBudgetSummary,
    updateBudget,
    getRealSpentForPlan,
    getOrCreateMonthlyPlan,
    getEstimatedForPlan,
    getExpensesForPlan,
  } = useMarketing();

  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [quickAddDialog, setQuickAddDialog] = useState<QuickAddDialogState>({
    open: false,
    parentId: null,
    parentName: ''
  });
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const [transferModal, setTransferModal] = useState<{
    open: boolean;
    fromPlanId?: string;
    categoryId?: string;
    month?: string;
  }>({ open: false });

  const [expensesModal, setExpensesModal] = useState<{
    open: boolean;
    planId?: string;
    categoryName?: string;
    month?: string;
  }>({ open: false });

  // Budget editing state
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [editBudgetValue, setEditBudgetValue] = useState('');

  // View mode state
  const [viewMode, setViewMode] = useState<ViewMode>('quarterly-expanded');
  const [compactView, setCompactView] = useState<CompactView>('full');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedQuarters, setExpandedQuarters] = useState<Set<string>>(new Set());
  const [selectedCategoryDetail, setSelectedCategoryDetail] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'ok' | 'warning' | 'exceeded'>('all');
  const [showCharts, setShowCharts] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [showExecutiveSummary, setShowExecutiveSummary] = useState(false);
  const [selectedQuarter, setSelectedQuarter] = useState<number | null>(null); // 1-4, null = current quarter
  const [hideEmpty, setHideEmpty] = useState(false); // Hide categories with 0 totals

  // Category Budget Editing
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editCategoryBudget, setEditCategoryBudget] = useState('');

  const handleEditCategoryBudget = (category: MarketingCategory) => {
    setEditingCategoryId(category.id);
    setEditCategoryBudget(category.assignedBudget?.toString() || '');
  };

  const handleSaveCategoryBudget = async (category: MarketingCategory) => {
    const newValue = parseFloat(editCategoryBudget);
    // Allow empty string to reset the budget (or set to 0)
    // If invalid number but not empty, ignore
    if (isNaN(newValue) && editCategoryBudget !== '') return;

    await updateCategory(category.id, {
      assignedBudget: editCategoryBudget === '' ? undefined : newValue
    });
    setEditingCategoryId(null);
  };

  const summary = getBudgetSummary();

  // Generate months for the year
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

  // Get current month index (0-11) to determine current quarter
  const currentMonthIndex = useMemo(() => {
    return new Date().getMonth();
  }, []);

  // Determine current quarter (1-4) based on current month
  const currentQuarter = useMemo(() => {
    // Q1: 0-2 (Ene-Mar), Q2: 3-5 (Abr-Jun), Q3: 6-8 (Jul-Sep), Q4: 9-11 (Oct-Dic)
    return Math.floor(currentMonthIndex / 3) + 1;
  }, [currentMonthIndex]);

  // Generate all quarters for the year
  const allQuarters: QuarterData[] = useMemo(() => {
    if (months.length === 0) return [];
    return [
      { quarter: 'Q1', label: 'Ene - Mar', months: months.slice(0, 3) },
      { quarter: 'Q2', label: 'Abr - Jun', months: months.slice(3, 6) },
      { quarter: 'Q3', label: 'Jul - Sep', months: months.slice(6, 9) },
      { quarter: 'Q4', label: 'Oct - Dic', months: months.slice(9, 12) },
    ];
  }, [months]);

  // Get the quarter to display (selected or current)
  const displayQuarter = useMemo(() => {
    return selectedQuarter !== null ? selectedQuarter : currentQuarter;
  }, [selectedQuarter, currentQuarter]);

  // Generate quarters for quarterly view - show selected or current quarter
  const quarters: QuarterData[] = useMemo(() => {
    if (allQuarters.length === 0) return [];
    // For quarterly views, show the selected or current quarter
    if (viewMode === 'quarterly' || viewMode === 'quarterly-expanded') {
      return allQuarters.filter(q => {
        const quarterNum = parseInt(q.quarter.substring(1));
        return quarterNum === displayQuarter;
      });
    }
    // For other views, show all quarters
    return allQuarters;
  }, [allQuarters, displayQuarter, viewMode]);

  // Navigation functions for quarters
  const goToPreviousQuarter = () => {
    if (displayQuarter > 1) {
      setSelectedQuarter(displayQuarter - 1);
    }
  };

  const goToNextQuarter = () => {
    if (displayQuarter < 4) {
      setSelectedQuarter(displayQuarter + 1);
    }
  };

  const goToQuarter = (quarter: number) => {
    setSelectedQuarter(quarter);
  };

  const goToCurrentQuarter = () => {
    setSelectedQuarter(null); // null means use current quarter
  };

  const categoryTree = getCategoryTree();

  // Track if we've done initial expansion
  const hasInitializedRef = useRef(false);

  // Expand all categories by default for better visibility - only once
  useEffect(() => {
    if (categoryTree.length > 0 && !hasInitializedRef.current) {
      hasInitializedRef.current = true;
      const allIds = new Set<string>();
      const collectIds = (cats: MarketingCategory[]) => {
        cats.forEach(c => {
          if (c.children && c.children.length > 0) {
            allIds.add(c.id);
            collectIds(c.children);
          }
        });
      };
      collectIds(categoryTree);
      setExpandedCategories(allIds);
    }
  }, [categoryTree]);

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

  // Get smart projected: if there are real expenses, use only those; otherwise use latest estimated
  const getSmartProjectedForPlan = useCallback((planId: string) => {
    const realSpent = getRealSpentForPlan(planId);
    // If there are real expenses, ignore estimated ones (they're just snapshots)
    if (realSpent > 0) {
      return realSpent;
    }
    // If no real expenses, use the latest estimated expense amount
    const estimatedExpenses = getExpensesForPlan(planId).filter(e => e.isEstimated);
    if (estimatedExpenses.length === 0) return 0;

    // Get the most recent estimated expense (by updatedAt or createdAt)
    const latestEstimated = estimatedExpenses.reduce((latest, current) => {
      const latestDate = latest.updatedAt || latest.createdAt || '';
      const currentDate = current.updatedAt || current.createdAt || '';
      return currentDate > latestDate ? current : latest;
    });

    return latestEstimated.amount;
  }, [getRealSpentForPlan, getExpensesForPlan]);

  // Get latest estimated expense info for a plan
  const getLatestEstimatedInfo = useCallback((planId: string) => {
    const estimatedExpenses = getExpensesForPlan(planId).filter(e => e.isEstimated);
    if (estimatedExpenses.length === 0) return null;

    const latest = estimatedExpenses.reduce((latest, current) => {
      const latestDate = latest.updatedAt || latest.createdAt || '';
      const currentDate = current.updatedAt || current.createdAt || '';
      return currentDate > latestDate ? current : latest;
    });

    return {
      amount: latest.amount,
      date: latest.date || latest.updatedAt || latest.createdAt,
      concept: latest.concept
    };
  }, [getExpensesForPlan]);

  // Calculate totals for a category (including children)
  // Uses getRealSpentForPlan to exclude estimated expenses (fixes 45+49=94 bug)
  // Uses smart projected: only shows estimated if no real expenses exist
  const getCategoryTotals = useCallback((category: MarketingCategory) => {
    let totalEstimated = 0;
    let totalSpent = 0;
    let totalProjected = 0; // smart projected: real if exists, else latest estimated
    const hasChildren = category.children && category.children.length > 0;

    months.forEach(month => {
      const plan = getMonthlyPlanForCategory(category.id, month.key);
      if (plan) {
        totalEstimated += plan.budgetAllocated;
        // Use getRealSpentForPlan instead of plan.realSpent to exclude estimated expenses
        const realSpent = getRealSpentForPlan(plan.id);
        const smartProjected = getSmartProjectedForPlan(plan.id);
        totalSpent += realSpent;
        totalProjected += smartProjected;
      }
    });

    let childrenAssignedBudget = 0;
    if (hasChildren) {
      category.children!.forEach(child => {
        const childTotals = getCategoryTotals(child);
        totalEstimated += childTotals.totalEstimated;
        totalSpent += childTotals.totalSpent;
        totalProjected += childTotals.totalProjected;
        // Sum assigned budgets from children (only leaf categories have assignedBudget)
        childrenAssignedBudget += childTotals.assignedBudget;
      });
    }

    // For parent categories: if they have assignedBudget, use it; otherwise sum of children
    // For leaf categories: use manually assigned value
    const calculatedAssignedBudget = hasChildren
      ? (category.assignedBudget || childrenAssignedBudget)  // Parent: use assigned if exists, else sum of children
      : (category.assignedBudget || 0); // Leaf: manual assignment

    // Budget base: use assignedBudget if exists (for leaf) or calculated (for parent), otherwise use totalEstimated
    const budgetBase = calculatedAssignedBudget > 0 ? calculatedAssignedBudget : totalEstimated;

    return {
      totalEstimated,
      totalSpent,
      totalProjected,
      assignedBudget: calculatedAssignedBudget, // Shows calculated sum for parents, manual for leaves
      unallocated: calculatedAssignedBudget > 0 ? (calculatedAssignedBudget - totalEstimated) : 0,
      remainder: budgetBase - totalSpent, // Disponible Real
      remainderProjected: budgetBase - totalProjected, // Disponible Proyectado (smart: real si existe, sino último estimado)
      variance: totalEstimated > 0 ? ((totalSpent / totalEstimated) * 100) : 0
    };
  }, [months, getMonthlyPlanForCategory, getRealSpentForPlan, getSmartProjectedForPlan]);

  // Get totals for a category for a specific quarter
  const getQuarterTotals = useCallback((category: MarketingCategory, quarter: QuarterData) => {
    let estimated = 0;
    let spent = 0;
    let projected = 0;

    quarter.months.forEach(month => {
      const plan = getMonthlyPlanForCategory(category.id, month.key);
      if (plan) {
        estimated += plan.budgetAllocated;
        // Use getRealSpentForPlan instead of plan.realSpent
        const realSpent = getRealSpentForPlan(plan.id);
        const smartProjected = getSmartProjectedForPlan(plan.id);
        spent += realSpent;
        projected += smartProjected;
      }
    });

    // Include children
    if (category.children) {
      category.children.forEach(child => {
        const childTotals = getQuarterTotals(child, quarter);
        estimated += childTotals.estimated;
        spent += childTotals.spent;
        projected += childTotals.projected;
      });
    }

    return { estimated, spent, projected, remainder: estimated - spent, remainderProjected: estimated - projected };
  }, [getMonthlyPlanForCategory, getRealSpentForPlan, getSmartProjectedForPlan]);

  const handleQuickAdd = async () => {
    if (!currentBudget || !newCategoryName.trim()) return;

    setIsCreating(true);
    try {
      await createCategory({
        budgetId: currentBudget.id,
        parentId: quickAddDialog.parentId || undefined,
        name: newCategoryName.trim(),
      });
      setQuickAddDialog({ open: false, parentId: null, parentName: '' });
      setNewCategoryName('');
    } finally {
      setIsCreating(false);
    }
  };

  const openTransferModal = (categoryId: string, month: string, fromPlanId?: string) => {
    setTransferModal({ open: true, categoryId, month, fromPlanId });
  };

  const openExpensesModal = (planId: string, categoryName: string, month: string) => {
    setExpensesModal({ open: true, planId, categoryName, month });
  };

  const handleEditBudget = () => {
    setEditBudgetValue(summary.totalBudget.toString());
    setIsEditingBudget(true);
  };

  const handleSaveBudget = async () => {
    if (!currentBudget) return;
    const newValue = parseFloat(editBudgetValue);
    if (isNaN(newValue) || newValue <= 0) return;

    await updateBudget(currentBudget.id, { totalBudget: newValue });
    setIsEditingBudget(false);
  };

  // Get trend indicator
  const getTrendIndicator = (estimated: number, spent: number) => {
    if (estimated === 0 && spent === 0) return null;
    if (spent > estimated) {
      return <TrendingUp className="h-3 w-3 text-red-500" />;
    } else if (spent < estimated * 0.5 && estimated > 0) {
      return <TrendingDown className="h-3 w-3 text-amber-500" />;
    }
    return <Minus className="h-3 w-3 text-green-500" />;
  };

  // Get status badge for category
  const getStatusBadge = (totals: ReturnType<typeof getCategoryTotals>) => {
    const { assignedBudget, totalSpent, totalProjected, totalEstimated } = totals;
    const budgetBase = assignedBudget > 0 ? assignedBudget : totalEstimated;
    const usageReal = budgetBase > 0 ? (totalSpent / budgetBase) * 100 : 0;
    const usageProjected = budgetBase > 0 ? (totalProjected / budgetBase) * 100 : 0;

    if (totalSpent > budgetBase && budgetBase > 0) {
      return { status: 'exceeded', label: 'Excedido', icon: XCircle, color: 'text-red-600 bg-red-50' };
    } else if (usageProjected > 90 || usageReal > 80) {
      return { status: 'warning', label: 'Atención', icon: AlertTriangle, color: 'text-amber-600 bg-amber-50' };
    } else if (budgetBase > 0) {
      return { status: 'ok', label: 'En línea', icon: CheckCircle2, color: 'text-green-600 bg-green-50' };
    }
    return null;
  };

  // Filter categories by search term
  const filterCategoriesRecursive = useCallback((cats: MarketingCategory[], term: string): MarketingCategory[] => {
    return cats.filter(cat => {
      const matchesName = cat.name.toLowerCase().includes(term);
      const filteredChildren = cat.children ? filterCategoriesRecursive(cat.children, term) : [];
      const matchesChildren = filteredChildren.length > 0;
      return matchesName || matchesChildren;
    }).map(cat => {
      if (cat.children && cat.children.length > 0) {
        return { ...cat, children: filterCategoriesRecursive(cat.children, term) };
      }
      return cat;
    });
  }, []);

  const filterCategories = useCallback((cats: MarketingCategory[]): MarketingCategory[] => {
    if (!searchTerm.trim()) return cats;
    return filterCategoriesRecursive(cats, searchTerm.toLowerCase());
  }, [searchTerm, filterCategoriesRecursive]);

  // Get current month
  const currentMonth = useMemo(() => {
    if (!currentBudget) return null;
    const now = new Date();
    const currentYear = now.getFullYear();
    if (currentBudget.year !== currentYear) return null;
    return format(now, 'yyyy-MM-dd');
  }, [currentBudget]);

  // Filter by status and empty state
  const shouldShowCategory = useCallback((category: MarketingCategory): boolean => {
    // 1. Filter by Status
    if (filterStatus !== 'all') {
      const totals = getCategoryTotals(category);
      const badge = getStatusBadge(totals);
      if (badge && badge.status !== filterStatus) return false;
    }

    // 2. Filter by Empty State
    if (hideEmpty) {
      // Logic depends on view mode
      if (viewMode === 'current-month' && currentMonth) {
        // For Current Month: check activity in this specific month
        const plan = getMonthlyPlanForCategory(category.id, currentMonth);
        const hasBudget = (plan?.budgetAllocated || 0) > 0;
        const hasSpent = plan ? getRealSpentForPlan(plan.id) > 0 : false;
        const hasProjected = plan ? getSmartProjectedForPlan(plan.id) > 0 : false;

        // Also check if children have activity (recursive logic is handled by calling this function on children in render)
        // ideally we check tree totals here but for simple hiding of rows:
        // If it's a parent, checking children is complex here without memoization issues.
        // Simplification: Check category totals for the month.
        // Better: Check annual totals first, if 0 then hide. But we want "Hide unused in this view".

        // Let's rely on the row render logic to filter children, but for the parent itself:
        // A category should show if it has activity OR one of its children has activity.
        const totals = getCategoryTotals(category);
        // NOTE: getCategoryTotals gives annual totals. We need context-specific.

        // Simplified check for "Activity in Current Month":
        if (hasBudget || hasSpent || hasProjected) return true;

        // Check children recursively for activity in this month
        const hasChildActivity = (cat: MarketingCategory): boolean => {
          if (!cat.children) return false;
          return cat.children.some(child => {
            const cPlan = getMonthlyPlanForCategory(child.id, currentMonth);
            const cHas = (cPlan?.budgetAllocated || 0) > 0 || (cPlan && getRealSpentForPlan(cPlan.id) > 0);
            return cHas || hasChildActivity(child);
          });
        };

        if (!hasChildActivity(category) && !hasBudget && !hasSpent) return false;

      } else if (viewMode === 'quarterly' || viewMode === 'quarterly-expanded') {
        // For Quarterly: check activity in selected quarter
        // Find the quarter object
        const quarterData = quarters.find(q => {
          const quarterNum = parseInt(q.quarter.substring(1));
          return quarterNum === displayQuarter;
        });

        if (quarterData) {
          const qTotals = getQuarterTotals(category, quarterData);
          if (qTotals.estimated === 0 && qTotals.spent === 0 && qTotals.projected === 0) return false;
        }
      } else {
        // For Monthly/Annual view: check annual totals (assigned budget, estimated or spent)
        const totals = getCategoryTotals(category);
        const hasAssigned = totals.assignedBudget > 0;
        const hasActivity = totals.totalEstimated > 0 || totals.totalSpent > 0 || totals.totalProjected > 0;
        if (!hasAssigned && !hasActivity) return false;
      }
    }

    return true;
  }, [filterStatus, hideEmpty, viewMode, currentMonth, getMonthlyPlanForCategory, getRealSpentForPlan, getSmartProjectedForPlan, getCategoryTotals, getQuarterTotals, quarters, displayQuarter]);

  // Toggle quarter expansion
  const toggleQuarter = (quarter: string) => {
    setExpandedQuarters(prev => {
      const next = new Set(prev);
      if (next.has(quarter)) {
        next.delete(quarter);
      } else {
        next.add(quarter);
      }
      return next;
    });
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K: Focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.querySelector('input[placeholder*="Buscar"]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
      }
      // Escape: Clear search and filters
      if (e.key === 'Escape' && (searchTerm || filterStatus !== 'all')) {
        setSearchTerm('');
        setFilterStatus('all');
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [searchTerm, filterStatus]);

  // Sort categories
  const sortCategories = useCallback((cats: MarketingCategory[]): MarketingCategory[] => {
    if (!sortConfig) return cats;

    const sorted = [...cats].sort((a, b) => {
      const totalsA = getCategoryTotals(a);
      const totalsB = getCategoryTotals(b);

      let valueA = 0;
      let valueB = 0;

      switch (sortConfig.key) {
        case 'name':
          valueA = a.name.localeCompare(b.name);
          valueB = b.name.localeCompare(a.name);
          break;
        case 'assignedBudget':
          valueA = totalsA.assignedBudget;
          valueB = totalsB.assignedBudget;
          break;
        case 'totalEstimated':
          valueA = totalsA.totalEstimated;
          valueB = totalsB.totalEstimated;
          break;
        case 'totalSpent':
          valueA = totalsA.totalSpent;
          valueB = totalsB.totalSpent;
          break;
        case 'remainder':
          valueA = totalsA.remainder;
          valueB = totalsB.remainder;
          break;
        default:
          return 0;
      }

      if (sortConfig.key === 'name') {
        return sortConfig.direction === 'asc' ? valueA : valueB;
      }

      return sortConfig.direction === 'asc' ? valueA - valueB : valueB - valueA;
    });

    return sorted.map(cat => {
      if (cat.children && cat.children.length > 0) {
        return { ...cat, children: sortCategories(cat.children) };
      }
      return cat;
    });
  }, [sortConfig, getCategoryTotals]);

  const handleSort = (key: string) => {
    setSortConfig(prev => {
      if (prev?.key === key) {
        return prev.direction === 'asc'
          ? { key, direction: 'desc' }
          : null;
      }
      return { key, direction: 'asc' };
    });
  };

  // Export to CSV
  const exportToCSV = (detailed: boolean = false) => {
    if (!currentBudget) return;

    const headers = detailed
      ? ['Categoría', 'Pres. Asig.', 'Total Est.', 'Total Inv.', 'Total Proy.', 'Disp. Real', 'Disp. Proy.', ...months.flatMap(m => [`${m.label} Est`, `${m.label} Inv`])]
      : ['Categoría', 'Pres. Asig.', 'Total Est.', 'Total Inv.', 'Total Proy.', 'Disp. Real', 'Disp. Proy.'];

    const rows: string[][] = [];

    const addCategoryRow = (category: MarketingCategory, level: number = 0) => {
      const totals = getCategoryTotals(category);
      const indent = '  '.repeat(level);

      if (detailed) {
        const monthData = months.map(month => {
          const plan = getMonthlyPlanForCategory(category.id, month.key);
          const est = plan?.budgetAllocated ?? 0;
          const spent = plan ? getRealSpentForPlan(plan.id) : 0;
          return [est.toString(), spent.toString()];
        }).flat();

        rows.push([
          `${indent}${category.name}`,
          totals.assignedBudget > 0 ? totals.assignedBudget.toFixed(2) : '',
          totals.totalEstimated.toFixed(2),
          totals.totalSpent.toFixed(2),
          totals.totalProjected.toFixed(2),
          totals.remainder.toFixed(2),
          totals.remainderProjected.toFixed(2),
          ...monthData
        ]);
      } else {
        rows.push([
          `${indent}${category.name}`,
          totals.assignedBudget > 0 ? totals.assignedBudget.toFixed(2) : '',
          totals.totalEstimated.toFixed(2),
          totals.totalSpent.toFixed(2),
          totals.totalProjected.toFixed(2),
          totals.remainder.toFixed(2),
          totals.remainderProjected.toFixed(2)
        ]);
      }

      if (category.children) {
        category.children.forEach(child => addCategoryRow(child, level + 1));
      }
    };

    categoryTree.forEach(cat => addCategoryRow(cat));

    // Add totals row
    if (detailed) {
      const monthTotals = months.map(month => {
        const monthPlans = monthlyPlans.filter(p => p.month === month.key);
        const monthEst = monthPlans.reduce((sum, p) => sum + p.budgetAllocated, 0);
        const monthSpent = monthPlans.reduce((sum, p) => sum + getRealSpentForPlan(p.id), 0);
        return [monthEst.toFixed(2), monthSpent.toFixed(2)];
      }).flat();

      rows.push([
        'TOTAL',
        summary.totalBudget.toFixed(2),
        summary.totalAllocated.toFixed(2),
        summary.totalSpent.toFixed(2),
        monthlyPlans.reduce((sum, p) => sum + getSmartProjectedForPlan(p.id), 0).toFixed(2),
        summary.totalRemaining.toFixed(2),
        (summary.totalBudget - monthlyPlans.reduce((sum, p) => sum + getRealSpentForPlan(p.id) + getEstimatedForPlan(p.id), 0)).toFixed(2),
        ...monthTotals
      ]);
    } else {
      rows.push([
        'TOTAL',
        summary.totalBudget.toFixed(2),
        summary.totalAllocated.toFixed(2),
        summary.totalSpent.toFixed(2),
        monthlyPlans.reduce((sum, p) => sum + getSmartProjectedForPlan(p.id), 0).toFixed(2),
        summary.totalRemaining.toFixed(2),
        (summary.totalBudget - monthlyPlans.reduce((sum, p) => sum + getRealSpentForPlan(p.id) + getEstimatedForPlan(p.id), 0)).toFixed(2)
      ]);
    }

    const csv = [
      headers.map(h => `"${h}"`).join(','),
      ...rows.map(r => r.map(c => `"${c}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `marketing_${currentBudget.year}_${detailed ? 'detallado' : 'resumen'}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Render a single month cell
  const renderMonthCell = (category: MarketingCategory, month: MonthData) => {
    const plan = getMonthlyPlanForCategory(category.id, month.key);
    const estimated = plan?.budgetAllocated ?? 0;
    // Use getRealSpentForPlan to exclude estimated expenses
    const spent = plan ? getRealSpentForPlan(plan.id) : 0;
    const remainderInfo = plan ? hasRemainder(plan.id) : { hasRemainder: false, amount: 0 };

    const hasData = estimated > 0 || spent > 0;
    const isOverBudget = spent > estimated && estimated > 0;

    return (
      <div key={`${category.id}-${month.key}`} className="flex border-r min-w-[100px]">
        {/* Estimated */}
        <button
          onClick={() => openTransferModal(category.id, month.key, plan?.id)}
          className={cn(
            "w-[50px] px-1 py-1.5 text-right border-r border-dashed transition-colors text-xs",
            "hover:bg-blue-50 focus:bg-blue-100 focus:outline-none",
            !hasData && "text-slate-300"
          )}
          title={`Asignar presupuesto - ${month.fullLabel}`}
        >
          {estimated > 0 ? estimated.toLocaleString('es-ES') : '-'}
        </button>

        {/* Spent */}
        <button
          onClick={() => plan && openExpensesModal(plan.id, category.name, month.fullLabel)}
          disabled={!hasData}
          className={cn(
            "w-[50px] px-1 py-1.5 text-right transition-colors text-xs",
            hasData && "hover:bg-green-50 cursor-pointer",
            isOverBudget ? "text-red-600 font-medium" :
              spent > 0 ? "text-green-700" : "text-slate-300"
          )}
          title={`Ver gastos - ${month.fullLabel}`}
        >
          <div className="flex items-center justify-end gap-0.5">
            {spent > 0 ? spent.toLocaleString('es-ES') : '-'}
            {remainderInfo.hasRemainder && (
              <AlertTriangle className="h-2.5 w-2.5 text-amber-500" />
            )}
          </div>
        </button>
      </div>
    );
  };

  const renderCategoryRow = (category: MarketingCategory, level: number = 0) => {
    const hasChildren = category.children && category.children.length > 0;
    const isExpanded = expandedCategories.has(category.id);
    const totals = getCategoryTotals(category);
    const isLeaf = !hasChildren;

    // Determine if we should show compact columns (only in monthly view)
    const showCompact = viewMode === 'monthly' && compactView === 'compact';

    return (
      <div key={category.id}>
        {/* Row */}
        <div className={cn(
          "flex border-b group hover:bg-slate-50/50",
          level === 0 && "bg-gradient-to-r from-emerald-50 to-white"
        )}>
          {/* Category Name (Fixed) - Increased width and tooltip */}
          <div
            className={cn(
              "min-w-[300px] w-[300px] sticky left-0 z-10 border-r flex items-center gap-1 py-1.5 px-2",
              level === 0 ? "bg-gradient-to-r from-emerald-50 to-emerald-50/50" : "bg-white group-hover:bg-slate-50/50"
            )}
            style={{ paddingLeft: `${8 + level * 16}px` }}
          >
            {/* Expand/Collapse */}
            {hasChildren ? (
              <button
                onClick={() => toggleExpanded(category.id)}
                className="p-0.5 rounded hover:bg-slate-200 flex-shrink-0"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-slate-500" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-slate-500" />
                )}
              </button>
            ) : (
              <div className="w-5 flex-shrink-0" />
            )}

            {/* Name with Status Badge */}
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className={cn(
                      "flex-1 text-sm truncate",
                      level === 0 ? "font-semibold text-emerald-900" : "text-slate-700"
                    )}>
                      {category.name}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-md">
                    <p className="break-words">{category.name}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {/* Status Badge */}
              {(() => {
                const badge = getStatusBadge(totals);
                if (!badge) return null;
                const Icon = badge.icon;
                return (
                  <TooltipProvider delayDuration={300}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge variant="outline" className={cn("h-5 px-1.5 text-[10px] font-normal flex-shrink-0", badge.color)}>
                          <Icon className="h-3 w-3 mr-0.5" />
                          {badge.label}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="space-y-1 text-xs">
                          <p><strong>Estado:</strong> {badge.label}</p>
                          <p>Presupuesto: {totals.assignedBudget > 0 ? totals.assignedBudget.toLocaleString('es-ES') : totals.totalEstimated.toLocaleString('es-ES')} €</p>
                          <p>Invertido: {totals.totalSpent.toLocaleString('es-ES')} €</p>
                          {totals.totalProjected > totals.totalSpent && (
                            <p>Proyectado: {totals.totalProjected.toLocaleString('es-ES')} €</p>
                          )}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              })()}

              {/* View Detail Button */}
              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                      onClick={() => setSelectedCategoryDetail(category.id)}
                      title="Ver detalle completo"
                    >
                      <Eye className="h-3.5 w-3.5 text-slate-500" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Ver detalle y trazabilidad</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            {/* Quick Actions */}
            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 flex-shrink-0">
              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => setQuickAddDialog({
                        open: true,
                        parentId: category.id,
                        parentName: category.name
                      })}
                    >
                      <FolderPlus className="h-3.5 w-3.5 text-emerald-600" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>Añadir subcategoría</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <MoreHorizontal className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    className="text-red-600"
                    onClick={() => deleteCategory(category.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Eliminar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Assigned Budget (Editable for all categories) */}
          <div
            className={cn(
              showCompact ? "w-[100px]" : "w-[80px]",
              "border-r px-2 py-1.5 text-right bg-purple-50/50 transition-colors",
              "group/budget cursor-pointer hover:bg-purple-100/50"
            )}
            onClick={() => handleEditCategoryBudget(category)}
            title="Click para editar presupuesto anual"
          >
            {editingCategoryId === category.id ? (
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  className="w-full text-xs p-1 h-6 border rounded"
                  value={editCategoryBudget}
                  onChange={(e) => setEditCategoryBudget(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveCategoryBudget(category);
                    if (e.key === 'Escape') setEditingCategoryId(null);
                  }}
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            ) : (
              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className={cn(
                      "text-sm font-medium",
                      totals.assignedBudget > 0 ? "text-purple-700" : "text-slate-400"
                    )}>
                      {totals.assignedBudget > 0 ? totals.assignedBudget.toLocaleString('es-ES') : '-'}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    {!isLeaf ? (
                      <div className="space-y-1">
                        <p>Presupuesto anual asignado: {category.assignedBudget ? category.assignedBudget.toLocaleString('es-ES') : '0'} €</p>
                        <p className="text-xs">Suma de subcategorías: {totals.totalEstimated.toLocaleString('es-ES')} €</p>
                      </div>
                    ) : (
                      <p>Presupuesto anual asignado a esta categoría</p>
                    )}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>

          {/* Summary Columns - Conditional based on compact view */}
          {!showCompact ? (
            <>
              {/* Total Estimated */}
              <div className="w-[80px] border-r px-2 py-1.5 text-right bg-blue-50/50">
                <span className="text-sm font-medium text-blue-900">
                  {totals.totalEstimated > 0 ? totals.totalEstimated.toLocaleString('es-ES') : '-'}
                </span>
              </div>

              {/* Total Spent (Real) */}
              <div className={cn(
                "w-[80px] border-r px-2 py-1.5 text-right",
                totals.totalSpent > totals.totalEstimated && totals.totalEstimated > 0
                  ? "bg-red-50"
                  : "bg-green-50/50"
              )}>
                <span className={cn(
                  "text-sm font-medium",
                  totals.totalSpent > totals.totalEstimated && totals.totalEstimated > 0
                    ? "text-red-700"
                    : "text-green-700"
                )}>
                  {totals.totalSpent > 0 ? totals.totalSpent.toLocaleString('es-ES') : '-'}
                </span>
              </div>

              {/* Total Projected (Real + Estimated) */}
              <div className={cn(
                "w-[80px] border-r px-2 py-1.5 text-right",
                totals.totalProjected > totals.totalEstimated && totals.totalEstimated > 0
                  ? "bg-amber-50"
                  : totals.totalProjected > totals.totalSpent
                    ? "bg-blue-50/50"
                    : "bg-green-50/50"
              )}>
                <TooltipProvider delayDuration={300}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className={cn(
                        "text-sm font-medium cursor-help",
                        totals.totalProjected > totals.totalEstimated && totals.totalEstimated > 0
                          ? "text-amber-700"
                          : totals.totalProjected > totals.totalSpent
                            ? "text-blue-700"
                            : "text-green-700"
                      )}>
                        {totals.totalProjected > 0 ? totals.totalProjected.toLocaleString('es-ES') : '-'}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Proyectado: {totals.totalSpent.toLocaleString('es-ES')} € (real) + {(totals.totalProjected - totals.totalSpent).toLocaleString('es-ES')} € (estimado)</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              {/* Disponible Real with Progress Bar */}
              <div className={cn(
                "w-[80px] border-r px-2 py-1.5 text-right flex flex-col items-end gap-0.5",
                totals.remainder < 0 ? "bg-red-100" :
                  totals.remainder > 0 ? "bg-amber-50/50" : "bg-slate-50"
              )}>
                <div className="flex items-center justify-end gap-1 w-full">
                  {getTrendIndicator(totals.totalEstimated, totals.totalSpent)}
                  <TooltipProvider delayDuration={300}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className={cn(
                          "text-sm font-medium cursor-help",
                          totals.remainder < 0 ? "text-red-700" :
                            totals.remainder > 0 ? "text-amber-700" : "text-slate-400"
                        )}>
                          {totals.totalEstimated > 0 || totals.totalSpent > 0
                            ? totals.remainder.toLocaleString('es-ES')
                            : '-'}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="space-y-1 text-xs">
                          <p><strong>Disponible Real:</strong> {totals.remainder.toLocaleString('es-ES')} €</p>
                          <p>Presupuesto: {totals.assignedBudget > 0 ? totals.assignedBudget.toLocaleString('es-ES') : totals.totalEstimated.toLocaleString('es-ES')} €</p>
                          <p>Invertido: {totals.totalSpent.toLocaleString('es-ES')} €</p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                {/* Progress bar */}
                {(() => {
                  const budgetBase = totals.assignedBudget > 0 ? totals.assignedBudget : totals.totalEstimated;
                  const usage = budgetBase > 0 ? Math.min(100, (totals.totalSpent / budgetBase) * 100) : 0;
                  if (budgetBase === 0) return null;
                  return (
                    <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full transition-all",
                          usage > 100 ? "bg-red-500" :
                            usage > 80 ? "bg-amber-500" : "bg-green-500"
                        )}
                        style={{ width: `${Math.min(100, usage)}%` }}
                      />
                    </div>
                  );
                })()}
              </div>

              {/* Disponible Proyectado with Progress Bar */}
              <div className={cn(
                "w-[80px] border-r px-2 py-1.5 text-right flex flex-col items-end gap-0.5",
                totals.remainderProjected < 0 ? "bg-red-100" :
                  totals.remainderProjected > 0 ? "bg-blue-50/50" : "bg-slate-50"
              )}>
                <div className="flex items-center justify-end gap-1 w-full">
                  {getTrendIndicator(totals.totalEstimated, totals.totalProjected)}
                  <TooltipProvider delayDuration={300}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className={cn(
                          "text-sm font-medium cursor-help",
                          totals.remainderProjected < 0 ? "text-red-700" :
                            totals.remainderProjected > 0 ? "text-blue-700" : "text-slate-400"
                        )}>
                          {totals.totalEstimated > 0 || totals.totalProjected > 0
                            ? totals.remainderProjected.toLocaleString('es-ES')
                            : '-'}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="space-y-1 text-xs">
                          <p><strong>Disponible Proyectado:</strong> {totals.remainderProjected.toLocaleString('es-ES')} €</p>
                          <p>Presupuesto: {totals.assignedBudget > 0 ? totals.assignedBudget.toLocaleString('es-ES') : totals.totalEstimated.toLocaleString('es-ES')} €</p>
                          <p>Proyectado: {totals.totalProjected.toLocaleString('es-ES')} € (Real: {totals.totalSpent.toLocaleString('es-ES')} € + Est: {(totals.totalProjected - totals.totalSpent).toLocaleString('es-ES')} €)</p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                {/* Progress bar */}
                {(() => {
                  const budgetBase = totals.assignedBudget > 0 ? totals.assignedBudget : totals.totalEstimated;
                  const usage = budgetBase > 0 ? Math.min(100, (totals.totalProjected / budgetBase) * 100) : 0;
                  if (budgetBase === 0) return null;
                  return (
                    <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full transition-all",
                          usage > 100 ? "bg-red-500" :
                            usage > 90 ? "bg-amber-500" : "bg-blue-500"
                        )}
                        style={{ width: `${Math.min(100, usage)}%` }}
                      />
                    </div>
                  );
                })()}
              </div>
            </>
          ) : (
            <>
              {/* Compact View: Only essential columns */}
              {/* Total Estimated */}
              <div className="w-[100px] border-r px-2 py-1.5 text-right bg-blue-50/50">
                <span className="text-sm font-medium text-blue-900">
                  {totals.totalEstimated > 0 ? totals.totalEstimated.toLocaleString('es-ES') : '-'}
                </span>
              </div>

              {/* Total Spent */}
              <div className={cn(
                "w-[100px] border-r px-2 py-1.5 text-right",
                totals.totalSpent > totals.totalEstimated && totals.totalEstimated > 0
                  ? "bg-red-50"
                  : "bg-green-50/50"
              )}>
                <span className={cn(
                  "text-sm font-medium",
                  totals.totalSpent > totals.totalEstimated && totals.totalEstimated > 0
                    ? "text-red-700"
                    : "text-green-700"
                )}>
                  {totals.totalSpent > 0 ? totals.totalSpent.toLocaleString('es-ES') : '-'}
                </span>
              </div>

              {/* Disponible (Real) */}
              <div className={cn(
                "w-[100px] border-r px-2 py-1.5 text-right flex flex-col items-end gap-0.5",
                totals.remainder < 0 ? "bg-red-100" :
                  totals.remainder > 0 ? "bg-amber-50/50" : "bg-slate-50"
              )}>
                <span className={cn(
                  "text-sm font-medium",
                  totals.remainder < 0 ? "text-red-700" :
                    totals.remainder > 0 ? "text-amber-700" : "text-slate-400"
                )}>
                  {totals.totalEstimated > 0 || totals.totalSpent > 0
                    ? totals.remainder.toLocaleString('es-ES')
                    : '-'}
                </span>
                {/* Progress bar */}
                {(() => {
                  const budgetBase = totals.assignedBudget > 0 ? totals.assignedBudget : totals.totalEstimated;
                  const usage = budgetBase > 0 ? Math.min(100, (totals.totalSpent / budgetBase) * 100) : 0;
                  if (budgetBase === 0) return null;
                  return (
                    <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full transition-all",
                          usage > 100 ? "bg-red-500" :
                            usage > 80 ? "bg-amber-500" : "bg-green-500"
                        )}
                        style={{ width: `${Math.min(100, usage)}%` }}
                      />
                    </div>
                  );
                })()}
              </div>
            </>
          )}

          {/* Monthly Cells */}
          {months.map(month => renderMonthCell(category, month))}
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div>
            {category.children!.map(child => renderCategoryRow(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (!currentBudget) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Selecciona un presupuesto para ver la matriz de control.
        </CardContent>
      </Card>
    );
  }

  if (categoryTree.length === 0) {
    return (
      <>
        <Card>
          <CardContent className="py-12 text-center">
            <FolderPlus className="h-12 w-12 mx-auto mb-4 text-slate-300" />
            <p className="text-muted-foreground mb-4">No hay categorías configuradas.</p>
            <Button
              onClick={() => setQuickAddDialog({ open: true, parentId: null, parentName: '' })}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Crear primera categoría
            </Button>
          </CardContent>
        </Card>

        {/* Quick Add Dialog - must be rendered here too */}
        <Dialog open={quickAddDialog.open} onOpenChange={(open) => setQuickAddDialog(prev => ({ ...prev, open }))}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Nueva categoría</DialogTitle>
              <DialogDescription>
                Crear una categoría principal (ej: SEM, Social, Display)
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Label htmlFor="cat-name-empty">Nombre</Label>
              <Input
                id="cat-name-empty"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Ej: SEM, Social Ads..."
                className="mt-2"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleQuickAdd()}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setQuickAddDialog({ open: false, parentId: null, parentName: '' })}>
                Cancelar
              </Button>
              <Button onClick={handleQuickAdd} disabled={!newCategoryName.trim() || isCreating}>
                {isCreating ? 'Creando...' : 'Crear'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Header - Editable Budget */}
      <div className="flex items-start justify-between gap-4">
        <div className="grid grid-cols-4 gap-3 flex-1">
          <Card className="shadow-sm cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => !isEditingBudget && handleEditBudget()}>
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Presupuesto Total</p>
                <Pencil className="h-3 w-3 text-slate-400" />
              </div>
              {isEditingBudget ? (
                <div className="flex items-center gap-1 mt-1">
                  <Input
                    type="number"
                    value={editBudgetValue}
                    onChange={(e) => setEditBudgetValue(e.target.value)}
                    className="h-7 text-lg font-bold"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveBudget();
                      if (e.key === 'Escape') setIsEditingBudget(false);
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <Button size="sm" className="h-7 px-2" onClick={(e) => { e.stopPropagation(); handleSaveBudget(); }}>
                    ✓
                  </Button>
                </div>
              ) : (
                <p className="text-lg font-bold">{summary.totalBudget.toLocaleString('es-ES')} €</p>
              )}
            </CardContent>
          </Card>
          <Card className="shadow-sm border-l-4 border-l-blue-500">
            <CardContent className="p-3">
              <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Estimado</p>
              <p className="text-lg font-bold text-blue-700">{summary.totalAllocated.toLocaleString('es-ES')} €</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-l-4 border-l-green-500">
            <CardContent className="p-3">
              <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Invertido</p>
              <p className={cn("text-lg font-bold", summary.totalSpent > summary.totalAllocated ? "text-red-600" : "text-green-600")}>
                {summary.totalSpent.toLocaleString('es-ES')} €
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-l-4 border-l-amber-500">
            <CardContent className="p-3">
              <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Disponible</p>
              <p className={cn("text-lg font-bold", summary.totalRemaining < 0 ? "text-red-600" : "text-amber-600")}>
                {summary.totalRemaining.toLocaleString('es-ES')} €
              </p>
            </CardContent>
          </Card>
        </div>

        {/* KPIs adicionales */}
        <div className="flex flex-col gap-2 min-w-[200px]">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">% Usado:</span>
            <span className={cn(
              "font-semibold",
              (summary.totalSpent / summary.totalBudget) * 100 > 100 ? "text-red-600" :
                (summary.totalSpent / summary.totalBudget) * 100 > 80 ? "text-amber-600" : "text-green-600"
            )}>
              {((summary.totalSpent / summary.totalBudget) * 100).toFixed(1)}%
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">% Estimado:</span>
            <span className="font-semibold text-blue-600">
              {((summary.totalAllocated / summary.totalBudget) * 100).toFixed(1)}%
            </span>
          </div>
          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full transition-all",
                (summary.totalSpent / summary.totalBudget) * 100 > 100 ? "bg-red-500" :
                  (summary.totalSpent / summary.totalBudget) * 100 > 80 ? "bg-amber-500" : "bg-green-500"
              )}
              style={{ width: `${Math.min(100, (summary.totalSpent / summary.totalBudget) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Executive Summary */}
      {showExecutiveSummary && (
        <Card className="shadow-sm mb-4 print:shadow-none">
          <CardHeader>
            <CardTitle className="text-lg">Resumen Ejecutivo - {currentBudget.year}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Overview */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase">Resumen General</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Presupuesto Total:</span>
                    <span className="font-semibold">{summary.totalBudget.toLocaleString('es-ES')} €</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Estimado:</span>
                    <span className="font-semibold text-blue-600">{summary.totalAllocated.toLocaleString('es-ES')} €</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Invertido:</span>
                    <span className="font-semibold text-green-600">{summary.totalSpent.toLocaleString('es-ES')} €</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Disponible:</span>
                    <span className={cn(
                      "font-semibold",
                      summary.totalRemaining < 0 ? "text-red-600" : "text-amber-600"
                    )}>
                      {summary.totalRemaining.toLocaleString('es-ES')} €
                    </span>
                  </div>
                  <div className="pt-2 border-t">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">% Usado:</span>
                      <span className={cn(
                        "font-bold text-lg",
                        (summary.totalSpent / summary.totalBudget) * 100 > 100 ? "text-red-600" :
                          (summary.totalSpent / summary.totalBudget) * 100 > 80 ? "text-amber-600" : "text-green-600"
                      )}>
                        {((summary.totalSpent / summary.totalBudget) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Breakdown */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase">Estado por Categorías</h3>
                <div className="space-y-3">
                  {(() => {
                    const allCategories: MarketingCategory[] = [];
                    const collect = (cats: MarketingCategory[]) => {
                      cats.forEach(cat => {
                        allCategories.push(cat);
                        if (cat.children) collect(cat.children);
                      });
                    };
                    collect(categoryTree);

                    const statusCounts = allCategories.reduce((acc, cat) => {
                      const totals = getCategoryTotals(cat);
                      const badge = getStatusBadge(totals);
                      if (badge) {
                        acc[badge.status] = (acc[badge.status] || 0) + 1;
                      }
                      return acc;
                    }, {} as Record<string, number>);

                    return (
                      <>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <span className="text-sm">En línea:</span>
                          </div>
                          <span className="font-semibold">{statusCounts.ok || 0}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-amber-600" />
                            <span className="text-sm">Atención:</span>
                          </div>
                          <span className="font-semibold">{statusCounts.warning || 0}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <XCircle className="h-4 w-4 text-red-600" />
                            <span className="text-sm">Excedidos:</span>
                          </div>
                          <span className="font-semibold">{statusCounts.exceeded || 0}</span>
                        </div>
                        <div className="pt-2 border-t">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">Total Categorías:</span>
                            <span className="font-bold">{allCategories.length}</span>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Top Categories */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase">Top 5 Categorías</h3>
                <div className="space-y-2">
                  {categoryTree
                    .map(cat => {
                      const totals = getCategoryTotals(cat);
                      return { ...cat, totals };
                    })
                    .sort((a, b) => b.totals.totalSpent - a.totals.totalSpent)
                    .slice(0, 5)
                    .map((cat, idx) => (
                      <div key={cat.id} className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="text-muted-foreground font-medium">{idx + 1}.</span>
                          <span className="truncate">{cat.name}</span>
                        </div>
                        <span className="font-semibold ml-2">{cat.totals.totalSpent.toLocaleString('es-ES')} €</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts Section */}
      {showCharts && (
        <Card className="shadow-lg mb-4 border-0 bg-gradient-to-br from-slate-50 to-white">
          <CardHeader className="pb-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-t-lg">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold text-white">Análisis Visual</CardTitle>
                <p className="text-sm text-indigo-100 mt-1">Visualización interactiva de datos de marketing</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCharts(false)}
                className="text-white hover:bg-white/20"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Monthly Spending Chart */}
              <div className="bg-white rounded-xl p-6 shadow-md border border-slate-200 hover:shadow-xl transition-shadow duration-300">
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-slate-800 mb-1">Inversión Mensual</h3>
                  <p className="text-xs text-slate-500">Evolución del presupuesto a lo largo del año</p>
                </div>
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={months.map(month => {
                    const monthPlans = monthlyPlans.filter(p => p.month === month.key);
                    const estimated = monthPlans.reduce((sum, p) => sum + p.budgetAllocated, 0);
                    const spent = monthPlans.reduce((sum, p) => sum + getRealSpentForPlan(p.id), 0);
                    const projected = monthPlans.reduce((sum, p) => sum + getSmartProjectedForPlan(p.id), 0);
                    return {
                      mes: month.label,
                      Estimado: estimated,
                      Invertido: spent,
                      Proyectado: projected
                    };
                  })}>
                    <defs>
                      <linearGradient id="colorEstimado" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
                      </linearGradient>
                      <linearGradient id="colorInvertido" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
                      </linearGradient>
                      <linearGradient id="colorProyectado" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.6} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                    <XAxis
                      dataKey="mes"
                      tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }}
                      axisLine={{ stroke: '#cbd5e1' }}
                    />
                    <YAxis
                      tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }}
                      axisLine={{ stroke: '#cbd5e1' }}
                      tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                    />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        padding: '12px'
                      }}
                      formatter={(value: number) => [`${value.toLocaleString('es-ES')} €`, '']}
                      labelStyle={{ fontWeight: 600, color: '#1e293b', marginBottom: '4px' }}
                    />
                    <Legend
                      wrapperStyle={{ paddingTop: '20px' }}
                      iconType="circle"
                      formatter={(value) => <span style={{ color: '#475569', fontSize: '12px', fontWeight: 500 }}>{value}</span>}
                    />
                    <Area
                      type="monotone"
                      dataKey="Estimado"
                      stackId="1"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      fill="url(#colorEstimado)"
                      animationDuration={800}
                    />
                    <Area
                      type="monotone"
                      dataKey="Invertido"
                      stackId="2"
                      stroke="#10b981"
                      strokeWidth={2}
                      fill="url(#colorInvertido)"
                      animationDuration={800}
                    />
                    <Area
                      type="monotone"
                      dataKey="Proyectado"
                      stroke="#8b5cf6"
                      strokeWidth={2.5}
                      fill="url(#colorProyectado)"
                      animationDuration={800}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Category Spending Chart */}
              <div className="bg-white rounded-xl p-6 shadow-md border border-slate-200 hover:shadow-xl transition-shadow duration-300">
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-slate-800 mb-1">Top 10 Categorías</h3>
                  <p className="text-xs text-slate-500">Categorías con mayor inversión</p>
                </div>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={categoryTree
                    .map(cat => {
                      const totals = getCategoryTotals(cat);
                      return {
                        nombre: cat.name.length > 20 ? cat.name.substring(0, 20) + '...' : cat.name,
                        Invertido: totals.totalSpent,
                        Estimado: totals.totalEstimated,
                        Presupuesto: totals.assignedBudget > 0 ? totals.assignedBudget : totals.totalEstimated
                      };
                    })
                    .sort((a, b) => b.Invertido - a.Invertido)
                    .slice(0, 10)
                    .reverse()}>
                    <defs>
                      <linearGradient id="colorPresupuesto" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#a855f7" stopOpacity={0.9} />
                        <stop offset="95%" stopColor="#a855f7" stopOpacity={0.6} />
                      </linearGradient>
                      <linearGradient id="colorEstimadoBar" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.9} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.6} />
                      </linearGradient>
                      <linearGradient id="colorInvertidoBar" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.9} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.6} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} vertical={false} />
                    <XAxis
                      dataKey="nombre"
                      angle={-45}
                      textAnchor="end"
                      height={100}
                      tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
                      axisLine={{ stroke: '#cbd5e1' }}
                    />
                    <YAxis
                      tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }}
                      axisLine={{ stroke: '#cbd5e1' }}
                      tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                    />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        padding: '12px'
                      }}
                      formatter={(value: number) => [`${value.toLocaleString('es-ES')} €`, '']}
                      labelStyle={{ fontWeight: 600, color: '#1e293b', marginBottom: '4px' }}
                    />
                    <Legend
                      wrapperStyle={{ paddingTop: '20px' }}
                      iconType="circle"
                      formatter={(value) => <span style={{ color: '#475569', fontSize: '12px', fontWeight: 500 }}>{value}</span>}
                    />
                    <Bar
                      dataKey="Presupuesto"
                      fill="url(#colorPresupuesto)"
                      radius={[4, 4, 0, 0]}
                      animationDuration={800}
                    />
                    <Bar
                      dataKey="Estimado"
                      fill="url(#colorEstimadoBar)"
                      radius={[4, 4, 0, 0]}
                      animationDuration={800}
                    />
                    <Bar
                      dataKey="Invertido"
                      fill="url(#colorInvertidoBar)"
                      radius={[4, 4, 0, 0]}
                      animationDuration={800}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Quarterly Comparison */}
              <div className="bg-white rounded-xl p-6 shadow-md border border-slate-200 hover:shadow-xl transition-shadow duration-300">
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-slate-800 mb-1">Comparación Trimestral</h3>
                  <p className="text-xs text-slate-500">Estimado vs Invertido por trimestre</p>
                </div>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={quarters.map(quarter => {
                    const quarterPlans = monthlyPlans.filter(p =>
                      quarter.months.some(m => m.key === p.month)
                    );
                    const estimated = quarterPlans.reduce((sum, p) => sum + p.budgetAllocated, 0);
                    const spent = quarterPlans.reduce((sum, p) => sum + getRealSpentForPlan(p.id), 0);
                    return {
                      trimestre: quarter.quarter,
                      Estimado: estimated,
                      Invertido: spent
                    };
                  })}>
                    <defs>
                      <linearGradient id="colorEstimadoQ" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.9} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.6} />
                      </linearGradient>
                      <linearGradient id="colorInvertidoQ" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.9} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.6} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} vertical={false} />
                    <XAxis
                      dataKey="trimestre"
                      tick={{ fill: '#64748b', fontSize: 13, fontWeight: 600 }}
                      axisLine={{ stroke: '#cbd5e1' }}
                    />
                    <YAxis
                      tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }}
                      axisLine={{ stroke: '#cbd5e1' }}
                      tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                    />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        padding: '12px'
                      }}
                      formatter={(value: number) => [`${value.toLocaleString('es-ES')} €`, '']}
                      labelStyle={{ fontWeight: 600, color: '#1e293b', marginBottom: '4px' }}
                    />
                    <Legend
                      wrapperStyle={{ paddingTop: '20px' }}
                      iconType="circle"
                      formatter={(value) => <span style={{ color: '#475569', fontSize: '12px', fontWeight: 500 }}>{value}</span>}
                    />
                    <Bar
                      dataKey="Estimado"
                      fill="url(#colorEstimadoQ)"
                      radius={[6, 6, 0, 0]}
                      animationDuration={800}
                    />
                    <Bar
                      dataKey="Invertido"
                      fill="url(#colorInvertidoQ)"
                      radius={[6, 6, 0, 0]}
                      animationDuration={800}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Budget Usage Chart */}
              <div className="bg-white rounded-xl p-6 shadow-md border border-slate-200 hover:shadow-xl transition-shadow duration-300">
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-slate-800 mb-1">Uso del Presupuesto</h3>
                  <p className="text-xs text-slate-500">Comparación general de presupuestos</p>
                </div>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={[
                    {
                      tipo: 'Presupuesto',
                      valor: summary.totalBudget
                    },
                    {
                      tipo: 'Estimado',
                      valor: summary.totalAllocated
                    },
                    {
                      tipo: 'Invertido',
                      valor: summary.totalSpent
                    },
                    {
                      tipo: 'Proyectado',
                      valor: monthlyPlans.reduce((sum, p) => sum + getSmartProjectedForPlan(p.id), 0)
                    }
                  ]}>
                    <defs>
                      <linearGradient id="colorLine" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#8b5cf6" stopOpacity={1} />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity={1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                    <XAxis
                      dataKey="tipo"
                      tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
                      axisLine={{ stroke: '#cbd5e1' }}
                    />
                    <YAxis
                      tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }}
                      axisLine={{ stroke: '#cbd5e1' }}
                      tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                    />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        padding: '12px'
                      }}
                      formatter={(value: number) => [`${value.toLocaleString('es-ES')} €`, '']}
                      labelStyle={{ fontWeight: 600, color: '#1e293b', marginBottom: '4px' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="valor"
                      stroke="url(#colorLine)"
                      strokeWidth={4}
                      dot={{ fill: '#8b5cf6', r: 6, strokeWidth: 2, stroke: '#fff' }}
                      activeDot={{ r: 8, strokeWidth: 2, stroke: '#fff' }}
                      animationDuration={800}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Show Charts Button */}
      {!showCharts && (
        <div className="mb-4">
          <Button
            variant="outline"
            onClick={() => setShowCharts(true)}
            className="w-full"
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Mostrar Gráficos de Análisis
          </Button>
        </div>
      )}

      {/* Matrix Table */}
      <Card className="shadow-sm print:shadow-none print:border-0">
        <CardHeader className="pb-3 space-y-3">
          {/* Header Row 1: Title and Actions */}
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              Control de Inversión - {currentBudget.year}
            </CardTitle>
            <div className="flex items-center gap-2">
              {/* View Toggle */}
              <div className="flex rounded-lg border overflow-hidden">
                <Button
                  variant={viewMode === 'current-month' ? 'default' : 'ghost'}
                  size="sm"
                  className="rounded-none h-7 text-xs"
                  onClick={() => setViewMode('current-month')}
                  title="Vista del mes actual"
                >
                  <Calendar className="h-3.5 w-3.5 mr-1" />
                  Mes Actual
                </Button>
                <Button
                  variant={viewMode === 'quarterly-expanded' ? 'default' : 'ghost'}
                  size="sm"
                  className="rounded-none h-7 text-xs border-l"
                  onClick={() => setViewMode('quarterly-expanded')}
                  title={`Vista trimestral expandible - ${allQuarters.find(q => parseInt(q.quarter.substring(1)) === displayQuarter)?.quarter || 'Trimestre actual'}`}
                >
                  <Layers className="h-3.5 w-3.5 mr-1" />
                  Trimestres {allQuarters.find(q => parseInt(q.quarter.substring(1)) === displayQuarter) && `(${allQuarters.find(q => parseInt(q.quarter.substring(1)) === displayQuarter)?.quarter})`}
                </Button>
                <Button
                  variant={viewMode === 'monthly' ? 'default' : 'ghost'}
                  size="sm"
                  className="rounded-none h-7 text-xs border-l"
                  onClick={() => setViewMode('monthly')}
                  title="Vista mensual completa"
                >
                  Mensual
                </Button>
                <Button
                  variant={viewMode === 'quarterly' ? 'default' : 'ghost'}
                  size="sm"
                  className="rounded-none h-7 text-xs border-l"
                  onClick={() => setViewMode('quarterly')}
                  title="Vista trimestral resumida"
                >
                  <BarChart3 className="h-3.5 w-3.5 mr-1" />
                  Resumen
                </Button>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setQuickAddDialog({ open: true, parentId: null, parentName: '' })}
                className="gap-1 h-7"
              >
                <Plus className="h-3.5 w-3.5" />
                Nueva categoría
              </Button>
            </div>
          </div>

          {/* Header Row 2: Search and Filters */}
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar categoría... (Ctrl+K)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 h-8 text-sm"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  title="Limpiar búsqueda (Esc)"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Filter: Hide Empty */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={hideEmpty ? "default" : "outline"}
                    size="sm"
                    className="h-8 gap-1"
                    onClick={() => setHideEmpty(!hideEmpty)}
                  >
                    {hideEmpty ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    {hideEmpty ? "Mostrando activas" : "Ocultar vacías"}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Ocultar categorías sin presupuesto ni gastos en la vista actual</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Status Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1">
                  <Filter className="h-3.5 w-3.5" />
                  {filterStatus === 'all' ? 'Todos' :
                    filterStatus === 'ok' ? 'En línea' :
                      filterStatus === 'warning' ? 'Atención' : 'Excedidos'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setFilterStatus('all')}>
                  Todos los estados
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterStatus('ok')}>
                  <CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
                  En línea
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterStatus('warning')}>
                  <AlertTriangle className="h-4 w-4 mr-2 text-amber-600" />
                  Atención
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterStatus('exceeded')}>
                  <XCircle className="h-4 w-4 mr-2 text-red-600" />
                  Excedidos
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Compact View Toggle */}
            {viewMode === 'monthly' && (
              <Button
                variant="outline"
                size="sm"
                className="h-8"
                onClick={() => setCompactView(compactView === 'full' ? 'compact' : 'full')}
              >
                {compactView === 'full' ? 'Vista Compacta' : 'Vista Completa'}
              </Button>
            )}

            {/* Export Button */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1">
                  <Download className="h-3.5 w-3.5" />
                  Exportar
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => exportToCSV()}>
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Exportar a CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportToCSV(true)}>
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Exportar detallado (con meses)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.print()}>
                  <Printer className="h-4 w-4 mr-2" />
                  Imprimir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Executive Summary Toggle */}
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1"
              onClick={() => setShowExecutiveSummary(!showExecutiveSummary)}
            >
              <Presentation className="h-3.5 w-3.5" />
              {showExecutiveSummary ? 'Ocultar' : 'Resumen'} Ejecutivo
            </Button>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 p-3 bg-slate-50 rounded-lg text-xs border border-slate-200">
            <div className="flex items-center gap-1.5">
              <Info className="h-3.5 w-3.5 text-slate-500" />
              <span className="font-medium text-slate-700">Leyenda:</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-purple-100 border border-purple-300" />
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-slate-600 cursor-help">Pres. Asig. = Presupuesto anual asignado</span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">
                      <strong>Presupuesto Anual Asignado</strong><br />
                      Presupuesto total asignado a esta categoría para todo el año. Útil cuando tienes presupuesto trimestral (ej: 3000€ en Q4) pero aún no has definido el desglose mensual.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-blue-100 border border-blue-300" />
              <span className="text-slate-600">Total Est. = Suma de estimados mensuales</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-green-100 border border-green-300" />
              <span className="text-slate-600">Total Inv. = Gastos reales (sin estimados)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-blue-100 border border-blue-300" />
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-slate-600 cursor-help">Total Proy. = Proyección Inteligente</span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">
                      <strong>Total Proyectado (Inteligente)</strong><br />
                      Si hay gastos finales, muestra solo esos. Si no hay gastos finales, muestra la última actualización estimada del mes. Los estimados son "snapshots" de consumo hasta una fecha específica.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-amber-100 border border-amber-300" />
              <span className="text-slate-600">Disp. Real = Sin estimados</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-blue-100 border border-blue-300" />
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-slate-600 cursor-help">Disp. Proy. = Disponible inteligente</span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">
                      <strong>Disponible Proyectado (Inteligente)</strong><br />
                      Si hay gastos finales, muestra el disponible real. Si no hay gastos finales, muestra el disponible basado en la última actualización estimada del mes.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="flex items-center gap-1.5 ml-auto">
              <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
              <span className="text-slate-600">En línea</span>
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600 ml-2" />
              <span className="text-slate-600">Atención</span>
              <XCircle className="h-3.5 w-3.5 text-red-600 ml-2" />
              <span className="text-slate-600">Excedido</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {viewMode === 'monthly' ? (
            // MONTHLY VIEW
            <ScrollArea className="w-full">
              <div className="min-w-max">
                {/* Header */}
                <div className="flex border-b bg-slate-100 sticky top-0 z-20 text-xs font-medium">
                  <div className="min-w-[300px] w-[300px] sticky left-0 bg-slate-100 z-30 border-r px-2 py-2">
                    <button
                      onClick={() => handleSort('name')}
                      className="flex items-center gap-1 hover:text-primary transition-colors w-full text-left"
                    >
                      Categoría
                      <ArrowUpDown className={cn(
                        "h-3 w-3",
                        sortConfig?.key === 'name' ? "opacity-100" : "opacity-30"
                      )} />
                    </button>
                  </div>
                  <div className="w-[80px] border-r px-2 py-2 text-center bg-purple-100/50">
                    <TooltipProvider delayDuration={300}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => handleSort('assignedBudget')}
                            className="flex items-center justify-center gap-1 hover:text-primary transition-colors w-full"
                          >
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="cursor-help">Pres. Asig.</span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="max-w-xs">
                                    <strong>Presupuesto Anual Asignado</strong><br />
                                    Presupuesto total asignado a esta categoría para todo el año. Útil cuando tienes presupuesto trimestral (ej: 3000€ en Q4) pero aún no has definido el desglose mensual.
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <ArrowUpDown className={cn(
                              "h-3 w-3",
                              sortConfig?.key === 'assignedBudget' ? "opacity-100" : "opacity-30"
                            )} />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Presupuesto anual asignado a la categoría</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <div className="w-[80px] border-r px-2 py-2 text-center bg-blue-100/50">
                    <TooltipProvider delayDuration={300}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => handleSort('totalEstimated')}
                            className="flex items-center justify-center gap-1 hover:text-primary transition-colors w-full"
                          >
                            <span className="cursor-help">Total Est.</span>
                            <ArrowUpDown className={cn(
                              "h-3 w-3",
                              sortConfig?.key === 'totalEstimated' ? "opacity-100" : "opacity-30"
                            )} />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Suma de todos los estimados mensuales</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <div className="w-[80px] border-r px-2 py-2 text-center bg-green-100/50">
                    <TooltipProvider delayDuration={300}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => handleSort('totalSpent')}
                            className="flex items-center justify-center gap-1 hover:text-primary transition-colors w-full"
                          >
                            <span className="cursor-help">Total Inv.</span>
                            <ArrowUpDown className={cn(
                              "h-3 w-3",
                              sortConfig?.key === 'totalSpent' ? "opacity-100" : "opacity-30"
                            )} />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Gastos reales confirmados (sin estimados)</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <div className="w-[80px] border-r px-2 py-2 text-center bg-blue-100/50">
                    <TooltipProvider delayDuration={300}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="cursor-help">Total Proy.</span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">
                            <strong>Total Proyectado (Inteligente)</strong><br />
                            Si hay gastos finales, muestra solo esos. Si no hay gastos finales, muestra la última actualización estimada del mes. Los estimados son "snapshots" de consumo hasta una fecha específica.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <div className="w-[80px] border-r px-2 py-2 text-center bg-amber-100/50">
                    <TooltipProvider delayDuration={300}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => handleSort('remainder')}
                            className="flex items-center justify-center gap-1 hover:text-primary transition-colors w-full"
                          >
                            <span className="cursor-help">Disp. Real</span>
                            <ArrowUpDown className={cn(
                              "h-3 w-3",
                              sortConfig?.key === 'remainder' ? "opacity-100" : "opacity-30"
                            )} />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Disponible sin contar gastos estimados</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <div className="w-[80px] border-r px-2 py-2 text-center bg-blue-100/50">
                    <TooltipProvider delayDuration={300}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="cursor-help">Disp. Proy.</span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">
                            <strong>Disponible Proyectado (Inteligente)</strong><br />
                            Si hay gastos finales, muestra el disponible real. Si no hay gastos finales, muestra el disponible basado en la última actualización estimada del mes.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  {months.map(month => (
                    <div key={month.key} className="flex border-r min-w-[100px]">
                      <div className="w-[50px] px-1 py-2 text-center border-r border-dashed text-[10px] uppercase bg-blue-50/30">
                        Est
                      </div>
                      <div className="w-[50px] px-1 py-2 text-center text-[10px] uppercase bg-green-50/30">
                        Inv
                      </div>
                    </div>
                  ))}
                </div>

                {/* Month labels row */}
                <div className="flex border-b bg-slate-50 text-[10px] text-slate-500">
                  <div className="min-w-[300px] w-[300px] sticky left-0 bg-slate-50 z-10 border-r" />
                  {compactView === 'full' && (
                    <>
                      <div className="w-[80px] border-r" />
                      <div className="w-[80px] border-r" />
                      <div className="w-[80px] border-r" />
                      <div className="w-[80px] border-r" />
                      <div className="w-[80px] border-r" />
                      <div className="w-[80px] border-r" />
                    </>
                  )}
                  {compactView === 'compact' && (
                    <>
                      <div className="w-[100px] border-r" />
                      <div className="w-[100px] border-r" />
                      <div className="w-[100px] border-r" />
                      <div className="w-[100px] border-r" />
                    </>
                  )}
                  {months.map(month => (
                    <div key={month.key} className="min-w-[100px] px-2 py-1 text-center border-r capitalize font-medium">
                      {month.label}
                    </div>
                  ))}
                </div>

                {/* Body */}
                <div>
                  {(() => {
                    const filtered = filterCategories(categoryTree).filter(cat => shouldShowCategory(cat));
                    if (filtered.length === 0) {
                      return (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                          <Search className="h-12 w-12 text-slate-300 mb-4" />
                          <p className="text-slate-500 font-medium">No se encontraron categorías</p>
                          <p className="text-sm text-slate-400 mt-1">
                            {searchTerm ? `Buscando: "${searchTerm}"` : 'Intenta ajustar los filtros'}
                          </p>
                          {(searchTerm || filterStatus !== 'all') && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-4"
                              onClick={() => {
                                setSearchTerm('');
                                setFilterStatus('all');
                              }}
                            >
                              Limpiar filtros
                            </Button>
                          )}
                        </div>
                      );
                    }
                    return filtered.map(category => renderCategoryRow(category));
                  })()}
                </div>

                {/* Totals Row */}
                <div className="flex border-t-2 border-slate-300 bg-gradient-to-r from-slate-200 to-slate-100 font-semibold text-sm">
                  <div className="min-w-[300px] w-[300px] sticky left-0 bg-slate-200 z-10 border-r px-2 py-2">
                    TOTAL
                  </div>
                  {compactView === 'full' ? (
                    <>
                      <div className="w-[80px] border-r px-2 py-2 text-right bg-purple-200/50">
                        {summary.totalBudget.toLocaleString('es-ES')}
                      </div>
                      <div className="w-[80px] border-r px-2 py-2 text-right bg-blue-200/50">
                        {summary.totalAllocated.toLocaleString('es-ES')}
                      </div>
                      <div className="w-[80px] border-r px-2 py-2 text-right bg-green-200/50">
                        {summary.totalSpent.toLocaleString('es-ES')}
                      </div>
                      <div className="w-[80px] border-r px-2 py-2 text-right bg-blue-200/50">
                        {monthlyPlans.reduce((sum, p) => sum + getRealSpentForPlan(p.id) + getEstimatedForPlan(p.id), 0).toLocaleString('es-ES')}
                      </div>
                      <div className="w-[80px] border-r px-2 py-2 text-right bg-amber-200/50">
                        {summary.totalRemaining.toLocaleString('es-ES')}
                      </div>
                      <div className="w-[80px] border-r px-2 py-2 text-right bg-blue-200/50">
                        {(summary.totalBudget - monthlyPlans.reduce((sum, p) => sum + getRealSpentForPlan(p.id) + getEstimatedForPlan(p.id), 0)).toLocaleString('es-ES')}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-[100px] border-r px-2 py-2 text-right bg-purple-200/50">
                        {summary.totalBudget.toLocaleString('es-ES')}
                      </div>
                      <div className="w-[100px] border-r px-2 py-2 text-right bg-blue-200/50">
                        {summary.totalAllocated.toLocaleString('es-ES')}
                      </div>
                      <div className="w-[100px] border-r px-2 py-2 text-right bg-green-200/50">
                        {summary.totalSpent.toLocaleString('es-ES')}
                      </div>
                      <div className="w-[100px] border-r px-2 py-2 text-right bg-amber-200/50">
                        {summary.totalRemaining.toLocaleString('es-ES')}
                      </div>
                    </>
                  )}
                  {months.map(month => {
                    const monthPlans = monthlyPlans.filter(p => p.month === month.key);
                    const monthEst = monthPlans.reduce((sum, p) => sum + p.budgetAllocated, 0);
                    const monthSpent = monthPlans.reduce((sum, p) => sum + getRealSpentForPlan(p.id), 0);
                    return (
                      <div key={month.key} className="flex border-r min-w-[100px]">
                        <div className="w-[50px] px-1 py-2 text-right text-xs border-r border-dashed bg-blue-100/30">
                          {monthEst > 0 ? monthEst.toLocaleString('es-ES') : '-'}
                        </div>
                        <div className="w-[50px] px-1 py-2 text-right text-xs bg-green-100/30">
                          {monthSpent > 0 ? monthSpent.toLocaleString('es-ES') : '-'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          ) : viewMode === 'current-month' && currentMonth ? (
            // CURRENT MONTH VIEW - Focus on current month
            <div className="p-4">
              <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-blue-900">
                      {months.find(m => m.key === currentMonth)?.fullLabel}
                    </h3>
                    <p className="text-sm text-blue-700">Vista enfocada en el mes actual</p>
                  </div>
                  <Badge className="bg-blue-600">Mes Actual</Badge>
                </div>
              </div>
              <ScrollArea className="w-full">
                <div className="min-w-max">
                  {/* Header */}
                  <div className="flex border-b bg-slate-100 sticky top-0 z-20 text-xs font-medium">
                    <div className="min-w-[300px] w-[300px] sticky left-0 bg-slate-100 z-30 border-r px-2 py-2">
                      Categoría
                    </div>
                    <div className="w-[100px] border-r px-2 py-2 text-center bg-purple-100/50">Pres. Asig.</div>
                    <div className="w-[100px] border-r px-2 py-2 text-center bg-blue-100/50">Est. Mes</div>
                    <div className="w-[100px] border-r px-2 py-2 text-center bg-green-100/50">Inv. Mes</div>
                    <div className="w-[100px] border-r px-2 py-2 text-center bg-blue-100/50">Proy. Mes</div>
                    <div className="w-[100px] border-r px-2 py-2 text-center bg-amber-100/50">Disp. Real</div>
                    <div className="w-[100px] border-r px-2 py-2 text-center bg-blue-100/50">Disp. Proy.</div>
                    <div className="w-[100px] border-r px-2 py-2 text-center bg-slate-100/50">Total Est.</div>
                    <div className="w-[100px] border-r px-2 py-2 text-center bg-slate-100/50">Total Inv.</div>
                  </div>

                  {/* Body */}
                  <div>
                    {filterCategories(categoryTree)
                      .filter(cat => shouldShowCategory(cat))
                      .map(category => {
                        const renderCategoryRow = (cat: MarketingCategory, level: number = 0) => {
                          const plan = getMonthlyPlanForCategory(cat.id, currentMonth);
                          const monthEst = plan?.budgetAllocated ?? 0;
                          const monthSpent = plan ? getRealSpentForPlan(plan.id) : 0;
                          const monthProjected = plan ? getSmartProjectedForPlan(plan.id) : 0;
                          const totals = getCategoryTotals(cat);
                          const badge = getStatusBadge(totals);
                          const hasChildren = cat.children && cat.children.length > 0;
                          const isExpanded = expandedCategories.has(cat.id);

                          return (
                            <div key={cat.id}>
                              <div className={cn(
                                "flex border-b group hover:bg-slate-50/50",
                                !cat.parentId && "bg-gradient-to-r from-emerald-50 to-white"
                              )}>
                                <div className={cn(
                                  "min-w-[300px] w-[300px] sticky left-0 z-10 border-r flex items-center gap-2 py-2 px-3",
                                  !cat.parentId ? "bg-gradient-to-r from-emerald-50 to-emerald-50/50" : "bg-white"
                                )}>
                                  <div style={{ paddingLeft: `${level * 20}px` }} className="flex items-center gap-2 flex-1">
                                    {hasChildren && (
                                      <button
                                        onClick={() => toggleExpanded(cat.id)}
                                        className="p-0.5 rounded hover:bg-slate-200 flex-shrink-0"
                                      >
                                        {isExpanded ? (
                                          <ChevronDown className="h-4 w-4 text-slate-500" />
                                        ) : (
                                          <ChevronRight className="h-4 w-4 text-slate-500" />
                                        )}
                                      </button>
                                    )}
                                    {!hasChildren && <div className="w-5 flex-shrink-0" />}

                                    <span className={cn(
                                      "text-sm flex-1 truncate",
                                      !cat.parentId ? "font-semibold text-emerald-900" : "text-slate-700"
                                    )}>
                                      {cat.name}
                                    </span>

                                    {badge && (
                                      <Badge variant="outline" className={cn("h-5 px-1.5 text-[10px] flex-shrink-0", badge.color)}>
                                        <badge.icon className="h-3 w-3 mr-0.5" />
                                        {badge.label}
                                      </Badge>
                                    )}

                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                                      onClick={() => setSelectedCategoryDetail(cat.id)}
                                      title="Ver detalle completo"
                                    >
                                      <Eye className="h-3.5 w-3.5 text-slate-500" />
                                    </Button>
                                  </div>
                                </div>
                                <div className="w-[100px] border-r px-2 py-2 text-right text-sm">
                                  {totals.assignedBudget > 0 ? totals.assignedBudget.toLocaleString('es-ES') : '-'}
                                </div>
                                <div
                                  className="w-[100px] border-r px-2 py-2 text-right text-sm font-medium text-blue-700 cursor-pointer hover:bg-blue-50 transition-colors"
                                  onClick={() => openTransferModal(cat.id, currentMonth, plan?.id)}
                                  title="Click para asignar presupuesto"
                                >
                                  {monthEst > 0 ? monthEst.toLocaleString('es-ES') : '-'}
                                </div>
                                <div
                                  className="w-[100px] border-r px-2 py-2 text-right text-sm font-medium text-green-700 cursor-pointer hover:bg-green-50 transition-colors"
                                  onClick={async () => {
                                    if (plan) {
                                      openExpensesModal(plan.id, cat.name, months.find(m => m.key === currentMonth)?.label || '');
                                    } else {
                                      // Create plan if it doesn't exist
                                      try {
                                        const newPlan = await getOrCreateMonthlyPlan(cat.id, currentMonth);
                                        if (newPlan) {
                                          openExpensesModal(newPlan.id, cat.name, months.find(m => m.key === currentMonth)?.label || '');
                                        }
                                      } catch (error) {
                                        console.error("Error creating plan:", error);
                                      }
                                    }
                                  }}
                                  title="Click para ver/añadir gastos"
                                >
                                  {monthSpent > 0 ? monthSpent.toLocaleString('es-ES') : '-'}
                                </div>
                                <div className="w-[100px] border-r px-2 py-2 text-right text-sm font-medium text-blue-700">
                                  {monthProjected > 0 ? monthProjected.toLocaleString('es-ES') : '-'}
                                </div>
                                <div className={cn(
                                  "w-[100px] border-r px-2 py-2 text-right text-sm font-medium",
                                  (monthEst - monthSpent) < 0 ? "text-red-600" : "text-amber-700"
                                )}>
                                  {(monthEst - monthSpent).toLocaleString('es-ES')}
                                </div>
                                <div className={cn(
                                  "w-[100px] border-r px-2 py-2 text-right text-sm font-medium",
                                  (monthEst - monthProjected) < 0 ? "text-red-600" : "text-blue-700"
                                )}>
                                  {(monthEst - monthProjected).toLocaleString('es-ES')}
                                </div>
                                <div className="w-[100px] border-r px-2 py-2 text-right text-sm text-slate-600">
                                  {totals.totalEstimated > 0 ? totals.totalEstimated.toLocaleString('es-ES') : '-'}
                                </div>
                                <div className="w-[100px] border-r px-2 py-2 text-right text-sm text-slate-600">
                                  {totals.totalSpent > 0 ? totals.totalSpent.toLocaleString('es-ES') : '-'}
                                </div>
                              </div>
                              {hasChildren && isExpanded && cat.children && (
                                <div>
                                  {cat.children
                                    .filter(child => {
                                      const childFiltered = filterCategories([child]);
                                      return childFiltered.length > 0 && shouldShowCategory(child);
                                    })
                                    .map(child => renderCategoryRow(child, level + 1))}
                                </div>
                              )}
                            </div>
                          );
                        };

                        return renderCategoryRow(category);
                      })}
                  </div>
                </div>
              </ScrollArea>
            </div>
          ) : viewMode === 'quarterly-expanded' ? (
            // QUARTERLY EXPANDED VIEW - Quarters with expandable months
            <div>
              {/* Quarter Navigation */}
              <div className="mb-4 p-3 bg-cyan-50 rounded-lg border border-cyan-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={goToPreviousQuarter}
                      disabled={displayQuarter === 1}
                      className="h-8"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex items-center gap-2">
                      {allQuarters.map(q => {
                        const quarterNum = parseInt(q.quarter.substring(1));
                        const isActive = quarterNum === displayQuarter;
                        const isCurrent = quarterNum === currentQuarter;
                        return (
                          <Button
                            key={q.quarter}
                            variant={isActive ? "default" : "outline"}
                            size="sm"
                            onClick={() => goToQuarter(quarterNum)}
                            className={cn(
                              "h-8 min-w-[60px]",
                              isActive && "bg-cyan-600 hover:bg-cyan-700",
                              isCurrent && !isActive && "border-cyan-400"
                            )}
                          >
                            {q.quarter}
                            {isCurrent && (
                              <span className="ml-1 text-xs">●</span>
                            )}
                          </Button>
                        );
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={goToNextQuarter}
                      disabled={displayQuarter === 4}
                      className="h-8"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedQuarter !== null && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={goToCurrentQuarter}
                        className="h-8 text-xs"
                      >
                        <Calendar className="h-3.5 w-3.5 mr-1" />
                        Ir a Trimestre Actual
                      </Button>
                    )}
                    <div className="text-sm text-slate-600">
                      {allQuarters.find(q => parseInt(q.quarter.substring(1)) === displayQuarter)?.label}
                    </div>
                  </div>
                </div>
              </div>
              <ScrollArea className="w-full">
                <div className="min-w-max">
                  {/* Header */}
                  <div className="flex border-b bg-slate-100 sticky top-0 z-20 text-xs font-medium">
                    <div className="min-w-[300px] w-[300px] sticky left-0 bg-slate-100 z-30 border-r px-2 py-2">
                      Categoría
                    </div>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="w-[80px] border-r px-2 py-2 text-center bg-purple-100/50 cursor-help">
                            Pres. Asig.
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">
                            <strong>Presupuesto Anual Asignado</strong><br />
                            Presupuesto total asignado a esta categoría para todo el año. Útil cuando tienes presupuesto trimestral (ej: 3000€ en Q4) pero aún no has definido el desglose mensual.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <div className="w-[80px] border-r px-2 py-2 text-center bg-blue-100/50">Total Est.</div>
                    <div className="w-[80px] border-r px-2 py-2 text-center bg-green-100/50">Total Inv.</div>
                    <div className="w-[80px] border-r px-2 py-2 text-center bg-blue-100/50">Total Proy.</div>
                    <div className="w-[80px] border-r px-2 py-2 text-center bg-amber-100/50">Disp. Real</div>
                    <div className="w-[80px] border-r px-2 py-2 text-center bg-blue-100/50">Disp. Proy.</div>
                    {quarters.map(quarter => {
                      const isExpanded = expandedQuarters.has(quarter.quarter);
                      return (
                        <div key={quarter.quarter} className={cn(
                          "flex border-r transition-all duration-200",
                          isExpanded ? "min-w-[300px]" : "min-w-[120px]"
                        )}>
                          <button
                            onClick={() => toggleQuarter(quarter.quarter)}
                            className="w-full px-1 py-2 text-center bg-cyan-100/50 border-b border-cyan-200 hover:bg-cyan-200/50 flex items-center justify-center gap-2 group"
                          >
                            {isExpanded ? <ChevronDown className="h-4 w-4 text-cyan-700" /> : <ChevronRight className="h-4 w-4 text-cyan-700" />}
                            <span className="font-semibold text-cyan-900">{quarter.quarter}</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {/* Quarter headers with expand/collapse */}
                  <div className="flex border-b bg-slate-50 text-[10px] text-slate-500">
                    <div className="min-w-[300px] w-[300px] sticky left-0 bg-slate-50 z-10 border-r" />
                    <div className="w-[80px] border-r" />
                    <div className="w-[80px] border-r" />
                    <div className="w-[80px] border-r" />
                    <div className="w-[80px] border-r" />
                    <div className="w-[80px] border-r" />
                    <div className="w-[80px] border-r" />
                    {quarters.map(quarter => {
                      const isExpanded = expandedQuarters.has(quarter.quarter);
                      return (
                        <div key={quarter.quarter} className={cn(
                          "flex border-r transition-all duration-200",
                          isExpanded ? "min-w-[300px]" : "min-w-[120px]"
                        )}>
                          {isExpanded ? (
                            <div className="flex w-full">
                              {quarter.months.map(m => (
                                <div key={m.key} className="w-[100px] flex flex-col border-r last:border-r-0">
                                  <div className="px-1 py-1 text-center font-medium capitalize bg-slate-50 text-slate-600 border-b">
                                    {m.label}
                                  </div>
                                  <div className="flex h-full">
                                    <div className="w-[50px] border-r border-dashed text-center text-[9px] text-blue-400 bg-blue-50/20">EST</div>
                                    <div className="w-[50px] text-center text-[9px] text-green-400 bg-green-50/20">INV</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <button
                              onClick={() => toggleQuarter(quarter.quarter)}
                              className="w-full px-2 py-1.5 text-center hover:bg-cyan-100 transition-colors flex items-center justify-center gap-1 text-slate-400 hover:text-cyan-700"
                            >
                              <span className="text-[10px] uppercase">Ver detalle</span>
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Body - Render category rows with quarter columns */}
                  <div>
                    {filterCategories(categoryTree)
                      .filter(cat => shouldShowCategory(cat))
                      .map(category => {
                        const totals = getCategoryTotals(category);
                        const hasChildren = category.children && category.children.length > 0;
                        const isExpanded = expandedCategories.has(category.id);
                        const badge = getStatusBadge(totals);

                        return (
                          <div key={category.id}>
                            {/* Main row */}
                            <div className={cn(
                              "flex border-b group hover:bg-slate-50/50",
                              !category.parentId && "bg-gradient-to-r from-emerald-50 to-white"
                            )}>
                              {/* Category name column */}
                              <div className={cn(
                                "min-w-[300px] w-[300px] sticky left-0 z-10 border-r flex items-center gap-2 py-2 px-3",
                                !category.parentId ? "bg-gradient-to-r from-emerald-50 to-emerald-50/50" : "bg-white"
                              )}>
                                {hasChildren && (
                                  <button
                                    onClick={() => toggleExpanded(category.id)}
                                    className="p-0.5 rounded hover:bg-slate-200 flex-shrink-0"
                                  >
                                    {isExpanded ? (
                                      <ChevronDown className="h-4 w-4 text-slate-500" />
                                    ) : (
                                      <ChevronRight className="h-4 w-4 text-slate-500" />
                                    )}
                                  </button>
                                )}
                                {!hasChildren && <div className="w-5 flex-shrink-0" />}

                                <span className={cn(
                                  "text-sm flex-1 truncate",
                                  !category.parentId ? "font-semibold text-emerald-900" : "text-slate-700"
                                )}>
                                  {category.name}
                                </span>

                                {badge && (
                                  <Badge variant="outline" className={cn("h-5 px-1.5 text-[10px] flex-shrink-0", badge.color)}>
                                    <badge.icon className="h-3 w-3 mr-0.5" />
                                    {badge.label}
                                  </Badge>
                                )}

                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                                  onClick={() => setSelectedCategoryDetail(category.id)}
                                  title="Ver detalle completo"
                                >
                                  <Eye className="h-3.5 w-3.5 text-slate-500" />
                                </Button>
                              </div>

                              {/* Summary columns */}
                              <div className="w-[80px] border-r px-2 py-2 text-right text-sm">
                                {totals.assignedBudget > 0 ? totals.assignedBudget.toLocaleString('es-ES') : '-'}
                              </div>
                              <div className="w-[80px] border-r px-2 py-2 text-right text-sm text-blue-700">
                                {totals.totalEstimated > 0 ? totals.totalEstimated.toLocaleString('es-ES') : '-'}
                              </div>
                              <div className="w-[80px] border-r px-2 py-2 text-right text-sm text-green-700">
                                {totals.totalSpent > 0 ? totals.totalSpent.toLocaleString('es-ES') : '-'}
                              </div>
                              <div className="w-[80px] border-r px-2 py-2 text-right text-sm text-blue-700">
                                {totals.totalProjected > 0 ? totals.totalProjected.toLocaleString('es-ES') : '-'}
                              </div>
                              <div className={cn(
                                "w-[80px] border-r px-2 py-2 text-right text-sm",
                                totals.remainder < 0 ? "text-red-600" : "text-amber-700"
                              )}>
                                {totals.remainder.toLocaleString('es-ES')}
                              </div>
                              <div className={cn(
                                "w-[80px] border-r px-2 py-2 text-right text-sm",
                                totals.remainderProjected < 0 ? "text-red-600" : "text-blue-700"
                              )}>
                                {totals.remainderProjected.toLocaleString('es-ES')}
                              </div>

                              {/* Quarter columns */}
                              {quarters.map(quarter => {
                                const quarterTotals = getQuarterTotals(category, quarter);
                                const isQuarterExpanded = expandedQuarters.has(quarter.quarter);

                                return (
                                  <div key={quarter.quarter} className={cn(
                                    "flex border-r transition-all duration-200",
                                    isQuarterExpanded ? "min-w-[300px]" : "min-w-[120px]"
                                  )}>
                                    {isQuarterExpanded ? (
                                      <div className="flex w-full">
                                        {quarter.months.map(month => {
                                          const plan = getMonthlyPlanForCategory(category.id, month.key);
                                          const est = plan?.budgetAllocated ?? 0;
                                          const spent = plan ? getRealSpentForPlan(plan.id) : 0;

                                          return (
                                            <div key={month.key} className="w-[100px] flex border-r last:border-r-0">
                                              {/* Estimated Cell */}
                                              <div
                                                className="w-[50px] px-1 py-2 text-right text-xs border-r border-dashed text-blue-600 hover:bg-blue-50 cursor-pointer flex items-center justify-end"
                                                onClick={() => openTransferModal(category.id, month.key, plan?.id)}
                                                title="Asingar presupuesto"
                                              >
                                                {est > 0 ? est.toLocaleString('es-ES') : '-'}
                                              </div>

                                              {/* Spent Cell */}
                                              <div
                                                className="w-[50px] px-1 py-2 text-right text-xs text-green-600 hover:bg-green-50 cursor-pointer flex items-center justify-end"
                                                onClick={async () => {
                                                  if (plan) {
                                                    openExpensesModal(plan.id, category.name, month.fullLabel);
                                                  } else {
                                                    try {
                                                      const newPlan = await getOrCreateMonthlyPlan(category.id, month.key);
                                                      if (newPlan) {
                                                        openExpensesModal(newPlan.id, category.name, month.fullLabel);
                                                      }
                                                    } catch (e) {
                                                      console.error(e);
                                                    }
                                                  }
                                                }}
                                                title="Ver/Añadir gastos"
                                              >
                                                {spent > 0 ? spent.toLocaleString('es-ES') : '-'}
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    ) : (
                                      // Collapsed: show quarter totals
                                      <button
                                        onClick={() => toggleQuarter(quarter.quarter)}
                                        className="w-full px-2 py-2 text-center hover:bg-cyan-50/50 transition-colors"
                                      >
                                        <div className="text-xs font-medium text-cyan-700">
                                          {quarterTotals.estimated.toLocaleString('es-ES')}
                                        </div>
                                        <div className="text-[10px] text-green-600">
                                          {quarterTotals.spent.toLocaleString('es-ES')}
                                        </div>
                                      </button>
                                    )}
                                  </div>
                                );
                              })}
                            </div>

                            {/* Children rows */}
                            {hasChildren && isExpanded && (
                              <div>
                                {category.children!.map(child => {
                                  const childTotals = getCategoryTotals(child);
                                  const childBadge = getStatusBadge(childTotals);

                                  return (
                                    <div key={child.id} className="flex border-b group hover:bg-slate-50/50 bg-white">
                                      {/* Category name */}
                                      <div className="min-w-[300px] w-[300px] sticky left-0 z-10 border-r flex items-center gap-2 py-2 px-3 bg-white"
                                        style={{ paddingLeft: '40px' }}>
                                        <div className="w-5 flex-shrink-0" />
                                        <span className="text-sm flex-1 truncate text-slate-700">
                                          {child.name}
                                        </span>
                                        {childBadge && (
                                          <Badge variant="outline" className={cn("h-5 px-1.5 text-[10px] flex-shrink-0", childBadge.color)}>
                                            <childBadge.icon className="h-3 w-3 mr-0.5" />
                                            {childBadge.label}
                                          </Badge>
                                        )}
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                                          onClick={() => setSelectedCategoryDetail(child.id)}
                                          title="Ver detalle completo"
                                        >
                                          <Eye className="h-3.5 w-3.5 text-slate-500" />
                                        </Button>
                                      </div>

                                      {/* Summary columns */}
                                      <div className="w-[80px] border-r px-2 py-2 text-right text-sm">
                                        {childTotals.assignedBudget > 0 ? childTotals.assignedBudget.toLocaleString('es-ES') : '-'}
                                      </div>
                                      <div className="w-[80px] border-r px-2 py-2 text-right text-sm text-blue-700">
                                        {childTotals.totalEstimated > 0 ? childTotals.totalEstimated.toLocaleString('es-ES') : '-'}
                                      </div>
                                      <div className="w-[80px] border-r px-2 py-2 text-right text-sm text-green-700">
                                        {childTotals.totalSpent > 0 ? childTotals.totalSpent.toLocaleString('es-ES') : '-'}
                                      </div>
                                      <div className="w-[80px] border-r px-2 py-2 text-right text-sm text-blue-700">
                                        {childTotals.totalProjected > 0 ? childTotals.totalProjected.toLocaleString('es-ES') : '-'}
                                      </div>
                                      <div className={cn(
                                        "w-[80px] border-r px-2 py-2 text-right text-sm",
                                        childTotals.remainder < 0 ? "text-red-600" : "text-amber-700"
                                      )}>
                                        {childTotals.remainder.toLocaleString('es-ES')}
                                      </div>
                                      <div className={cn(
                                        "w-[80px] border-r px-2 py-2 text-right text-sm",
                                        childTotals.remainderProjected < 0 ? "text-red-600" : "text-blue-700"
                                      )}>
                                        {childTotals.remainderProjected.toLocaleString('es-ES')}
                                      </div>

                                      {/* Quarter columns for child */}
                                      {quarters.map(quarter => {
                                        const quarterTotals = getQuarterTotals(child, quarter);
                                        const isQuarterExpanded = expandedQuarters.has(quarter.quarter);

                                        return (
                                          <div key={quarter.quarter} className={cn(
                                            "flex border-r transition-all duration-200",
                                            isQuarterExpanded ? "min-w-[300px]" : "min-w-[120px]"
                                          )}>
                                            {isQuarterExpanded ? (
                                              <div className="flex w-full">
                                                {quarter.months.map(month => {
                                                  const plan = getMonthlyPlanForCategory(child.id, month.key);
                                                  const est = plan?.budgetAllocated ?? 0;
                                                  const spent = plan ? getRealSpentForPlan(plan.id) : 0;

                                                  return (
                                                    <div key={month.key} className="w-[100px] flex border-r last:border-r-0">
                                                      <div
                                                        className="w-[50px] px-1 py-2 text-right text-xs border-r border-dashed text-blue-600 hover:bg-blue-50 cursor-pointer flex items-center justify-end"
                                                        onClick={() => openTransferModal(child.id, month.key, plan?.id)}
                                                        title="Asingar presupuesto"
                                                      >
                                                        {est > 0 ? est.toLocaleString('es-ES') : '-'}
                                                      </div>
                                                      <div
                                                        className="w-[50px] px-1 py-2 text-right text-xs text-green-600 hover:bg-green-50 cursor-pointer flex items-center justify-end"
                                                        onClick={async () => {
                                                          if (plan) {
                                                            openExpensesModal(plan.id, child.name, month.fullLabel);
                                                          } else {
                                                            try {
                                                              const newPlan = await getOrCreateMonthlyPlan(child.id, month.key);
                                                              if (newPlan) {
                                                                openExpensesModal(newPlan.id, child.name, month.fullLabel);
                                                              }
                                                            } catch (e) {
                                                              console.error(e);
                                                            }
                                                          }
                                                        }}
                                                        title="Ver/Añadir gastos"
                                                      >
                                                        {spent > 0 ? spent.toLocaleString('es-ES') : '-'}
                                                      </div>
                                                    </div>
                                                  );
                                                })}
                                              </div>
                                            ) : (
                                              <button
                                                onClick={() => toggleQuarter(quarter.quarter)}
                                                className="w-full px-2 py-2 text-center hover:bg-cyan-50/50 transition-colors"
                                              >
                                                <div className="text-xs font-medium text-cyan-700">
                                                  {quarterTotals.estimated.toLocaleString('es-ES')}
                                                </div>
                                                <div className="text-[10px] text-green-600">
                                                  {quarterTotals.spent.toLocaleString('es-ES')}
                                                </div>
                                              </button>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </div>
          ) : viewMode === 'quarterly' ? (
            // QUARTERLY VIEW - Cards like the Excel
            <div className="p-4">
              {/* Quarter Navigation */}
              <div className="mb-4 p-3 bg-cyan-50 rounded-lg border border-cyan-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={goToPreviousQuarter}
                      disabled={displayQuarter === 1}
                      className="h-8"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex items-center gap-2">
                      {allQuarters.map(q => {
                        const quarterNum = parseInt(q.quarter.substring(1));
                        const isActive = quarterNum === displayQuarter;
                        const isCurrent = quarterNum === currentQuarter;
                        return (
                          <Button
                            key={q.quarter}
                            variant={isActive ? "default" : "outline"}
                            size="sm"
                            onClick={() => goToQuarter(quarterNum)}
                            className={cn(
                              "h-8 min-w-[60px]",
                              isActive && "bg-cyan-600 hover:bg-cyan-700",
                              isCurrent && !isActive && "border-cyan-400"
                            )}
                          >
                            {q.quarter}
                            {isCurrent && (
                              <span className="ml-1 text-xs">●</span>
                            )}
                          </Button>
                        );
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={goToNextQuarter}
                      disabled={displayQuarter === 4}
                      className="h-8"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedQuarter !== null && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={goToCurrentQuarter}
                        className="h-8 text-xs"
                      >
                        <Calendar className="h-3.5 w-3.5 mr-1" />
                        Ir a Trimestre Actual
                      </Button>
                    )}
                    <div className="text-sm text-slate-600">
                      {allQuarters.find(q => parseInt(q.quarter.substring(1)) === displayQuarter)?.label}
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {quarters.map(quarter => {
                  const quarterPlans = monthlyPlans.filter(p =>
                    quarter.months.some(m => m.key === p.month)
                  );
                  const quarterEst = quarterPlans.reduce((sum, p) => sum + p.budgetAllocated, 0);
                  const quarterSpent = quarterPlans.reduce((sum, p) => sum + getRealSpentForPlan(p.id), 0);
                  const quarterProjected = quarterPlans.reduce((sum, p) => sum + getRealSpentForPlan(p.id) + getEstimatedForPlan(p.id), 0);

                  return (
                    <Card key={quarter.quarter} className="border-2 border-cyan-200 bg-gradient-to-br from-cyan-50 to-white">
                      <CardHeader className="pb-2 pt-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-2xl font-bold text-cyan-800">{quarter.quarter}</CardTitle>
                            <p className="text-sm text-muted-foreground">{quarter.label}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-slate-800">
                              {quarterEst.toLocaleString('es-ES')} €
                            </p>
                            <div className="space-y-0.5 mt-1">
                              {quarterSpent > 0 && (
                                <p className={cn(
                                  "text-sm font-medium",
                                  quarterSpent > quarterEst ? "text-red-600" : "text-green-600"
                                )}>
                                  Invertido: {quarterSpent.toLocaleString('es-ES')} €
                                </p>
                              )}
                              {quarterProjected > quarterSpent && (
                                <p className="text-xs text-blue-600">
                                  Proyectado: {quarterProjected.toLocaleString('es-ES')} €
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-1.5 text-sm">
                          {categoryTree.map(cat => {
                            const catTotals = getQuarterTotals(cat, quarter);
                            if (catTotals.estimated === 0 && catTotals.spent === 0 && catTotals.projected === 0) return null;
                            return (
                              <div key={cat.id} className="flex items-start gap-2">
                                <span className="font-medium text-slate-700">{cat.name}</span>
                                <span className="text-slate-400">({catTotals.estimated.toLocaleString('es-ES')} €)</span>
                                {catTotals.projected > catTotals.spent && (
                                  <span className="text-xs text-blue-600">
                                    [Proy: {catTotals.projected.toLocaleString('es-ES')} €]
                                  </span>
                                )}
                                {cat.children && cat.children.length > 0 && (
                                  <ul className="ml-4 text-xs text-slate-600">
                                    {cat.children.map(child => {
                                      const childTotals = getQuarterTotals(child, quarter);
                                      if (childTotals.estimated === 0 && childTotals.spent === 0) return null;
                                      return (
                                        <li key={child.id} className="flex gap-1">
                                          <span>{child.name}:</span>
                                          <span className="font-medium">{childTotals.estimated.toLocaleString('es-ES')} €</span>
                                          {childTotals.projected > childTotals.spent && (
                                            <span className="text-blue-600">
                                              (Proy: {childTotals.projected.toLocaleString('es-ES')} €)
                                            </span>
                                          )}
                                        </li>
                                      );
                                    })}
                                  </ul>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Annual Total */}
              <div className="mt-4 p-4 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-lg text-white text-center">
                <p className="text-sm opacity-80">Presupuesto Anual Total</p>
                <p className="text-3xl font-bold">{summary.totalBudget.toLocaleString('es-ES')} €</p>
              </div>
            </div>
          ) : null
          }
        </CardContent >
      </Card >

      {/* Quick Add Category Dialog */}
      < Dialog open={quickAddDialog.open} onOpenChange={(open) => setQuickAddDialog(prev => ({ ...prev, open }))}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>
              {quickAddDialog.parentId ? 'Nueva subcategoría' : 'Nueva categoría'}
            </DialogTitle>
            <DialogDescription>
              {quickAddDialog.parentId
                ? `Dentro de "${quickAddDialog.parentName}"`
                : 'Crear una categoría principal (ej: SEM, Social, Display)'}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="cat-name">Nombre</Label>
            <Input
              id="cat-name"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder={quickAddDialog.parentId ? "Ej: Google Ads, Colombia..." : "Ej: SEM, Social Ads..."}
              className="mt-2"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleQuickAdd()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setQuickAddDialog({ open: false, parentId: null, parentName: '' })}>
              Cancelar
            </Button>
            <Button onClick={handleQuickAdd} disabled={!newCategoryName.trim() || isCreating}>
              {isCreating ? 'Creando...' : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog >

      {/* Modals */}
      < TransferModal
        open={transferModal.open}
        onOpenChange={(open) => setTransferModal(prev => ({ ...prev, open }))}
        fromPlanId={transferModal.fromPlanId}
        categoryId={transferModal.categoryId}
        month={transferModal.month}
      />

      <ExpensesModal
        open={expensesModal.open}
        onOpenChange={(open) => setExpensesModal(prev => ({ ...prev, open }))}
        planId={expensesModal.planId}
        categoryName={expensesModal.categoryName}
        month={expensesModal.month}
      />

      {/* Category Detail Panel */}
      <CategoryDetailPanel
        categoryId={selectedCategoryDetail}
        onClose={() => setSelectedCategoryDetail(null)}
      />
    </div >
  );
}
