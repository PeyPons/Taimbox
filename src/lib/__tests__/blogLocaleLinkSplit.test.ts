import { describe, expect, it } from "vitest";
import {
  i18nPlainString,
  parseGestionCapsule,
  parseOneLocaleLink,
  parseTwoLocaleLinks,
} from "../blogLocaleLinkSplit";

describe("i18nPlainString", () => {
  it("normaliza null/undefined a cadena vacia", () => {
    expect(i18nPlainString(null)).toBe("");
    expect(i18nPlainString(undefined)).toBe("");
  });

  it("devuelve string tal cual y descarta no-string", () => {
    expect(i18nPlainString("hola")).toBe("hola");
    expect(i18nPlainString(42)).toBe("");
    expect(i18nPlainString({})).toBe("");
  });
});

describe("parseOneLocaleLink", () => {
  it("parsea un marcador LocaleLink bien formado", () => {
    const raw = 'Antes <LocaleLink>/ruta</LocaleLink> despues';
    const r = parseOneLocaleLink(raw);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.p.before).toBe("Antes ");
      expect(r.p.link).toBe("/ruta");
      expect(r.p.after).toBe(" despues");
    }
  });

  it("falla con gracia si falta cierre", () => {
    const raw = "Texto <LocaleLink>sin cierre";
    const r = parseOneLocaleLink(raw);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.plain).toBe(raw);
  });

  it("sin marcador devuelve ok false con plain", () => {
    const r = parseOneLocaleLink("solo texto");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.plain).toBe("solo texto");
  });
});

describe("parseTwoLocaleLinks", () => {
  it("parsea dos enlaces en orden", () => {
    const raw =
      'A <LocaleLink>/1</LocaleLink> B <LocaleLink>/2</LocaleLink> C';
    const r = parseTwoLocaleLinks(raw);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.p.before1).toBe("A ");
      expect(r.p.link1).toBe("/1");
      expect(r.p.between).toBe(" B ");
      expect(r.p.link2).toBe("/2");
      expect(r.p.after).toBe(" C");
    }
  });

  it("falla si solo hay un LocaleLink", () => {
    const raw = 'Uno <LocaleLink>/x</LocaleLink> fin';
    const r = parseTwoLocaleLinks(raw);
    expect(r.ok).toBe(false);
  });
});

describe("parseGestionCapsule", () => {
  it("parsea la capsula con tres LocaleLink numerados", () => {
    const raw =
      "pre <LocaleLink1>/a</Link1> mid1 <LocaleLink2>/b</Link2> mid2 <LocaleLink3>/c</Link3> tail";
    const r = parseGestionCapsule(raw);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.p.before1).toBe("pre ");
      expect(r.p.link1).toBe("/a");
      expect(r.p.between12).toBe(" mid1 ");
      expect(r.p.link2).toBe("/b");
      expect(r.p.between23).toBe(" mid2 ");
      expect(r.p.link3).toBe("/c");
      expect(r.p.after3).toBe(" tail");
    }
  });

  it("sin LocaleLink1 devuelve plain", () => {
    const raw = "sin marcadores";
    const r = parseGestionCapsule(raw);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.plain).toBe(raw);
  });
});
