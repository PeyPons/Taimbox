import { PATCHES } from "./blog-expand-paragraphs-patches.mjs";
import { writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

function sqlEscape(str) {
  return str.replace(/'/g, "''");
}

function buildPatchCase(patches) {
  const whens = Object.entries(patches)
    .map(
      ([id, html]) =>
        `      WHEN elem->>'id' = '${sqlEscape(id)}' THEN jsonb_set(elem, '{html}', to_jsonb('${sqlEscape(html)}'::text))`,
    )
    .join("\n");
  return `CASE\n${whens}\n      ELSE elem\n    END`;
}

function buildUpdate(slug, column, patches) {
  return `UPDATE public.blog_posts SET ${column} = (
  SELECT COALESCE(jsonb_agg(${buildPatchCase(patches)} ORDER BY ord), '[]'::jsonb)
  FROM jsonb_array_elements(${column}) WITH ORDINALITY AS t(elem, ord)
) WHERE slug = '${sqlEscape(slug)}';`;
}

let sql = "-- Part 2: plantilla + fragmentos ley/timeboxing\n";

for (const slug of ["plantilla-planificacion-recursos-agencia"]) {
  sql += `\n-- ${slug}\n`;
  sql += buildUpdate(slug, "blocks_es", PATCHES[slug].es) + "\n\n";
  sql += buildUpdate(slug, "blocks_en", PATCHES[slug].en) + "\n\n";
}

for (const slug of ["ley-parkinson", "que-es-timeboxing"]) {
  const pick = (loc) =>
    Object.fromEntries(
      Object.entries(PATCHES[slug][loc]).filter(([id]) =>
        ["3a0f20cd-a127-4c74-b3a0-cf9b80be8eae", "27b30477-ae01-48a3-8701-e7dfe7b6ebbc"].includes(id),
      ),
    );
  const es = pick("es");
  const en = pick("en");
  if (!Object.keys(es).length) continue;
  sql += `\n-- ${slug} (extra)\n`;
  sql += buildUpdate(slug, "blocks_es", es) + "\n\n";
  sql += buildUpdate(slug, "blocks_en", en) + "\n\n";
}

writeFileSync(
  join(__dirname, "..", "supabase", "migrations", "20260604120100_blog_expand_short_paragraphs_part2.sql"),
  sql,
);
console.log("part2 written");
