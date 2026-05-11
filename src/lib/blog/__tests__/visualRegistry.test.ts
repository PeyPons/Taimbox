import { describe, expect, it } from "vitest";
import { getVisualEntry, listVisualIds } from "../visualRegistry";

describe("blogVisualRegistry", () => {
  it("getVisualEntry devuelve entrada fullPage para articulos seed", () => {
    const entry = getVisualEntry("CapacidadCalendarioVsProductivaArticle");
    expect(entry).toBeDefined();
    expect(entry?.mode).toBe("fullPage");
  });

  it("getVisualEntry devuelve entrada inline para visuales reutilizables", () => {
    const entry = getVisualEntry("ParkinsonLawVisual");
    expect(entry?.mode).toBe("inline");
  });

  it("getVisualEntry devuelve undefined para id inexistente", () => {
    expect(getVisualEntry("NoExisteVisualId")).toBeUndefined();
  });

  it("listVisualIds incluye ids conocidos y modos coherentes", () => {
    const ids = listVisualIds();
    expect(ids.some((x) => x.id === "WhatIsTimeboxingArticle")).toBe(true);
    expect(ids.every((x) => x.mode === "fullPage" || x.mode === "inline")).toBe(
      true,
    );
  });
});
