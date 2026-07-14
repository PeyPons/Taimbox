import { describe, expect, it } from "vitest";
import { blogLocaleFromPathname } from "../localeFromPath";
import { resolveRelatedSlugForLocale } from "../types";

describe("blogLocaleFromPathname", () => {
  it("detecta inglés en rutas /en/", () => {
    expect(blogLocaleFromPathname("/en/blog/foo")).toBe("en");
    expect(blogLocaleFromPathname("/en")).toBe("en");
  });

  it("detecta español en rutas sin prefijo /en", () => {
    expect(blogLocaleFromPathname("/blog/foo")).toBe("es");
    expect(blogLocaleFromPathname("/")).toBe("es");
  });
});

describe("resolveRelatedSlugForLocale", () => {
  const post = {
    relatedSlug: "slug-es",
    relatedSlugEn: "slug-en",
  };

  it("usa relatedSlugEn en inglés", () => {
    expect(resolveRelatedSlugForLocale(post, "en")).toBe("slug-en");
  });

  it("hace fallback a relatedSlug si relatedSlugEn está vacío", () => {
    expect(resolveRelatedSlugForLocale({ relatedSlug: "slug-es", relatedSlugEn: null }, "en")).toBe(
      "slug-es",
    );
    expect(resolveRelatedSlugForLocale({ relatedSlug: "slug-es", relatedSlugEn: "  " }, "en")).toBe(
      "slug-es",
    );
  });

  it("usa relatedSlug en español", () => {
    expect(resolveRelatedSlugForLocale(post, "es")).toBe("slug-es");
  });

  it("devuelve null si no hay slug", () => {
    expect(resolveRelatedSlugForLocale({ relatedSlug: null, relatedSlugEn: null }, "es")).toBeNull();
  });
});
