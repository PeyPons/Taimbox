import { ChevronRight, Plus, Download, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { MarketingBudget } from '@/types/marketing';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

interface MarketingHeaderProps {
    currentBudget: MarketingBudget | null;
    budgets: MarketingBudget[];
    onSelectBudget: (budget: MarketingBudget | null) => void;
    onNewBudget: () => void;
    onSettingsClick?: () => void;
    activeView: 'dashboard' | 'planner' | 'history';
    onViewChange: (view: 'dashboard' | 'planner' | 'history') => void;
    agencyName?: string;
}

export function MarketingHeader({
    currentBudget,
    budgets,
    onSelectBudget,
    onNewBudget,
    onSettingsClick,
    activeView,
    onViewChange,
    agencyName,
}: MarketingHeaderProps) {
    return (
        <div className="flex flex-col gap-6 mb-8">
            {/* Top Bar: Breadcrumbs & Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink href="/">Home</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator>
                            <ChevronRight className="h-4 w-4" />
                        </BreadcrumbSeparator>
                        <BreadcrumbItem>
                            <BreadcrumbLink href="/marketing">Marketing</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator>
                            <ChevronRight className="h-4 w-4" />
                        </BreadcrumbSeparator>
                        <BreadcrumbItem>
                            <BreadcrumbPage>
                                {activeView === 'dashboard' && 'Dashboard'}
                                {activeView === 'planner' && 'Planificación'}
                                {activeView === 'history' && 'Movimientos'}
                            </BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>

                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
                        <Download className="h-4 w-4" />
                        <span className="hidden sm:inline">Exportar</span>
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 text-muted-foreground hover:text-foreground"
                        onClick={onSettingsClick}
                    >
                        <Settings className="h-4 w-4" />
                        <span className="hidden sm:inline">Configuración</span>
                    </Button>
                    <Button onClick={onNewBudget} size="sm" className="gap-2 shadow-sm">
                        <Plus className="h-4 w-4" />
                        Nuevo Presupuesto
                    </Button>
                </div>
            </div>

            {/* Title & Controls */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-4 border-b pb-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-1">
                        Marketing Ledger
                    </h1>
                    <p className="text-muted-foreground flex items-center gap-2">
                        Gestión presupuestaria para <span className="font-medium text-foreground">{agencyName}</span>
                    </p>
                </div>

                <div className="flex items-center gap-4 bg-slate-50/50 p-1.5 rounded-lg border">
                    {/* View Selector Tabs */}
                    <div className="flex p-1 bg-slate-100/50 rounded-md">
                        <button
                            onClick={() => onViewChange('dashboard')}
                            className={`px-4 py-1.5 text-sm font-medium rounded-sm transition-all ${activeView === 'dashboard'
                                ? 'bg-white text-slate-900 shadow-sm'
                                : 'text-slate-500 hover:text-slate-900'
                                }`}
                        >
                            Dashboard
                        </button>
                        <button
                            onClick={() => onViewChange('planner')}
                            className={`px-4 py-1.5 text-sm font-medium rounded-sm transition-all ${activeView === 'planner'
                                ? 'bg-white text-slate-900 shadow-sm'
                                : 'text-slate-500 hover:text-slate-900'
                                }`}
                        >
                            Planificación
                        </button>
                        <button
                            onClick={() => onViewChange('history')}
                            className={`px-4 py-1.5 text-sm font-medium rounded-sm transition-all ${activeView === 'history'
                                ? 'bg-white text-slate-900 shadow-sm'
                                : 'text-slate-500 hover:text-slate-900'
                                }`}
                        >
                            Auditoría
                        </button>
                    </div>

                    <div className="h-6 w-px bg-slate-200 mx-2" />

                    {/* Budget Year Selector */}
                    <Select
                        value={currentBudget?.id || ''}
                        onValueChange={(id) => {
                            const budget = budgets.find((b) => b.id === id);
                            onSelectBudget(budget || null);
                        }}
                    >
                        <SelectTrigger className="w-[160px] border-none shadow-none bg-transparent hover:bg-slate-100 focus:ring-0">
                            <SelectValue placeholder="Año fiscal" />
                        </SelectTrigger>
                        <SelectContent>
                            {budgets.map((budget) => (
                                <SelectItem key={budget.id} value={budget.id}>
                                    <span className="font-medium">Año {budget.year}</span>
                                    <span className="ml-2 text-muted-foreground text-xs">
                                        {budget.totalBudget.toLocaleString('es-ES', {
                                            style: 'currency',
                                            currency: 'EUR',
                                            maximumFractionDigits: 0
                                        })}
                                    </span>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </div>
    );
}
