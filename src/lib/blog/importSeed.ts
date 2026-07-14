import { BlogBlocksSchema } from "./blockSchema";
import type { BlogBlock } from "./blockSchema";
import type { BlogPostStatus } from "./types";

/** Formato exportado por scripts/blog-seed/*.json y el botón «Exportar seed» del admin. */
export interface BlogCmsSeed {
  slug: string;
  status?: BlogPostStatus;
  path_es: string;
  path_en: string;
  date?: string;
  reading_minutes?: number;
  related_slug?: string | null;
  related_slug_en?: string | null;
  title_es: string;
  title_en: string;
  description_es: string;
  description_en: string;
  meta_title_es?: string | null;
  meta_title_en?: string | null;
  meta_description_es?: string | null;
  meta_description_en?: string | null;
  blocks_es: BlogBlock[];
  blocks_en: BlogBlock[];
  json_ld_es?: Record<string, unknown> | Record<string, unknown>[] | null;
  json_ld_en?: Record<string, unknown> | Record<string, unknown>[] | null;
}

export interface BlogSeedFormPatch {
  slug: string;
  status: BlogPostStatus;
  pathEs: string;
  pathEn: string;
  date: string;
  readingMinutes: number;
  relatedSlug: string;
  relatedSlugEn: string;
  titleEs: string;
  titleEn: string;
  descriptionEs: string;
  descriptionEn: string;
  metaTitleEs: string;
  metaTitleEn: string;
  metaDescriptionEs: string;
  metaDescriptionEn: string;
  blocksEsRaw: string;
  blocksEnRaw: string;
  jsonLdEsRaw: string;
  jsonLdEnRaw: string;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function readString(obj: Record<string, unknown>, key: string, required = true): string | null {
  const v = obj[key];
  if (v == null || v === "") return required ? null : "";
  if (typeof v !== "string") return null;
  return v.trim();
}

function readOptionalString(obj: Record<string, unknown>, key: string): string {
  const v = obj[key];
  if (v == null || v === "") return "";
  return typeof v === "string" ? v.trim() : "";
}

export function parseBlogCmsSeed(input: unknown):
  | { ok: true; seed: BlogCmsSeed }
  | { ok: false; error: string } {
  if (!isRecord(input)) {
    return { ok: false, error: "El JSON debe ser un objeto." };
  }

  const slug = readString(input, "slug");
  const pathEs = readString(input, "path_es");
  const pathEn = readString(input, "path_en");
  const titleEs = readString(input, "title_es");
  const titleEn = readString(input, "title_en");
  const descriptionEs = readString(input, "description_es");
  const descriptionEn = readString(input, "description_en");

  if (!slug) return { ok: false, error: "Falta slug." };
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return { ok: false, error: "slug inválido (solo minúsculas, números y guiones)." };
  }
  if (!pathEs?.startsWith("/blog/")) return { ok: false, error: "path_es debe empezar por /blog/." };
  if (!pathEn?.startsWith("/en/blog/")) {
    return { ok: false, error: "path_en debe empezar por /en/blog/." };
  }
  if (!titleEs || !titleEn) return { ok: false, error: "Faltan title_es o title_en." };
  if (!descriptionEs || !descriptionEn) {
    return { ok: false, error: "Faltan description_es o description_en." };
  }

  const blocksEsResult = BlogBlocksSchema.safeParse(input.blocks_es);
  if (!blocksEsResult.success) {
    return { ok: false, error: `blocks_es: ${blocksEsResult.error.issues[0]?.message ?? "inválido"}` };
  }
  const blocksEnResult = BlogBlocksSchema.safeParse(input.blocks_en);
  if (!blocksEnResult.success) {
    return { ok: false, error: `blocks_en: ${blocksEnResult.error.issues[0]?.message ?? "inválido"}` };
  }

  const statusRaw = readOptionalString(input, "status") || "draft";
  if (statusRaw !== "draft" && statusRaw !== "published") {
    return { ok: false, error: "status debe ser draft o published." };
  }

  const readingMinutes =
    typeof input.reading_minutes === "number" && input.reading_minutes > 0
      ? Math.min(239, Math.round(input.reading_minutes))
      : 5;

  const seed: BlogCmsSeed = {
    slug,
    status: statusRaw,
    path_es: pathEs,
    path_en: pathEn,
    date: readOptionalString(input, "date") || new Date().toISOString().slice(0, 10),
    reading_minutes: readingMinutes,
    related_slug: readOptionalString(input, "related_slug") || null,
    title_es: titleEs,
    title_en: titleEn,
    description_es: descriptionEs,
    description_en: descriptionEn,
    meta_title_es: readOptionalString(input, "meta_title_es") || null,
    meta_title_en: readOptionalString(input, "meta_title_en") || null,
    meta_description_es: readOptionalString(input, "meta_description_es") || null,
    meta_description_en: readOptionalString(input, "meta_description_en") || null,
    blocks_es: blocksEsResult.data,
    blocks_en: blocksEnResult.data,
    json_ld_es: isRecord(input.json_ld_es) || Array.isArray(input.json_ld_es)
      ? (input.json_ld_es as BlogCmsSeed["json_ld_es"])
      : null,
    json_ld_en: isRecord(input.json_ld_en) || Array.isArray(input.json_ld_en)
      ? (input.json_ld_en as BlogCmsSeed["json_ld_en"])
      : null,
  };

  return { ok: true, seed };
}

export function seedToFormPatch(seed: BlogCmsSeed): BlogSeedFormPatch {
  return {
    slug: seed.slug,
    status: seed.status ?? "draft",
    pathEs: seed.path_es,
    pathEn: seed.path_en,
    date: seed.date ?? new Date().toISOString().slice(0, 10),
    readingMinutes: seed.reading_minutes ?? 5,
    relatedSlug: seed.related_slug ?? "",
    relatedSlugEn: seed.related_slug_en ?? "",
    titleEs: seed.title_es,
    titleEn: seed.title_en,
    descriptionEs: seed.description_es,
    descriptionEn: seed.description_en,
    metaTitleEs: seed.meta_title_es ?? "",
    metaTitleEn: seed.meta_title_en ?? "",
    metaDescriptionEs: seed.meta_description_es ?? "",
    metaDescriptionEn: seed.meta_description_en ?? "",
    blocksEsRaw: JSON.stringify(seed.blocks_es, null, 2),
    blocksEnRaw: JSON.stringify(seed.blocks_en, null, 2),
    jsonLdEsRaw: seed.json_ld_es ? JSON.stringify(seed.json_ld_es, null, 2) : "",
    jsonLdEnRaw: seed.json_ld_en ? JSON.stringify(seed.json_ld_en, null, 2) : "",
  };
}

export function formToCmsSeed(form: {
  slug: string;
  status: BlogPostStatus;
  pathEs: string;
  pathEn: string;
  date: string;
  readingMinutes: number;
  relatedSlug: string;
  relatedSlugEn: string;
  titleEs: string;
  titleEn: string;
  descriptionEs: string;
  descriptionEn: string;
  metaTitleEs: string;
  metaTitleEn: string;
  metaDescriptionEs: string;
  metaDescriptionEn: string;
  blocksEs: BlogBlock[];
  blocksEn: BlogBlock[];
  jsonLdEs: Record<string, unknown> | Record<string, unknown>[] | null;
  jsonLdEn: Record<string, unknown> | Record<string, unknown>[] | null;
}): BlogCmsSeed {
  return {
    slug: form.slug.trim(),
    status: form.status,
    path_es: form.pathEs.trim(),
    path_en: form.pathEn.trim(),
    date: form.date,
    reading_minutes: form.readingMinutes,
    related_slug: form.relatedSlug.trim() || null,
    related_slug_en: form.relatedSlugEn.trim() || null,
    title_es: form.titleEs.trim(),
    title_en: form.titleEn.trim(),
    description_es: form.descriptionEs.trim(),
    description_en: form.descriptionEn.trim(),
    meta_title_es: form.metaTitleEs.trim() || null,
    meta_title_en: form.metaTitleEn.trim() || null,
    meta_description_es: form.metaDescriptionEs.trim() || null,
    meta_description_en: form.metaDescriptionEn.trim() || null,
    blocks_es: form.blocksEs,
    blocks_en: form.blocksEn,
    json_ld_es: form.jsonLdEs,
    json_ld_en: form.jsonLdEn,
  };
}

/** Deriva rutas públicas a partir del slug interno (solo posts nuevos). */
export function pathsFromSlug(slug: string): { pathEs: string; pathEn: string } {
  const clean = slug.trim().replace(/^\/+|\/+$/g, "");
  return {
    pathEs: `/blog/${clean}`,
    pathEn: `/en/blog/${clean}`,
  };
}
