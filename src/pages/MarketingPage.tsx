import { useState, useMemo } from 'react';
import { useMarketing } from '@/contexts/MarketingContext';
import { MarketingBudget } from '@/types/marketing';
import { useApp } from '@/contexts/AppContext';
import { useAgency } from '@/contexts/AgencyContext';
import { usePermissions } from '@/hooks/usePermissions';

import { MarketingHeader } from '@/components/marketing/layout/MarketingHeader';
import { MarketingDashboard } from '@/components/marketing/dashboard/MarketingDashboard';
import { BudgetPlanner } from '@/components/marketing/planning/BudgetPlanner';
import { MarketingAudit } from '@/components/marketing/MarketingAudit';
import { CreateBudgetDialog } from '@/components/marketing/CreateBudgetDialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PiggyBank, Plus } from 'lucide-react';

export default function MarketingPage() {
  const { currentAgency } = useAgency();
  const { canAccess } = usePermissions();
  const {
    budgets,
    currentBudget,
    selectBudget,
    isLoading,
  } = useMarketing();

  const [activeView, setActiveView] = useState<'dashboard' | 'planner' | 'history'>('dashboard');
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
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="h-8 w-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  // No budget exists - show onboarding
  if (!currentBudget && budgets.length === 0) {
    return (
      <div className="container mx-auto py-12 px-4">
        <Card className="max-w-lg mx-auto shadow-lg border-2 border-dashed">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mb-6">
              <PiggyBank className="h-10 w-10 text-primary" />
            </div>
            <CardTitle className="text-3xl font-bold">Marketing Ledger</CardTitle>
            <CardDescription className="text-lg mt-2">
              Sistema integral de control presupuestario
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <p className="text-muted-foreground">
              Gestiona presupuestos, controla el gasto en tiempo real y analiza el rendimiento de tus inversiones de forma centralizada.
            </p>
            <Button size="lg" onClick={handleCreateBudget} className="w-full sm:w-auto gap-2">
              <Plus className="h-5 w-5" />
              Comenzar Setup
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
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <MarketingHeader
        currentBudget={currentBudget}
        budgets={budgets}
        onSelectBudget={selectBudget}
        onNewBudget={handleCreateBudget}
        onSettingsClick={handleEditBudget}
        activeView={activeView}
        onViewChange={setActiveView}
        agencyName={currentAgency?.name}
      />

      <div className="animate-in fade-in-50 slide-in-from-bottom-2 duration-500">
        {activeView === 'dashboard' && <MarketingDashboard />}
        {activeView === 'planner' && <BudgetPlanner />}
        {activeView === 'history' && <MarketingAudit />}
      </div>

      <CreateBudgetDialog
        open={showCreateBudget}
        onOpenChange={setShowCreateBudget}
        initialData={budgetToEdit}
      />
    </div>
  );
}
