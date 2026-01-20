/**
 * Marketing Ledger Types
 * Sistema de Control Presupuestario de Marketing
 */

// ============================================
// Budget Types (Contenedor Anual)
// ============================================

export type MarketingBudgetStatus = 'planning' | 'active' | 'closed';

export interface MarketingBudget {
  id: string;
  agencyId: string;
  year: number;
  totalBudget: number;
  status: MarketingBudgetStatus;
  createdAt: string;
  updatedAt?: string;
}

// ============================================
// Category Types (Jerarquia de partidas)
// ============================================

export interface MarketingCategory {
  id: string;
  budgetId: string;
  parentId: string | null; // NULL si es categoria principal (ej: SEM)
  name: string;

  // Configuracion del KPI manual
  kpiName?: string; // Ej: "Leads", "Registros", "Ventas"
  kpiTargetCost?: number; // Ej: CPL objetivo 15 EUR (opcional)

  // Permisos: Quien puede ver/editar esta fila especifica
  allowedEmployees: string[]; // Array de employee IDs

  // Campos de control Excel-style
  notes?: string; // Notas libres de la categoria
  assignedBudget?: number; // Presupuesto anual asignado a la categoria (Top-Down)
  isActive?: boolean; // Si esta activa este periodo
  sortOrder: number; // Orden personalizado para mostrar

  createdAt: string;
  updatedAt?: string;

  // Virtual: Para renderizar el arbol
  children?: MarketingCategory[];
  level?: number;
}

// ============================================
// Monthly Plan Types (La Matriz)
// ============================================

export interface MarketingMonthlyPlan {
  id: string;
  categoryId: string;
  month: string; // Formato: 'YYYY-MM-01' (siempre dia 1)

  budgetAllocated: number; // Lo que se asigno (se actualiza solo via movimientos)
  realSpent: number; // Gasto real (Facturas)

  // Resultados manuales
  manualResultValue: number; // Ej: 45 (Leads)
  manualResultNotes?: string; // Notas: "Datos sacados del CRM el dia 30"

  // Nota de estado del mes (ej: "Pausado por...", "Puesto en X porque...")
  statusNote?: string;

  createdAt?: string;
  updatedAt?: string;

  // Virtual: Datos calculados
  variance?: number; // budgetAllocated - realSpent
  cpl?: number; // realSpent / manualResultValue (si hay resultados)
}

// ============================================
// Movement Types (Libro Mayor)
// ============================================

export type BudgetMovementType = 'initial_deposit' | 'transfer' | 'correction';

export interface BudgetMovement {
  id: string;
  createdAt: string;
  createdBy: string; // Employee ID

  amount: number;

  // Origen (NULL = Inyeccion de capital externo)
  fromPlanId: string | null;

  // Destino (NULL = Retirada de fondos/Perdida)
  toPlanId: string | null;

  type: BudgetMovementType;
  description?: string; // "Mover remanente de Enero a Bolsa Q2"

  // Virtual: Para visualizacion
  fromCategory?: MarketingCategory;
  fromMonth?: string;
  toCategory?: MarketingCategory;
  toMonth?: string;
  createdByEmployee?: { id: string; name: string };
}

// ============================================
// Expense Types (Facturas/Gastos)
// ============================================

export interface MarketingExpense {
  id: string;
  monthlyPlanId: string;
  amount: number;
  concept?: string; // "Factura Google Ads #FV-2026-01"
  date?: string;
  isEstimated: boolean; // Para marcar gastos pendientes de cierre

  createdAt?: string;
  updatedAt?: string;
}

// ============================================
// View/UI Helper Types
// ============================================

// Celda de la matriz (interseccion categoria-mes)
export interface MatrixCell {
  categoryId: string;
  month: string;
  plan?: MarketingMonthlyPlan;
  hasRemainder: boolean; // Si el mes paso y hay excedente
  remainderAmount: number;
}

// Fila de la matriz (categoria con todos sus meses)
export interface MatrixRow {
  category: MarketingCategory;
  cells: MatrixCell[];
  totalAllocated: number;
  totalSpent: number;
  totalResults: number;
  isExpanded?: boolean;
}

// Resumen del presupuesto
export interface BudgetSummary {
  totalBudget: number;
  totalAllocated: number;
  totalSpent: number;
  totalRemaining: number; // totalBudget - totalAllocated
  totalUnspent: number; // totalAllocated - totalSpent
  utilizationRate: number; // (totalAllocated / totalBudget) * 100
  executionRate: number; // (totalSpent / totalAllocated) * 100
}

// Filtros para la vista de auditoria
export interface MovementFilters {
  employeeId?: string;
  categoryId?: string;
  dateFrom?: string;
  dateTo?: string;
  type?: BudgetMovementType;
}

// Form types para crear/editar
export interface CreateBudgetForm {
  year: number;
  totalBudget: number;
}

export interface CreateCategoryForm {
  budgetId: string;
  parentId?: string;
  name: string;
  kpiName?: string;
  kpiTargetCost?: number;
  allowedEmployees?: string[];
  notes?: string;
  isActive?: boolean;
}

export interface CreateMovementForm {
  fromPlanId?: string;
  toPlanId?: string;
  amount: number;
  type: BudgetMovementType;
  description: string;
}

export interface CreateExpenseForm {
  monthlyPlanId: string;
  amount: number;
  concept?: string;
  date?: string;
  isEstimated?: boolean;
}

export interface UpdateResultsForm {
  manualResultValue: number;
  manualResultNotes?: string;
}

// ============================================
// API Response Types
// ============================================

export interface MarketingBudgetWithCategories extends MarketingBudget {
  categories: MarketingCategory[];
}

export interface CategoryWithPlans extends MarketingCategory {
  monthlyPlans: MarketingMonthlyPlan[];
}
