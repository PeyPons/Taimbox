/**
 * Qué guarda el alta según el plan pedido desde /precios.
 * Sin `plan` (alta actual: home, footer, registro a secas) sigue siendo Agency con prueba.
 * Team no recibe la prueba: la agencia queda en Free hasta que el webhook de Stripe
 * confirme el checkout de `pro`.
 */
export type RegisterPlanRequest = "starter" | "pro" | "business";

export interface ResolvedRegisterPlan {
  /** Plan persistido en `agencies.plan_id` antes de cualquier cobro. */
  storedPlanId: "starter" | "business";
  /** Prueba de Agency, 14 días, sin tarjeta. */
  trial: boolean;
  /** Si no es null, el cliente debe abrir el checkout de ese plan tras el login. */
  checkoutPlan: "pro" | null;
}

export function resolveRegisterPlan(raw: unknown): ResolvedRegisterPlan {
  const intent: RegisterPlanRequest =
    raw === "starter" || raw === "pro" || raw === "business" ? raw : "business";

  if (intent === "starter") {
    return { storedPlanId: "starter", trial: false, checkoutPlan: null };
  }
  if (intent === "pro") {
    return { storedPlanId: "starter", trial: false, checkoutPlan: "pro" };
  }
  return { storedPlanId: "business", trial: true, checkoutPlan: null };
}
