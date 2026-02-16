import { useState } from 'react';
import { useMarketing } from '@/contexts/MarketingContext';
import { useAgency } from '@/contexts/AgencyContext';
import { MarketingBudget } from '@/types/marketing';

import { BudgetOverview } from '@/components/marketing/BudgetOverview';
import { BudgetPlanner } from '@/components/marketing/planning/BudgetPlanner';
import { MarketingAudit } from '@/components/marketing/MarketingAudit';
import { CreateBudgetDialog } from '@/components/marketing/CreateBudgetDialog';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PiggyBank, Plus, Settings, LayoutDashboard, Calendar, History } from 'lucide-react';

export default function MarketingPage() {
  const { currentAgency } = useAgency();
  const {
    budgets,
    currentBudget,
    selectBudget,
    isLoading,
  } = useMarketing();

  const [activeTab, setActiveTab] = useState<'resumen' | 'planificacion' | 'movimientos'>('resumen');
  const [showCreateBudget, setShowCreateBudget] = useState(false);
  const [budgetToEdit, setBudgetToEdit] = useState<MarketingBudget | undefined>(undefined);

  const handleEditBudget = () => {
    if (currentBudget) {
      setBudgetToEdit(currentBudget);
      setShowCreateBudget(true);
    }
  };

  const handleCreateBudget = () => {
    setBudgetToEdit(undefined);
    setShowCreateBudget(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="h-9 w-9 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  // Sin presupuesto: onboarding claro
  if (!currentBudget && budgets.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4">
        <Card className="border-2 border-dashed border-slate-200 bg-slate-50/30 overflow-hidden">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mb-4">
              <PiggyBank className="h-8 w-8" />
            </div>
            <CardTitle className="text-2xl font-bold text-slate-900">
              Control Presupuestario
            </CardTitle>
            <CardDescription className="text-base mt-1">
              Gestiona el presupuesto de marketing de {currentAgency?.name ?? 'tu agencia'}: asigna partidas, registra gastos y revisa la ejecución en un solo sitio.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-6 pt-2">
            <p className="text-sm text-slate-600 max-w-md mx-auto">
              Crea tu primer presupuesto anual para empezar. Luego podrás añadir partidas (SEM, Social, etc.), planificar por meses y registrar facturas y movimientos.
            </p>
            <Button size="lg" onClick={handleCreateBudget} className="gap-2 bg-amber-600 hover:bg-amber-700">
              <Plus className="h-5 w-5" />
              Crear primer presupuesto
            </Button>
          </CardContent>
        </Card>

        <CreateBudgetDialog open={showCreateBudget} onOpenChange={setShowCreateBudget} />
      </div>
    );
  }

  // Con presupuesto: página principal con pestañas
  return (
    <div className="space-y-6 pb-10">
      {/* Cabecera */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Control Presupuestario
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {currentAgency?.name && <span>{currentAgency.name} · </span>}
            Presupuesto anual de marketing
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Select
            value={currentBudget?.id ?? ''}
            onValueChange={(id) => {
              const budget = budgets.find((b) => b.id === id);
              selectBudget(budget ?? null);
            }}
          >
            <SelectTrigger className="w-[180px] bg-white border-slate-200">
              <SelectValue placeholder="Elegir año" />
            </SelectTrigger>
            <SelectContent>
              {budgets.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  Año {b.year} — {b.totalBudget.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" onClick={handleEditBudget} className="gap-2" disabled={!currentBudget}>
            <Settings className="h-4 w-4" />
            Configuración
          </Button>
          <Button size="sm" onClick={handleCreateBudget} className="gap-2">
            <Plus className="h-4 w-4" />
            Nuevo presupuesto
          </Button>
        </div>
      </header>

      {/* Pestañas */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="space-y-4">
        <TabsList className="bg-slate-100 p-1 rounded-lg border border-slate-200/80 w-full sm:w-auto">
          <TabsTrigger value="resumen" className="gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <LayoutDashboard className="h-4 w-4" />
            Resumen
          </TabsTrigger>
          <TabsTrigger value="planificacion" className="gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Calendar className="h-4 w-4" />
            Planificación
          </TabsTrigger>
          <TabsTrigger value="movimientos" className="gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <History className="h-4 w-4" />
            Movimientos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="resumen" className="mt-4">
          {currentBudget ? <BudgetOverview /> : (
            <p className="text-slate-500 py-8">Selecciona un presupuesto en el desplegable superior.</p>
          )}
        </TabsContent>

        <TabsContent value="planificacion" className="mt-4">
          {currentBudget ? <BudgetPlanner /> : (
            <p className="text-slate-500 py-8">Selecciona un presupuesto para ver y editar la planificación.</p>
          )}
        </TabsContent>

        <TabsContent value="movimientos" className="mt-4">
          {currentBudget ? <MarketingAudit /> : (
            <p className="text-slate-500 py-8">Selecciona un presupuesto para ver el historial de movimientos.</p>
          )}
        </TabsContent>
      </Tabs>

      <CreateBudgetDialog
        open={showCreateBudget}
        onOpenChange={setShowCreateBudget}
        initialData={budgetToEdit}
      />
    </div>
  );
}
