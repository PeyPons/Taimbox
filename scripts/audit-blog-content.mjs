#!/usr/bin/env node

import fs from "node:fs/promises";
import { pathToFileURL } from "node:url";

const INLINE_FIELDS = {
  paragraph: ["html"],
  callout: ["html"],
  html: ["html"],
};

const MIGRATION_PATTERNS = [
  { code: "placeholder-link", pattern: /href=["']#/i, message: "Enlace placeholder href=\"#\"." },
  { code: "markdown-residual", pattern: /\*\*[^*]+\*\*/, message: "Markdown ** residual dentro del bloque." },
  { code: "mixed-language", pattern: /\bNo necessarily\b/i, message: "Texto inglés residual conocido dentro del contenido español." },
  { code: "joined-words", pattern: /\b(?:deplanificación|equipoconecta|laLey|enKPIs|enLey|ytimeboxing|theParkinson|inKPIs|inParkinson|andtimeboxing|inproject)\b/i, message: "Unión de palabras conocida de la migración." },
];

const OVERPROMISE_PATTERNS = [
  /\bque nadie (?:ve|cuenta|incluye)\b/i,
  /\bque muchos .* no (?:ven|saben)\b/i,
  /\bla verdad (?:incómoda|definitiva)\b/i,
  /\bguía definitiva\b/i,
  /\bthe truth nobody\b/i,
  /\bwhat nobody tells you\b/i,
  /\bultimate guide\b/i,
];

const SPANISH_CTA_PATTERN = /\b(?:probar|ver|descargar|explorar|planificador|rentabilidad|plantilla|guía)\b/i;

function stripHtml(value = "") {
  return String(value)
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z#0-9]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function wordCount(value = "") {
  const text = stripHtml(value);
  return text ? text.split(/\s+/).filter(Boolean).length : 0;
}

function blockText(block) {
  const parts = [];
  if (block.html) parts.push(block.html);
  if (block.text) parts.push(block.text);
  if (block.text && block.type === "cta") parts.push(block.text);
  if (Array.isArray(block.items)) {
    if (block.type === "faq") {
      for (const item of block.items) parts.push(item.q ?? "", item.a ?? "");
    } else {
      parts.push(...block.items);
    }
  }
  if (Array.isArray(block.headers)) parts.push(...block.headers);
  if (Array.isArray(block.rows)) parts.push(...block.rows.flat());
  return parts.join(" ");
}

function inlineValues(block) {
  const values = [];
  for (const field of INLINE_FIELDS[block.type] ?? []) {
    if (typeof block[field] === "string") values.push({ field, value: block[field] });
  }
  if (block.type === "list") {
    for (const [index, value] of (block.items ?? []).entries()) values.push({ field: `items.${index}`, value });
  }
  if (block.type === "table") {
    for (const [index, value] of (block.headers ?? []).entries()) values.push({ field: `headers.${index}`, value });
    for (const [rowIndex, row] of (block.rows ?? []).entries()) {
      for (const [cellIndex, value] of row.entries()) values.push({ field: `rows.${rowIndex}.${cellIndex}`, value });
    }
  }
  if (block.type === "faq") {
    for (const [index, item] of (block.items ?? []).entries()) {
      values.push({ field: `items.${index}.q`, value: item.q ?? "" });
      values.push({ field: `items.${index}.a`, value: item.a ?? "" });
    }
  }
  return values;
}

export function normalizePosts(input) {
  if (Array.isArray(input)) return input;
  if (Array.isArray(input?.posts)) return input.posts;
  if (Array.isArray(input?.updates)) {
    return input.updates.map((item) => ({ ...(item.patch ?? item), slug: item.slug ?? item.patch?.slug, id: item.id ?? item.patch?.id }));
  }
  throw new Error("El JSON debe ser un array de posts, { posts: [] } o { updates: [{ patch }] }.");
}

export function auditPosts(posts) {
  const issues = [];
  const add = (severity, code, post, lang, message, blockId, field) => {
    issues.push({ severity, code, slug: post.slug ?? post.id ?? "sin-slug", lang, blockId, field, message });
  };

  for (const post of posts) {
    for (const lang of ["es", "en"]) {
      for (const field of [`meta_title_${lang}`, `meta_description_${lang}`]) {
        if (typeof post[field] !== "string" || !post[field].trim()) {
          add("error", "missing-metadata", post, lang, `Falta ${field}.`);
        }
      }
    }

    const esBlocks = post.blocks_es;
    const enBlocks = post.blocks_en;
    if (!Array.isArray(esBlocks) || !Array.isArray(enBlocks)) {
      add("error", "missing-blocks", post, "both", "blocks_es y blocks_en deben ser arrays.");
      continue;
    }
    if (esBlocks.length !== enBlocks.length) {
      add("warning", "locale-block-parity", post, "both", `Paridad ES/EN distinta: ${esBlocks.length} frente a ${enBlocks.length}. Justificar o corregir.`);
    }

    for (const [lang, blocks] of [["es", esBlocks], ["en", enBlocks]]) {
      const seenIds = new Set();
      for (const block of blocks) {
        if (!block?.id) {
          add("error", "missing-block-id", post, lang, "Bloque sin id.");
        } else if (seenIds.has(block.id)) {
          add("error", "duplicate-block-id", post, lang, `ID duplicado: ${block.id}.`, block.id);
        } else {
          seenIds.add(block.id);
        }

        if (block.anchorId && !/^[a-z0-9-]+$/.test(block.anchorId)) {
          add("error", "invalid-anchor-id", post, lang, `anchorId inválido: ${block.anchorId}. Usar minúsculas, números y guiones.`, block.id, "anchorId");
        }

        const raw = [block.text ?? "", ...inlineValues(block).map((item) => item.value)].join(" ");
        for (const check of MIGRATION_PATTERNS) {
          if (check.pattern.test(raw)) add("error", check.code, post, lang, check.message, block.id);
        }

        if (block.type === "cta" && lang === "en" && SPANISH_CTA_PATTERN.test(block.text ?? "")) {
          add("error", "spanish-cta-in-en", post, lang, `CTA inglés con texto posiblemente español: “${block.text}”.`, block.id, "text");
        }

        if (block.type === "heading" && OVERPROMISE_PATTERNS.some((pattern) => pattern.test(block.text ?? ""))) {
          add("warning", "overpromising-heading", post, lang, `Titular posiblemente grandilocuente: “${block.text}”. Sustituir por una promesa concreta.`, block.id, "text");
        }

        for (const { field, value } of inlineValues(block)) {
          const strongMatches = [...String(value).matchAll(/<strong\b[^>]*>([\s\S]*?)<\/strong>/gi)];
          if (!strongMatches.length) continue;
          const totalWords = wordCount(value);
          const strongWords = strongMatches.reduce((sum, match) => sum + wordCount(match[1]), 0);
          const density = totalWords ? strongWords / totalWords : 0;

          if ((block.type === "paragraph" || block.type === "callout" || block.type === "html") && strongMatches.length > 1) {
            add("warning", "too-many-strong-spans", post, lang, `${strongMatches.length} fragmentos <strong> en un mismo bloque narrativo. Usar jerarquía o estructura en lugar de negrita repetida.`, block.id, field);
          }
          if (density > 0.3) {
            add("warning", "strong-density", post, lang, `${Math.round(density * 100)} % de las palabras del fragmento están en negrita.`, block.id, field);
          }
          if (/<\/strong>\s*<strong\b/i.test(value)) {
            add("warning", "adjacent-strong", post, lang, "Fragmentos <strong> adyacentes; unir la idea o eliminar énfasis.", block.id, field);
          }
          if (block.type === "table") {
            add("warning", "strong-inside-table", post, lang, "La tabla ya aporta jerarquía visual; evitar <strong> dentro de celdas salvo excepción justificada.", block.id, field);
          }
        }

        if (block.type === "list" && (block.items?.length ?? 0) >= 3) {
          const itemsWithStrong = block.items.filter((item) => /<strong\b/i.test(item)).length;
          if (itemsWithStrong / block.items.length > 0.5) {
            add("warning", "strong-in-most-list-items", post, lang, `Hay negrita en ${itemsWithStrong}/${block.items.length} elementos. Reservarla para los ítems realmente prioritarios.`, block.id, "items");
          }
        }
      }

      for (let index = 0; index < blocks.length; index += 1) {
        const h2 = blocks[index];
        if (h2.type !== "heading" || h2.level !== 2) continue;
        const body = [];
        for (let cursor = index + 1; cursor < blocks.length; cursor += 1) {
          const next = blocks[cursor];
          if (next.type === "heading" && next.level === 2) break;
          body.push(next);
        }
        const hasSubheading = body.some((item) => item.type === "heading" && item.level > 2);
        const hasStructuredBlock = body.some((item) => ["table", "list", "callout", "visualRef", "faq", "cta", "relatedPost"].includes(item.type));
        const words = body.reduce((sum, item) => sum + wordCount(blockText(item)), 0);
        if (!hasSubheading && !hasStructuredBlock && words < 60) {
          add("warning", "thin-h2-section", post, lang, `La sección H2 solo desarrolla ${words} palabras y no incluye un bloque estructurado.`, h2.id, "text");
        }
      }
    }
  }

  return issues;
}

async function loadLivePosts() {
  const { config } = await import("dotenv");
  const { createClient } = await import("@supabase/supabase-js");
  config({ quiet: true });
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("--live requiere VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.");
  const supabase = createClient(url, key);
  const { data, error } = await supabase.from("blog_posts").select("*").eq("status", "published").order("published_at");
  if (error) throw error;
  return data ?? [];
}

function printHuman(issues, postCount) {
  const errors = issues.filter((item) => item.severity === "error");
  const warnings = issues.filter((item) => item.severity === "warning");
  console.log(`[audit:blog] ${postCount} artículos · ${errors.length} errores · ${warnings.length} avisos`);
  for (const issue of issues) {
    const location = [issue.slug, issue.lang, issue.blockId, issue.field].filter(Boolean).join("/");
    console.log(`${issue.severity === "error" ? "ERROR" : "WARN "} [${issue.code}] ${location}: ${issue.message}`);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const strict = args.includes("--strict");
  const json = args.includes("--json");
  const live = args.includes("--live");
  const file = args.find((arg) => !arg.startsWith("--"));
  if (!live && !file) {
    throw new Error("Uso: npm run audit:blog -- <export.json> [--strict|--json] o npm run audit:blog -- --live [--strict|--json].");
  }
  const posts = live ? await loadLivePosts() : normalizePosts(JSON.parse(await fs.readFile(file, "utf8")));
  const issues = auditPosts(posts);
  if (json) console.log(JSON.stringify({ posts: posts.length, issues }, null, 2));
  else printHuman(issues, posts.length);
  const hasErrors = issues.some((item) => item.severity === "error");
  const hasWarnings = issues.some((item) => item.severity === "warning");
  process.exitCode = hasErrors || (strict && hasWarnings) ? 1 : 0;
}

const isEntrypoint = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isEntrypoint) main().catch((error) => {
  console.error(`[audit:blog] ${error.message}`);
  process.exitCode = 1;
});
