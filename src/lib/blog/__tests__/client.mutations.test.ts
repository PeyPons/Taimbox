import { describe, it, expect, vi, beforeEach } from "vitest";
import type { BlogPostRow } from "../types";
import type { UpsertBlogPostInput } from "../client";

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn(),
  },
}));

import { supabase } from "@/lib/supabase";
import { createPost, updatePost } from "../client";

function makeRow(overrides: Partial<BlogPostRow> = {}): BlogPostRow {
  return {
    id: "post-id-1",
    slug: "test-slug",
    status: "draft",
    path_es: "/es/blog/test",
    path_en: "/en/blog/test",
    title_es: "T es",
    title_en: "T en",
    description_es: "D es",
    description_en: "D en",
    meta_title_es: null,
    meta_title_en: null,
    meta_description_es: null,
    meta_description_en: null,
    date: "2026-01-01",
    reading_minutes: 5,
    related_slug: null,
    schema_version: 1,
    blocks_es: [{ id: "b-es", type: "toc" }],
    blocks_en: [{ id: "b-en", type: "toc" }],
    json_ld_es: null,
    json_ld_en: null,
    published_at: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

function baseInput(overrides: Partial<UpsertBlogPostInput> = {}): UpsertBlogPostInput {
  return {
    slug: "test-slug",
    status: "draft",
    pathEs: "/es/blog/test",
    pathEn: "/en/blog/test",
    titleEs: "T es",
    titleEn: "T en",
    descriptionEs: "D es",
    descriptionEn: "D en",
    date: "2026-01-01",
    readingMinutes: 5,
    blocksEs: [{ id: "b-es", type: "toc" }],
    blocksEn: [{ id: "b-en", type: "toc" }],
    ...overrides,
  };
}

describe("blog client — mutaciones admin (insert/update + re-fetch)", () => {
  const fromMock = vi.mocked(supabase.from);

  beforeEach(() => {
    fromMock.mockReset();
  });

  it("createPost hace INSERT con id y luego SELECT por slug (sin depender del RETURNING completo)", async () => {
    const row = makeRow();
    let fromCalls = 0;
    fromMock.mockImplementation(() => {
      fromCalls += 1;
      if (fromCalls === 1) {
        return {
          insert: () => ({
            select: () => ({
              single: async () => ({ data: { id: row.id }, error: null }),
            }),
          }),
        };
      }
      if (fromCalls === 2) {
        return {
          select: () => ({
            eq: (col: string, val: string) => ({
              maybeSingle: async () => {
                expect(col).toBe("slug");
                expect(val).toBe("test-slug");
                return { data: row, error: null };
              },
            }),
          }),
        };
      }
      throw new Error(`from() inesperado: llamada ${fromCalls}`);
    });

    const record = await createPost(baseInput());
    expect(fromCalls).toBe(2);
    expect(record.id).toBe(row.id);
    expect(record.slug).toBe("test-slug");
  });

  it("createPost lanza si INSERT no devuelve id", async () => {
    fromMock.mockImplementation(() => ({
      insert: () => ({
        select: () => ({
          single: async () => ({ data: null, error: null }),
        }),
      }),
    }));
    await expect(createPost(baseInput())).rejects.toThrow(
      "No se devolvio el id tras INSERT",
    );
  });

  it("createPost lanza si el re-fetch por slug no encuentra fila", async () => {
    let fromCalls = 0;
    fromMock.mockImplementation(() => {
      fromCalls += 1;
      if (fromCalls === 1) {
        return {
          insert: () => ({
            select: () => ({
              single: async () => ({ data: { id: "x" }, error: null }),
            }),
          }),
        };
      }
      return {
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({ data: null, error: null }),
          }),
        }),
      };
    });
    await expect(createPost(baseInput())).rejects.toThrow(
      "Post creado pero no se pudo recuperar",
    );
  });

  it("updatePost hace UPDATE sin SELECT y luego SELECT por id con maybeSingle", async () => {
    const row = makeRow({ id: "uuid-99" });
    let fromCalls = 0;
    const updateEq = vi.fn(async () => ({ error: null }));
    fromMock.mockImplementation(() => {
      fromCalls += 1;
      if (fromCalls === 1) {
        return {
          update: () => ({
            eq: updateEq,
          }),
        };
      }
      if (fromCalls === 2) {
        return {
          select: () => ({
            eq: (col: string, val: string) => ({
              maybeSingle: async () => {
                expect(col).toBe("id");
                expect(val).toBe("uuid-99");
                return { data: row, error: null };
              },
            }),
          }),
        };
      }
      throw new Error(`from() inesperado: llamada ${fromCalls}`);
    });

    const record = await updatePost("uuid-99", baseInput());
    expect(fromCalls).toBe(2);
    expect(updateEq).toHaveBeenCalledWith("id", "uuid-99");
    expect(record.id).toBe("uuid-99");
  });

  it("updatePost lanza si el SELECT posterior no devuelve fila", async () => {
    let fromCalls = 0;
    fromMock.mockImplementation(() => {
      fromCalls += 1;
      if (fromCalls === 1) {
        return {
          update: () => ({
            eq: async () => ({ error: null }),
          }),
        };
      }
      return {
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({ data: null, error: null }),
          }),
        }),
      };
    });
    await expect(updatePost("uuid-99", baseInput())).rejects.toThrow(
      "Post actualizado pero no se pudo recuperar",
    );
  });
});
