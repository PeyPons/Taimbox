import type Stripe from "npm:stripe@14.21.0";

export type PaidPlanId = "pro" | "business";

/** Suscripciones creadas antes del cambio a USD (Stripe live, EUR). */
const LEGACY_EUR_PRICE_IDS: Record<PaidPlanId, string> = {
  pro: "price_1T9CpPKEVG6SFdOYZ8tEm2f4",
  business: "price_1T9CpLKEVG6SFdOY0hBKOFA6",
};

function priceIdMatchesPlan(priceId: string, planId: PaidPlanId, env: StripePlanEnv): boolean {
  const current = getStripePriceIdForPlan(planId, env);
  if (current && priceId === current) return true;
  return priceId === LEGACY_EUR_PRICE_IDS[planId];
}

export interface StripePlanEnv {
  pricePro?: string;
  priceBusiness?: string;
}

export function readStripePlanEnv(): StripePlanEnv {
  return {
    pricePro: Deno.env.get("STRIPE_PRICE_ID_PRO")?.trim() || undefined,
    priceBusiness: Deno.env.get("STRIPE_PRICE_ID_BUSINESS")?.trim() || undefined,
  };
}

export function getStripePriceIdForPlan(planId: PaidPlanId, env: StripePlanEnv): string | null {
  if (planId === "business") return env.priceBusiness ?? null;
  return env.pricePro ?? null;
}

function labelFromPrice(price: Stripe.Price): string {
  const product = price.product;
  const productName =
    typeof product === "object" && product && "name" in product
      ? String((product as Stripe.Product).name ?? "")
      : "";
  return `${productName} ${price.nickname ?? ""}`.toLowerCase();
}

/** Resolución síncrona (metadata + Price IDs en env + product expandido en el evento). */
export function resolvePlanIdFromSubscription(
  sub: Stripe.Subscription,
  env: StripePlanEnv,
): PaidPlanId {
  const meta = (sub.metadata?.plan_id ?? "").toLowerCase();
  if (meta === "business") return "business";
  if (meta === "pro") return "pro";

  for (const item of sub.items?.data ?? []) {
    const rawPrice = item.price;
    const priceId =
      typeof rawPrice === "string" ? rawPrice : (rawPrice as Stripe.Price | undefined)?.id;

    if (priceId && priceIdMatchesPlan(priceId, "business", env)) {
      return "business";
    }
    if (priceId && priceIdMatchesPlan(priceId, "pro", env)) {
      return "pro";
    }

    if (rawPrice && typeof rawPrice === "object") {
      const label = labelFromPrice(rawPrice as Stripe.Price);
      if (label.includes("business")) return "business";
      if (/\bpro\b/.test(label) || label.includes(" pro ")) return "pro";
    }
  }

  return "pro";
}

/** Si la resolución síncrona no es concluyente, consulta el Price en Stripe (Dashboard sin metadata). */
export async function resolvePlanIdFromSubscriptionAsync(
  stripe: Stripe,
  sub: Stripe.Subscription,
  env: StripePlanEnv,
): Promise<PaidPlanId> {
  const meta = (sub.metadata?.plan_id ?? "").toLowerCase();
  if (meta === "business" || meta === "pro") {
    return meta as PaidPlanId;
  }

  const sync = resolvePlanIdFromSubscription(sub, env);
  const items = sub.items?.data ?? [];
  let matchedByEnv = false;

  for (const item of items) {
    const rawPrice = item.price;
    const priceId =
      typeof rawPrice === "string" ? rawPrice : (rawPrice as Stripe.Price | undefined)?.id;
    if (!priceId) continue;
    if (priceIdMatchesPlan(priceId, "business", env)) matchedByEnv = true;
    if (priceIdMatchesPlan(priceId, "pro", env)) matchedByEnv = true;
  }

  if (matchedByEnv) return sync;

  for (const item of items) {
    const rawPrice = item.price;
    const priceId =
      typeof rawPrice === "string" ? rawPrice : (rawPrice as Stripe.Price | undefined)?.id;
    if (!priceId) continue;

    try {
      const price = await stripe.prices.retrieve(priceId, { expand: ["product"] });
      const label = labelFromPrice(price);
      if (label.includes("business")) return "business";
      if (/\bpro\b/.test(label) || label.includes(" pro ")) return "pro";
    } catch (e) {
      console.warn(`[stripe-plan] No se pudo leer price ${priceId}:`, e);
    }
  }

  if (sync === "business") return sync;

  console.warn(
    `[stripe-plan] Suscripción ${sub.id}: plan_id metadata="${sub.metadata?.plan_id ?? ""}"; ` +
      `usando fallback "${sync}". Configura STRIPE_PRICE_ID_* o metadata plan_id en Stripe.`,
  );
  return sync;
}
