import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  BlogBlockSchema,
  safeParseBlocks,
  BLOCK_SCHEMA_VERSION,
} from "../blockSchema";

describe("safeParseBlocks", () => {
  beforeEach(() => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("parsea un array valido de bloques heterogeneos", () => {
    const input = [
      { id: "a", type: "heading" as const, level: 2 as const, text: "Titulo" },
      { id: "b", type: "paragraph" as const, html: "<p>Hola</p>" },
      {
        id: "c",
        type: "list" as const,
        ordered: true,
        items: ["uno", "dos"],
      },
    ];
    expect(safeParseBlocks(input)).toEqual(input);
  });

  it("devuelve array vacio ante JSON malformado en bloques (no rompe la pagina)", () => {
    expect(safeParseBlocks(null)).toEqual([]);
    expect(safeParseBlocks(undefined)).toEqual([]);
    expect(safeParseBlocks("nope")).toEqual([]);
    expect(safeParseBlocks({})).toEqual([]);
    expect(console.warn).toHaveBeenCalled();
  });

  it("rechaza bloques con type desconocido", () => {
    expect(
      safeParseBlocks([{ id: "x", type: "unknown", foo: 1 }]),
    ).toEqual([]);
  });

  it("rechaza heading con anchorId fuera del regex permitido", () => {
    const bad = [
      {
        id: "h1",
        type: "heading" as const,
        level: 2 as const,
        text: "T",
        anchorId: "NO_UPPERCASE",
      },
    ];
    expect(safeParseBlocks(bad)).toEqual([]);
  });

  it("acepta heading con anchorId en minusculas y guiones", () => {
    const ok = [
      {
        id: "h1",
        type: "heading" as const,
        level: 3 as const,
        text: "Seccion",
        anchorId: "mi-seccion-2",
      },
    ];
    expect(safeParseBlocks(ok)).toEqual(ok);
  });

  it("rechaza tabla con filas vacias", () => {
    expect(
      safeParseBlocks([
        {
          id: "t1",
          type: "table" as const,
          headers: ["A"],
          rows: [],
        },
      ]),
    ).toEqual([]);
  });
});

describe("BlogBlockSchema (parse estricto)", () => {
  it("expone la version de esquema esperada por el cliente", () => {
    expect(BLOCK_SCHEMA_VERSION).toBe(1);
  });

  it("parsea visualRef con props opcionales", () => {
    const parsed = BlogBlockSchema.safeParse({
      id: "v1",
      type: "visualRef",
      visualId: "ParkinsonLawVisual",
      props: { a: 1, b: "x" },
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.type).toBe("visualRef");
      expect(parsed.data.props).toEqual({ a: 1, b: "x" });
    }
  });
});
