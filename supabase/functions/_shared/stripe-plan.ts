import type Stripe from "npm:stripe@14.21.0";

/** Planes facturables vía Stripe (no incluye starter ni enterprise manual). */
export type PaidPlanId = "pro" | "business" | "scale";

/** Suscripciones creadas antes del cambio a USD (Stripe live, EUR). */
const LEGACY_EUR_PRICE_IDS: Partial<Record<PaidPlanId, string>> = {
  pro: "price_1T9CpPKEVG6SFdOYZ8tEm2f4",
  business: "price_1T9CpLKEVG6SFdOY0hBKOFA6",
};

const PAID_PLANS_DESC: PaidPlanId[] = ["scale", "business", "pro"];

function isPaidPlanMeta(meta: string): meta is PaidPlanId {
  return meta === "pro" || meta === "business" || meta === "scale";
}

function priceIdMatchesPlan(priceId: string, planId: PaidPlanId, env: StripePlanEnv): boolean {
  const current = getStripePriceIdForPlan(planId, env);
  if (current && priceId === current) return true;
  const legacy = LEGACY_EUR_PRICE_IDS[planId];
  return legacy != null && priceId === legacy;
}

export interface StripePlanEnv {
  pricePro?: string;
  priceBusiness?: string;
  priceScale?: string;
}

export function readStripePlanEnv(): StripePlanEnv {
  return {
    pricePro: Deno.env.get("STRIPE_PRICE_ID_PRO")?.trim() || undefined,
    priceBusiness: Deno.env.get("STRIPE_PRICE_ID_BUSINESS")?.trim() || undefined,
    priceScale: Deno.env.get("STRIPE_PRICE_ID_SCALE")?.trim() || undefined,
  };
}

export function getStripePriceIdForPlan(planId: PaidPlanId, env: StripePlanEnv): string | null {
  if (planId === "scale") return env.priceScale ?? null;
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

function planFromLabel(label: string): PaidPlanId | null {
  if (label.includes("scale")) return "scale";
  if (label.includes("business") || label.includes("agency")) return "business";
  if (/\bpro\b/.test(label) || label.includes(" pro ") || label.includes("team")) return "pro";
  return null;
}

function resolvePlanFromItems(
  sub: Stripe.Subscription,
  env: StripePlanEnv,
): PaidPlanId | null {
  for (const item of sub.items?.data ?? []) {
    const rawPrice = item.price;
    const priceId =
      typeof rawPrice === "string" ? rawPrice : (rawPrice as Stripe.Price | undefined)?.id;

    for (const planId of PAID_PLANS_DESC) {
      if (priceId && priceIdMatchesPlan(priceId, planId, env)) {
        return planId;
      }
    }

    if (rawPrice && typeof rawPrice === "object") {
      const fromLabel = planFromLabel(labelFromPrice(rawPrice as Stripe.Price));
      if (fromLabel) return fromLabel;
    }
  }
  return null;
}

/** Resolución síncrona (metadata + Price IDs en env + product expandido en el evento). */
export function resolvePlanIdFromSubscription(
  sub: Stripe.Subscription,
  env: StripePlanEnv,
): PaidPlanId {
  const meta = (sub.metadata?.plan_id ?? "").toLowerCase();
  if (isPaidPlanMeta(meta)) return meta;

  const fromItems = resolvePlanFromItems(sub, env);
  if (fromItems) return fromItems;

  return "pro";
}

/** Si la resolución síncrona no es concluyente, consulta el Price en Stripe (Dashboard sin metadata). */
export async function resolvePlanIdFromSubscriptionAsync(
  stripe: Stripe,
  sub: Stripe.Subscription,
  env: StripePlanEnv,
): Promise<PaidPlanId> {
  const meta = (sub.metadata?.plan_id ?? "").toLowerCase();
  if (isPaidPlanMeta(meta)) return meta;

  const sync = resolvePlanIdFromSubscription(sub, env);
  const items = sub.items?.data ?? [];
  let matchedByEnv = false;

  for (const item of items) {
    const rawPrice = item.price;
    const priceId =
      typeof rawPrice === "string" ? rawPrice : (rawPrice as Stripe.Price | undefined)?.id;
    if (!priceId) continue;
    for (const planId of PAID_PLANS_DESC) {
      if (priceIdMatchesPlan(priceId, planId, env)) matchedByEnv = true;
    }
  }

  if (matchedByEnv) return sync;

  for (const item of items) {
    const rawPrice = item.price;
    const priceId =
      typeof rawPrice === "string" ? rawPrice : (rawPrice as Stripe.Price | undefined)?.id;
    if (!priceId) continue;

    try {
      const price = await stripe.prices.retrieve(priceId, { expand: ["product"] });
      const fromLabel = planFromLabel(labelFromPrice(price));
      if (fromLabel) return fromLabel;
    } catch (e) {
      console.warn(`[stripe-plan] No se pudo leer price ${priceId}:`, e);
    }
  }

  if (sync !== "pro") return sync;

  console.warn(
    `[stripe-plan] Suscripción ${sub.id}: plan_id metadata="${sub.metadata?.plan_id ?? ""}"; ` +
      `usando fallback "${sync}". Configura STRIPE_PRICE_ID_* o metadata plan_id en Stripe.`,
  );
  return sync;
}
