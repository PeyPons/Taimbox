import { describe, expect, it } from "vitest";
import { resolveRegisterPlan } from "../../../supabase/functions/_shared/register-plan";

describe("resolveRegisterPlan", () => {
  it("mantiene el alta actual (sin plan) como prueba de Agency", () => {
    expect(resolveRegisterPlan(undefined)).toEqual({
      storedPlanId: "business",
      trial: true,
      checkoutPlan: null,
    });
    expect(resolveRegisterPlan("")).toEqual({
      storedPlanId: "business",
      trial: true,
      checkoutPlan: null,
    });
    expect(resolveRegisterPlan("enterprise")).toEqual({
      storedPlanId: "business",
      trial: true,
      checkoutPlan: null,
    });
  });

  it("Free es registro sin prueba y sin checkout", () => {
    expect(resolveRegisterPlan("starter")).toEqual({
      storedPlanId: "starter",
      trial: false,
      checkoutPlan: null,
    });
  });

  it("Team no guarda la prueba: queda en Free y pide checkout de pro", () => {
    expect(resolveRegisterPlan("pro")).toEqual({
      storedPlanId: "starter",
      trial: false,
      checkoutPlan: "pro",
    });
  });

  it("Agency sigue siendo la prueba de 14 días", () => {
    expect(resolveRegisterPlan("business")).toEqual({
      storedPlanId: "business",
      trial: true,
      checkoutPlan: null,
    });
  });
});
