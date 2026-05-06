import type { BlogBlock } from "./blockSchema";

export type BlogPostStatus = "draft" | "published";

export type BlogPostLocale = "es" | "en";

/** Fila tal cual la devuelve Supabase (snake_case). */
export interface BlogPostRow {
  id: string;
  slug: string;
  status: BlogPostStatus;
  path_es: string;
  path_en: string;
  title_es: string;
  title_en: string;
  description_es: string;
  description_en: string;
  meta_title_es: string | null;
  meta_title_en: string | null;
  meta_description_es: string | null;
  meta_description_en: string | null;
  date: string;
  reading_minutes: number;
  related_slug: string | null;
  schema_version: number;
  blocks_es: unknown;
  blocks_en: unknown;
  json_ld_es: Record<string, unknown> | Record<string, unknown>[] | null;
  json_ld_en: Record<string, unknown> | Record<string, unknown>[] | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

/** Forma camelCase usada por la app. blocks_* ya validados con Zod. */
export interface BlogPostRecord {
  id: string;
  slug: string;
  status: BlogPostStatus;
  pathEs: string;
  pathEn: string;
  titleEs: string;
  titleEn: string;
  descriptionEs: string;
  descriptionEn: string;
  metaTitleEs: string | null;
  metaTitleEn: string | null;
  metaDescriptionEs: string | null;
  metaDescriptionEn: string | null;
  date: string;
  readingMinutes: number;
  relatedSlug: string | null;
  schemaVersion: number;
  blocksEs: BlogBlock[];
  blocksEn: BlogBlock[];
  jsonLdEs: Record<string, unknown> | Record<string, unknown>[] | null;
  jsonLdEn: Record<string, unknown> | Record<string, unknown>[] | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Subconjunto de campos usados en listados (admin y publico). */
export interface BlogPostSummary {
  id: string;
  slug: string;
  status: BlogPostStatus;
  pathEs: string;
  pathEn: string;
  titleEs: string;
  titleEn: string;
  descriptionEs: string;
  descriptionEn: string;
  date: string;
  readingMinutes: number;
  relatedSlug: string | null;
  publishedAt: string | null;
  updatedAt: string;
}

/** Helper para extraer campos por idioma activo. */
export interface BlogPostLocaleFields {
  title: string;
  description: string;
  metaTitle: string;
  metaDescription: string;
  path: string;
  pathEs: string;
  pathEn: string;
  blocks: BlogBlock[];
  jsonLd: Record<string, unknown> | Record<string, unknown>[] | null;
}

export function getLocaleFields(post: BlogPostRecord, lng: string): BlogPostLocaleFields {
  const en = lng.startsWith("en");
  const title = en ? post.titleEn : post.titleEs;
  const description = en ? post.descriptionEn : post.descriptionEs;
  return {
    title,
    description,
    metaTitle: (en ? post.metaTitleEn : post.metaTitleEs) ?? title,
    metaDescription: (en ? post.metaDescriptionEn : post.metaDescriptionEs) ?? description,
    path: en ? post.pathEn : post.pathEs,
    pathEs: post.pathEs,
    pathEn: post.pathEn,
    blocks: en ? post.blocksEn : post.blocksEs,
    jsonLd: en ? post.jsonLdEn : post.jsonLdEs,
  };
}

export function getLocaleSummaryFields(post: BlogPostSummary, lng: string) {
  const en = lng.startsWith("en");
  return {
    title: en ? post.titleEn : post.titleEs,
    description: en ? post.descriptionEn : post.descriptionEs,
    path: en ? post.pathEn : post.pathEs,
  };
}
