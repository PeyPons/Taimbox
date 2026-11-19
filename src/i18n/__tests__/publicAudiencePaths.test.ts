import { describe, expect, it } from "vitest";
import { pathEnToEs, pathEsToEn } from "@/i18n/publicPaths";
import { resolveHreflangFromPathname } from "@/seo/hreflangPaths";

const PAIRS = [
  ["/para-quien", "/en/who-its-for"],
  ["/agencias-performance", "/en/performance-agencies"],
  ["/estudios-creativos", "/en/creative-studios"],
  ["/agencias-integrales", "/en/full-service-agencies"],
] as const;

describe("rutas públicas por tipo de agencia", () => {
  it.each(PAIRS)("%s tiene par en inglés %s", (pathEs, pathEn) => {
    expect(pathEsToEn(pathEs)).toBe(pathEn);
    expect(pathEnToEs(pathEn)).toBe(pathEs);
    expect(resolveHreflangFromPathname(pathEs)).toMatchObject({
      pathEs,
      pathEn,
      lang: "es",
    });
    expect(resolveHreflangFromPathname(pathEn)?.lang).toBe("en");
  });
});
