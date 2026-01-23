import { useState, useEffect } from 'react';
import { useMarketing } from '@/contexts/MarketingContext';
import { MarketingMonthlyPlan, BudgetMovement, MarketingExpense } from '@/types/marketing';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Plus, Trash2, History, Receipt, Banknote, StickyNote } from 'lucide-react';

interface PlanDetailsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    categoryId: string;
    month: string; // YYYY-MM-DD
    categoryName: string;
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(amount);
};

const parseSpanishNumber = (value: string): number => {
    return parseFloat(value.replace(/\./g, '').replace(',', '.'));
};

export function PlanDetailsDialog({
    open,
    onOpenChange,
    categoryId,
    month,
    categoryName
}: PlanDetailsDialogProps) {
    const {
        getOrCreateMonthlyPlan,
        updatePlanBudget,
        updateResults,
        getExpensesForPlan,
        getMovementsForPlan,
        createExpense,
        deleteExpense,
        categories,
        monthlyPlans
    } = useMarketing();

    const [activeTab, setActiveTab] = useState('general');
    const [plan, setPlan] = useState<MarketingMonthlyPlan | null>(null);
    const [stats, setStats] = useState({ budget: 0, real: 0, estimated: 0 });
    const [expenses, setExpenses] = useState<MarketingExpense[]>([]);
    const [movements, setMovements] = useState<BudgetMovement[]>([]);

    // Notes state
    const [notes, setNotes] = useState('');
    const [manualValue, setManualValue] = useState(0);

    // New Expense State
    const [newExpense, setNewExpense] = useState({ amount: '', concept: '', isEstimated: false });

    useEffect(() => {
        if (open && categoryId && month) {
            loadData();
        }
    }, [open, categoryId, month, monthlyPlans]); // Reload if monthlyPlans changes

    const loadData = async () => {
        const p = await getOrCreateMonthlyPlan(categoryId, month);
        if (p) {
            setPlan(p);
            setExpenses(getExpensesForPlan(p.id));
            setMovements(getMovementsForPlan(p.id));
            setNotes(p.manualResultNotes || '');
            setManualValue(p.manualResultValue || 0);

            // Calculate specific stats
            const expensesList = getExpensesForPlan(p.id);
            const real = expensesList.filter(e => !e.isEstimated).reduce((s, e) => s + e.amount, 0);
            const estimated = expensesList.filter(e => e.isEstimated).reduce((s, e) => s + e.amount, 0);

            setStats({
                budget: p.budgetAllocated,
                real,
                estimated
            });
        }
    };

    const handleUpdateBudget = async (amount: number) => {
        if (plan) {
            await updatePlanBudget(plan.id, amount);
            loadData();
        }
    };

    const handleSaveNotes = async () => {
        if (plan) {
            await updateResults(plan.id, {
                manualResultValue: manualValue,
                manualResultNotes: notes
            });
        }
    };

    const handleAddExpense = async () => {
        if (!plan || !newExpense.amount) return;

        const amount = parseSpanishNumber(newExpense.amount);
        if (isNaN(amount) || amount <= 0) return;

        await createExpense({
            monthlyPlanId: plan.id,
            amount,
            concept: newExpense.concept || 'Gasto vario',
            date: new Date().toISOString(),
            isEstimated: newExpense.isEstimated
        });

        setNewExpense({ amount: '', concept: '', isEstimated: false });
        loadData();
    };

    const handleDeleteExpense = async (id: string) => {
        await deleteExpense(id);
        loadData();
    };

    const monthLabel = month ? format(new Date(month), 'MMMM yyyy', { locale: es }) : '';

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <span className="font-light text-muted-foreground">{categoryName}</span>
                        <Separator orientation="vertical" className="h-6" />
                        <span className="capitalize">{monthLabel}</span>
                    </DialogTitle>
                    <DialogDescription>
                        Gestión detallada de presupuesto y gastos.
                    </DialogDescription>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="general" className="gap-2"><Banknote className="h-4 w-4" /> Presupuesto y Notas</TabsTrigger>
                        <TabsTrigger value="expenses" className="gap-2"><Receipt className="h-4 w-4" /> Gastos ({expenses.length})</TabsTrigger>
                        <TabsTrigger value="history" className="gap-2"><History className="h-4 w-4" /> Auditoría</TabsTrigger>
                    </TabsList>

                    {/* GENERAL TAB */}
                    <TabsContent value="general" className="flex-1 overflow-auto p-1 space-y-6">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-3 gap-4 mt-4">
                            <div className="p-4 rounded-lg bg-blue-50 border border-blue-100 flex flex-col items-center">
                                <span className="text-xs text-blue-600 font-medium uppercase tracking-wider">Presupuesto</span>
                                <div className="text-2xl font-bold text-blue-700 mt-1">
                                    {formatCurrency(stats.budget)}
                                </div>
                                <div className="mt-2 w-full">
                                    <Label className="text-xs text-blue-400">Modificar Asignación</Label>
                                    <Input
                                        type="number"
                                        className="h-8 bg-white/50 text-center"
                                        defaultValue={stats.budget > 0 ? stats.budget : ''}
                                        onBlur={(e) => handleUpdateBudget(parseSpanishNumber(e.target.value) || 0)}
                                    />
                                </div>
                            </div>

                            <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-100 flex flex-col items-center">
                                <span className="text-xs text-emerald-600 font-medium uppercase tracking-wider">Gasto Real</span>
                                <div className="text-2xl font-bold text-emerald-700 mt-1">
                                    {formatCurrency(stats.real)}
                                </div>
                                <span className="text-xs text-emerald-500 mt-2">
                                    {formatCurrency(stats.budget - stats.real)} restante
                                </span>
                            </div>

                            <div className="p-4 rounded-lg bg-amber-50 border border-amber-100 flex flex-col items-center">
                                <span className="text-xs text-amber-600 font-medium uppercase tracking-wider">Estimado (Forecast)</span>
                                <div className="text-2xl font-bold text-amber-700 mt-1">
                                    {formatCurrency(stats.estimated)}
                                </div>
                                <span className="text-xs text-amber-500 mt-2">
                                    Proyección
                                </span>
                            </div>
                        </div>

                        <Separator />

                        {/* Notes Section */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <StickyNote className="h-4 w-4 text-slate-500" />
                                <h3 className="text-sm font-semibold">Notas y Observaciones</h3>
                            </div>
                            <Textarea
                                placeholder="Escribe aquí notas sobre desviaciones, justificaciones o recordatorios..."
                                className="min-h-[120px]"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                onBlur={handleSaveNotes}
                            />
                            <p className="text-xs text-muted-foreground">
                                Las notas se guardan automáticamente al salir del campo.
                            </p>
                        </div>
                    </TabsContent>

                    {/* EXPENSES TAB */}
                    <TabsContent value="expenses" className="flex-1 overflow-auto p-1 space-y-4">
                        <div className="flex gap-2 items-end bg-slate-50 p-3 rounded-lg border">
                            <div className="flex-1 space-y-1">
                                <Label>Concepto</Label>
                                <Input
                                    placeholder="Ej: Campaña Facebook Enero"
                                    value={newExpense.concept}
                                    onChange={e => setNewExpense({ ...newExpense, concept: e.target.value })}
                                />
                            </div>
                            <div className="w-[120px] space-y-1">
                                <Label>Importe</Label>
                                <Input
                                    type="text"
                                    placeholder="0,00"
                                    value={newExpense.amount}
                                    onChange={e => setNewExpense({ ...newExpense, amount: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1 pb-3">
                                <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={newExpense.isEstimated}
                                        onChange={e => setNewExpense({ ...newExpense, isEstimated: e.target.checked })}
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    Es Estimación
                                </label>
                            </div>
                            <Button onClick={handleAddExpense} disabled={!newExpense.amount}>
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>

                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Fecha</TableHead>
                                        <TableHead>Concepto</TableHead>
                                        <TableHead>Tipo</TableHead>
                                        <TableHead className="text-right">Importe</TableHead>
                                        <TableHead className="w-[50px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {expenses.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                                No hay gastos registrados
                                            </TableCell>
                                        </TableRow>
                                    )}
                                    {expenses.map((expense) => (
                                        <TableRow key={expense.id}>
                                            <TableCell className="text-xs">
                                                {expense.date ? format(new Date(expense.date), 'dd/MM/yy') : '-'}
                                            </TableCell>
                                            <TableCell>{expense.concept}</TableCell>
                                            <TableCell>
                                                {expense.isEstimated ? (
                                                    <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">Estimado</Badge>
                                                ) : (
                                                    <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50">Real</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right font-mono">
                                                {formatCurrency(expense.amount)}
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                                                    onClick={() => handleDeleteExpense(expense.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </TabsContent>

                    {/* HISTORY TAB */}
                    <TabsContent value="history" className="flex-1 overflow-auto p-1">
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Fecha</TableHead>
                                        <TableHead>Usuario</TableHead>
                                        <TableHead>Descripción</TableHead>
                                        <TableHead className="text-right">Importe</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {movements.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                                Sin movimientos registrados
                                            </TableCell>
                                        </TableRow>
                                    )}
                                    {movements.map((mov) => (
                                        <TableRow key={mov.id}>
                                            <TableCell className="text-xs">
                                                {format(new Date(mov.createdAt), 'dd/MM/yy HH:mm')}
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground">
                                                {/* In a real app we'd resolve user name */}
                                                Usuario
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {mov.description}
                                            </TableCell>
                                            <TableCell className="text-right font-mono text-xs">
                                                {/* Logic for +/- depending on direction omitted for brevity, showing raw amount */}
                                                {formatCurrency(mov.amount)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
