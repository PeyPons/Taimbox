import { useState, useMemo } from 'react';
import { useMarketing } from '@/contexts/MarketingContext';
import { useApp } from '@/contexts/AppContext';
import { useAgency } from '@/contexts/AgencyContext';
import { usePermissions } from '@/hooks/usePermissions';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  PiggyBank,
  Plus,
  Settings,
  Grid3X3,
  History,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  AlertTriangle,
} from 'lucide-react';

import { MarketingSetup } from '@/components/marketing/MarketingSetup';
import { MarketingMatrix } from '@/components/marketing/MarketingMatrix';
import { MarketingAudit } from '@/components/marketing/MarketingAudit';
import { CreateBudgetDialog } from '@/components/marketing/CreateBudgetDialog';
import { cn } from '@/lib/utils';

export default function MarketingPage() {
  const { currentUser } = useApp();
  const { canAccess } = usePermissions();
  const { currentAgency } = useAgency();
  const {
    budgets,
    currentBudget,
    selectBudget,
    getBudgetSummary,
    isLoading,
  } = useMarketing();

  const [activeTab, setActiveTab] = useState<'matrix' | 'setup' | 'audit'>('matrix');
  const [showCreateBudget, setShowCreateBudget] = useState(false);

  const summary = useMemo(() => getBudgetSummary(), [getBudgetSummary]);

  const isAdmin = canAccess('/settings') || canAccess('/planner');

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="h-8 w-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  // No budget exists - show onboarding
  if (!currentBudget && budgets.length === 0) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card className="max-w-lg mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <PiggyBank className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Control Presupuestario</CardTitle>
            <CardDescription>
              Gestiona el presupuesto de marketing con trazabilidad completa de movimientos entre partidas.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground mb-6">
              Crea tu primer presupuesto anual para comenzar a planificar y controlar el gasto de marketing.
            </p>
            <Button onClick={() => setShowCreateBudget(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Crear Presupuesto Anual
            </Button>
          </CardContent>
        </Card>

        <CreateBudgetDialog
          open={showCreateBudget}
          onOpenChange={setShowCreateBudget}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Control Presupuestario</h1>
          <p className="text-sm text-muted-foreground">
            Marketing Ledger - {currentAgency?.name}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Budget Selector */}
          <Select
            value={currentBudget?.id || ''}
            onValueChange={(id) => {
              const budget = budgets.find(b => b.id === id);
              selectBudget(budget || null);
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Seleccionar ano" />
            </SelectTrigger>
            <SelectContent>
              {budgets.map((budget) => (
                <SelectItem key={budget.id} value={budget.id}>
                  {budget.year} - {budget.totalBudget.toLocaleString('es-ES')} EUR
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {isAdmin && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCreateBudget(true)}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Nuevo
            </Button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <DollarSign className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Presupuesto Total</p>
                <p className="text-lg font-bold">{summary.totalBudget.toLocaleString('es-ES')} EUR</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <Target className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Asignado</p>
                <p className="text-lg font-bold">{summary.totalAllocated.toLocaleString('es-ES')} EUR</p>
                <p className="text-xs text-muted-foreground">{summary.utilizationRate.toFixed(1)}% del total</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <div className={cn(
                "p-2 rounded-lg",
                summary.executionRate > 100 ? "bg-red-100" : "bg-amber-100"
              )}>
                {summary.executionRate > 100 ? (
                  <TrendingUp className="h-4 w-4 text-red-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-amber-600" />
                )}
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Gastado</p>
                <p className="text-lg font-bold">{summary.totalSpent.toLocaleString('es-ES')} EUR</p>
                <p className="text-xs text-muted-foreground">{summary.executionRate.toFixed(1)}% ejecutado</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <div className={cn(
                "p-2 rounded-lg",
                summary.totalRemaining < 0 ? "bg-red-100" : "bg-slate-100"
              )}>
                {summary.totalRemaining < 0 ? (
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                ) : (
                  <PiggyBank className="h-4 w-4 text-slate-600" />
                )}
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Sin Asignar</p>
                <p className={cn(
                  "text-lg font-bold",
                  summary.totalRemaining < 0 && "text-red-600"
                )}>
                  {summary.totalRemaining.toLocaleString('es-ES')} EUR
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Budget Status Badge */}
      {currentBudget && (
        <div className="flex items-center gap-2">
          <Badge
            variant={
              currentBudget.status === 'active' ? 'default' :
              currentBudget.status === 'closed' ? 'secondary' : 'outline'
            }
          >
            {currentBudget.status === 'planning' && 'En planificacion'}
            {currentBudget.status === 'active' && 'Activo'}
            {currentBudget.status === 'closed' && 'Cerrado'}
          </Badge>
          <span className="text-sm text-muted-foreground">
            Presupuesto {currentBudget.year}
          </span>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="matrix" className="gap-2">
            <Grid3X3 className="h-4 w-4" />
            <span className="hidden sm:inline">Matriz</span>
          </TabsTrigger>
          <TabsTrigger value="setup" className="gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Estructura</span>
          </TabsTrigger>
          <TabsTrigger value="audit" className="gap-2">
            <History className="h-4 w-4" />
            <span className="hidden sm:inline">Auditoria</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="matrix" className="mt-6">
          <MarketingMatrix />
        </TabsContent>

        <TabsContent value="setup" className="mt-6">
          <MarketingSetup />
        </TabsContent>

        <TabsContent value="audit" className="mt-6">
          <MarketingAudit />
        </TabsContent>
      </Tabs>

      {/* Create Budget Dialog */}
      <CreateBudgetDialog
        open={showCreateBudget}
        onOpenChange={setShowCreateBudget}
      />
    </div>
  );
}
