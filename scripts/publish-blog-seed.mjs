#!/usr/bin/env node
/**
 * Publica un post del CMS desde scripts/blog-seed/*-cms.json
 *
 * Uso:
 *   SUPABASE_URL=https://api.taimbox.com \
 *   SUPABASE_ANON_KEY=... \
 *   SUPABASE_ACCESS_TOKEN=... \
 *   node scripts/publish-blog-seed.mjs scripts/blog-seed/estimacion-proyectos-agencia-cms.json
 *
 * El access token lo obtienes tras login (localStorage sb-api-auth-token).
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const file = process.argv[2];
if (!file) {
  console.error("Uso: node scripts/publish-blog-seed.mjs <ruta-al-seed.json>");
  process.exit(1);
}

const url = process.env.SUPABASE_URL;
const anon = process.env.SUPABASE_ANON_KEY;
const token = process.env.SUPABASE_ACCESS_TOKEN;

if (!url || !anon || !token) {
  console.error("Faltan SUPABASE_URL, SUPABASE_ANON_KEY o SUPABASE_ACCESS_TOKEN.");
  process.exit(1);
}

const seed = JSON.parse(readFileSync(resolve(file), "utf8"));

const row = {
  slug: seed.slug,
  status: seed.status ?? "draft",
  path_es: seed.path_es,
  path_en: seed.path_en,
  title_es: seed.title_es,
  title_en: seed.title_en,
  description_es: seed.description_es,
  description_en: seed.description_en,
  meta_title_es: seed.meta_title_es ?? null,
  meta_title_en: seed.meta_title_en ?? null,
  meta_description_es: seed.meta_description_es ?? null,
  meta_description_en: seed.meta_description_en ?? null,
  date: seed.date ?? new Date().toISOString().slice(0, 10),
  reading_minutes: seed.reading_minutes ?? 5,
  related_slug: seed.related_slug ?? null,
  schema_version: 1,
  blocks_es: seed.blocks_es,
  blocks_en: seed.blocks_en,
  json_ld_es: seed.json_ld_es ?? null,
  json_ld_en: seed.json_ld_en ?? null,
};

const checkRes = await fetch(
  `${url}/rest/v1/blog_posts?slug=eq.${encodeURIComponent(seed.slug)}&select=id,slug`,
  {
    headers: {
      apikey: anon,
      Authorization: `Bearer ${token}`,
    },
  },
);

if (!checkRes.ok) {
  console.error("Error comprobando slug:", checkRes.status, await checkRes.text());
  process.exit(1);
}

const existing = await checkRes.json();
const method = existing.length > 0 ? "PATCH" : "POST";
const endpoint =
  method === "PATCH"
    ? `${url}/rest/v1/blog_posts?slug=eq.${encodeURIComponent(seed.slug)}`
    : `${url}/rest/v1/blog_posts`;

const res = await fetch(endpoint, {
  method,
  headers: {
    apikey: anon,
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  },
  body: JSON.stringify(row),
});

const body = await res.text();
if (!res.ok) {
  console.error(`${method} falló (${res.status}):`, body);
  process.exit(1);
}

console.log(`${method === "POST" ? "Creado" : "Actualizado"}:`, body.slice(0, 200), "...");
