import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { auditPosts, normalizePosts } from "./audit-blog-content.mjs";

function post(overrides = {}) {
  const section = (lang) => [
    { id: `h-${lang}`, type: "heading", level: 2, anchorId: `section-${lang}`, text: lang === "es" ? "Una sección concreta" : "A concrete section" },
    { id: `p-${lang}`, type: "paragraph", html: "Una explicación suficientemente concreta para orientar la decisión del lector sin recurrir a afirmaciones grandilocuentes ni a énfasis visual repetido en cada frase del bloque editorial." },
    { id: `t-${lang}`, type: "table", headers: ["Señal", "Decisión"], rows: [["Cola creciente", "Reducir trabajo en curso"]] },
  ];
  return {
    slug: "example",
    meta_title_es: "Título editorial válido",
    meta_title_en: "Valid editorial title",
    meta_description_es: "Descripción editorial válida.",
    meta_description_en: "Valid editorial description.",
    blocks_es: section("es"),
    blocks_en: section("en"),
    ...overrides,
  };
}

test("acepta un artículo bilingüe estructurado sin incidencias", () => {
  assert.deepEqual(auditPosts([post()]), []);
});

test("detecta errores de migración, traducción, IDs, anclas y negrita", () => {
  const broken = post({
    meta_title_en: "",
    blocks_es: [
      { id: "dup", type: "heading", level: 2, anchorId: "CamelCase", text: "La verdad que nadie cuenta" },
      { id: "dup", type: "paragraph", html: '<strong>Todo este texto está en negrita</strong> <strong>y también esto</strong> **resto** <a href="#">enlace</a>' },
    ],
    blocks_en: [
      { id: "h-en", type: "heading", level: 2, anchorId: "thin-en", text: "Short section" },
      { id: "p-en", type: "paragraph", html: "Too short." },
      { id: "cta-en", type: "cta", text: "Probar Taimbox", href: "/" },
    ],
  });
  const codes = new Set(auditPosts([broken]).map((item) => item.code));
  for (const code of ["missing-metadata", "locale-block-parity", "invalid-anchor-id", "duplicate-block-id", "placeholder-link", "markdown-residual", "spanish-cta-in-en", "overpromising-heading", "too-many-strong-spans", "strong-density", "adjacent-strong", "thin-h2-section"]) {
    assert.equal(codes.has(code), true, `Falta detectar ${code}`);
  }
});

test("no marca como pobre un H2 padre que organiza subsecciones", () => {
  const parent = post({
    blocks_es: [
      { id: "parent-es", type: "heading", level: 2, anchorId: "metodos", text: "Tres métodos" },
      { id: "child-es", type: "heading", level: 3, anchorId: "analogia", text: "Analogía" },
      { id: "body-es", type: "paragraph", html: "Compara trabajos realmente equivalentes y documenta las diferencias." },
    ],
    blocks_en: [
      { id: "parent-en", type: "heading", level: 2, anchorId: "methods", text: "Three methods" },
      { id: "child-en", type: "heading", level: 3, anchorId: "analogy", text: "Analogy" },
      { id: "body-en", type: "paragraph", html: "Compare genuinely equivalent work and document the differences." },
    ],
  });
  assert.equal(auditPosts([parent]).some((item) => item.code === "thin-h2-section"), false);
});

test("normaliza export directo y dry run con patch", () => {
  assert.equal(normalizePosts([post()]).length, 1);
  const normalized = normalizePosts({ updates: [{ slug: "dry", patch: post() }] });
  assert.equal(normalized[0].slug, "dry");
  assert.equal(Array.isArray(normalized[0].blocks_es), true);
});

test("bloquea la migración legacy sin aprobación explícita", () => {
  const script = fileURLToPath(new URL("./migrate-blog-content.mjs", import.meta.url));
  const result = spawnSync(process.execPath, [script], {
    encoding: "utf8",
    env: { ...process.env, ALLOW_LEGACY_BLOG_MIGRATION: "" },
  });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Bloqueado por seguridad/);
});
