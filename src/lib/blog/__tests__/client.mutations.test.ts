import { describe, it, expect, vi, beforeEach } from "vitest";
import { BLOCK_SCHEMA_VERSION } from "../blockSchema";
import type { BlogPostRow } from "../types";
import type { UpsertBlogPostInput } from "../client";

const minimalBlocks = [
  { id: "b1", type: "paragraph" as const, html: "<p>t</p>" },
];

function baseInput(over: Partial<UpsertBlogPostInput> = {}): UpsertBlogPostInput {
  return {
    slug: "post-test",
    status: "draft",
    pathEs: "/blog/es/post-test",
    pathEn: "/blog/en/post-test",
    titleEs: "T ES",
    titleEn: "T EN",
    descriptionEs: "D ES",
    descriptionEn: "D EN",
    date: "2026-05-01",
    readingMinutes: 3,
    blocksEs: minimalBlocks,
    blocksEn: minimalBlocks,
    ...over,
  };
}

function fullRow(over: Partial<BlogPostRow> = {}): BlogPostRow {
  return {
    id: "row-1",
    slug: "post-test",
    status: "draft",
    path_es: "/blog/es/post-test",
    path_en: "/blog/en/post-test",
    title_es: "T ES",
    title_en: "T EN",
    description_es: "D ES",
    description_en: "D EN",
    meta_title_es: null,
    meta_title_en: null,
    meta_description_es: null,
    meta_description_en: null,
    date: "2026-05-01",
    reading_minutes: 3,
    related_slug: null,
    schema_version: BLOCK_SCHEMA_VERSION,
    blocks_es: minimalBlocks,
    blocks_en: minimalBlocks,
    json_ld_es: null,
    json_ld_en: null,
    published_at: null,
    created_at: "2026-05-01T10:00:00Z",
    updated_at: "2026-05-01T10:00:00Z",
    ...over,
  };
}

type MockConfig = {
  insertSingle?: { data: unknown; error: unknown };
  selectBySlug?: { data: unknown; error: unknown };
  updateEq?: { error: unknown };
  selectById?: { data: unknown; error: unknown };
};

const blogSupabaseMock = vi.hoisted(() => {
  let config: MockConfig = {};
  let lastInsertPayload: unknown;

  const defaultSlugRow = (): BlogPostRow => ({
    id: "row-1",
    slug: "post-test",
    status: "draft",
    path_es: "/blog/es/post-test",
    path_en: "/blog/en/post-test",
    title_es: "T ES",
    title_en: "T EN",
    description_es: "D ES",
    description_en: "D EN",
    meta_title_es: null,
    meta_title_en: null,
    meta_description_es: null,
    meta_description_en: null,
    date: "2026-05-01",
    reading_minutes: 3,
    related_slug: null,
    schema_version: BLOCK_SCHEMA_VERSION,
    blocks_es: minimalBlocks,
    blocks_en: minimalBlocks,
    json_ld_es: null,
    json_ld_en: null,
    published_at: null,
    created_at: "2026-05-01T10:00:00Z",
    updated_at: "2026-05-01T10:00:00Z",
  });

  function createFrom() {
    return {
      insert: (payload: unknown) => {
        lastInsertPayload = payload;
        return {
          select: () => ({
            single: async () =>
              config.insertSingle ?? { data: { id: "row-1" }, error: null },
          }),
        };
      },
      select: () => ({
        eq: (col: string) => ({
          maybeSingle: async () => {
            if (col === "slug") {
              return config.selectBySlug ?? { data: defaultSlugRow(), error: null };
            }
            if (col === "id") {
              return config.selectById ?? { data: defaultSlugRow(), error: null };
            }
            return { data: null, error: null };
          },
        }),
      }),
      update: () => ({
        eq: async () => ({ error: config.updateEq?.error ?? null }),
      }),
    };
  }

  return {
    fromMock: vi.fn(() => createFrom()),
    setConfig: (c: MockConfig) => {
      config = c;
    },
    resetConfig: () => {
      config = {};
      lastInsertPayload = undefined;
    },
    getLastInsertPayload: () => lastInsertPayload,
  };
});

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: blogSupabaseMock.fromMock,
  },
}));

import { createPost, updatePost } from "../client";

describe("blog client — mutaciones admin (INSERT/UPDATE + SELECT aparte)", () => {
  beforeEach(() => {
    blogSupabaseMock.resetConfig();
    blogSupabaseMock.fromMock.mockClear();
  });

  it("createPost: insert devuelve id y luego rehidrata con SELECT por slug", async () => {
    const row = fullRow({ id: "abc", title_es: "Recuperado" });
    blogSupabaseMock.setConfig({
      insertSingle: { data: { id: "abc" }, error: null },
      selectBySlug: { data: row, error: null },
    });

    const input = baseInput();
    const record = await createPost(input);

    expect(record.id).toBe("abc");
    expect(record.titleEs).toBe("Recuperado");
    expect(blogSupabaseMock.fromMock).toHaveBeenCalledWith("blog_posts");
    expect(blogSupabaseMock.getLastInsertPayload()).toMatchObject({
      slug: "post-test",
      schema_version: BLOCK_SCHEMA_VERSION,
      path_es: "/blog/es/post-test",
    });
  });

  it("createPost: propaga error de INSERT", async () => {
    const err = { message: "duplicate", code: "23505" };
    blogSupabaseMock.setConfig({
      insertSingle: { data: null, error: err },
    });
    await expect(createPost(baseInput())).rejects.toBe(err);
  });

  it("createPost: lanza si INSERT no devuelve fila con id", async () => {
    blogSupabaseMock.setConfig({
      insertSingle: { data: null, error: null },
    });
    await expect(createPost(baseInput())).rejects.toThrow("No se devolvio el id tras INSERT");
  });

  it("createPost: lanza si el SELECT posterior no ve el post (RLS / visibilidad)", async () => {
    blogSupabaseMock.setConfig({
      insertSingle: { data: { id: "row-1" }, error: null },
      selectBySlug: { data: null, error: null },
    });
    await expect(createPost(baseInput())).rejects.toThrow(
      "Post creado pero no se pudo recuperar (slug=post-test)",
    );
  });

  it("updatePost: UPDATE sin representation y luego SELECT por id devuelve el registro", async () => {
    const row = fullRow({ title_es: "Actualizado" });
    blogSupabaseMock.setConfig({
      updateEq: { error: null },
      selectById: { data: row, error: null },
    });

    const record = await updatePost("row-1", baseInput({ titleEs: "Actualizado" }));
    expect(record.titleEs).toBe("Actualizado");
    expect(blogSupabaseMock.fromMock.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it("updatePost: propaga error de UPDATE", async () => {
    const err = { message: "rls", code: "42501" };
    blogSupabaseMock.setConfig({ updateEq: { error: err } });
    await expect(updatePost("row-1", baseInput())).rejects.toBe(err);
  });

  it("updatePost: lanza si el SELECT posterior no devuelve fila", async () => {
    blogSupabaseMock.setConfig({
      updateEq: { error: null },
      selectById: { data: null, error: null },
    });
    await expect(updatePost("x-id", baseInput())).rejects.toThrow(
      "Post actualizado pero no se pudo recuperar (id=x-id)",
    );
  });

  it("updatePost: propaga error del SELECT", async () => {
    const selErr = { message: "bad request" };
    blogSupabaseMock.setConfig({
      updateEq: { error: null },
      selectById: { data: null, error: selErr },
    });
    await expect(updatePost("row-1", baseInput())).rejects.toBe(selErr);
  });
});
