#!/usr/bin/env node
// Regenera las secciones de blog dentro de public/sitemap.xml leyendo posts
// publicados desde Supabase. Solo toca el contenido entre los marcadores
// <!-- BLOG-AUTO-START-ES --> ... <!-- BLOG-AUTO-END-ES --> y su equivalente EN.
//
// Uso: VITE_PUBLIC_SITE_URL=https://taimbox.com VITE_SUPABASE_URL=... \
//      VITE_SUPABASE_ANON_KEY=... npm run sitemap:blog
//
// Si no se define VITE_PUBLIC_SITE_URL, se usa https://taimbox.com.

import { readFile, writeFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadDotenv } from "dotenv";
import { createClient } from "@supabase/supabase-js";

loadDotenv();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SITEMAP_PATH = resolve(__dirname, "..", "public", "sitemap.xml");

const SITE_URL = (process.env.VITE_PUBLIC_SITE_URL || "https://taimbox.com").replace(/\/+$/, "");
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error(
    "[sitemap:blog] VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY son obligatorios.",
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function urlEntry(absoluteUrl, priority = "0.9", changefreq = "monthly") {
  return [
    "  <url>",
    `    <loc>${absoluteUrl}</loc>`,
    `    <changefreq>${changefreq}</changefreq>`,
    `    <priority>${priority}</priority>`,
    "  </url>",
  ].join("\n");
}

function buildSection(paths, indexUrl) {
  const lines = [urlEntry(indexUrl, "0.9", "weekly")];
  for (const p of paths) {
    lines.push(urlEntry(`${SITE_URL}${p}`));
  }
  return lines.join("\n");
}

function replaceBetween(source, startMarker, endMarker, replacement) {
  const startIdx = source.indexOf(startMarker);
  const endIdx = source.indexOf(endMarker);
  if (startIdx === -1 || endIdx === -1 || endIdx < startIdx) {
    throw new Error(`[sitemap:blog] No encontre los marcadores ${startMarker} / ${endMarker}.`);
  }
  const before = source.slice(0, startIdx + startMarker.length);
  const after = source.slice(endIdx);
  return `${before}\n${replacement}\n  ${after}`;
}

async function main() {
  const { data, error } = await supabase
    .from("blog_posts")
    .select("path_es,path_en,date")
    .eq("status", "published")
    .order("date", { ascending: false });

  if (error) {
    console.error("[sitemap:blog] Error consultando Supabase:", error.message);
    process.exit(1);
  }

  const paths = data ?? [];
  const esPaths = paths.map((p) => p.path_es);
  const enPaths = paths.map((p) => p.path_en);

  const xml = await readFile(SITEMAP_PATH, "utf8");
  let updated = xml;

  updated = replaceBetween(
    updated,
    "<!-- BLOG-AUTO-START-ES -->",
    "<!-- BLOG-AUTO-END-ES -->",
    buildSection(esPaths, `${SITE_URL}/blog`),
  );
  updated = replaceBetween(
    updated,
    "<!-- BLOG-AUTO-START-EN -->",
    "<!-- BLOG-AUTO-END-EN -->",
    buildSection(enPaths, `${SITE_URL}/en/blog`),
  );

  await writeFile(SITEMAP_PATH, updated, "utf8");
  console.log(
    `[sitemap:blog] Sitemap actualizado: ${paths.length} posts publicados (${esPaths.length} ES + ${enPaths.length} EN).`,
  );
}

main().catch((err) => {
  console.error("[sitemap:blog] Fallo:", err);
  process.exit(1);
});
