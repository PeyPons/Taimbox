import { z } from "zod";

export const BLOCK_SCHEMA_VERSION = 1 as const;

const blockBase = z.object({
  id: z.string().min(1),
});

export const ParagraphBlockSchema = blockBase.extend({
  type: z.literal("paragraph"),
  html: z.string(),
});

export const HeadingBlockSchema = blockBase.extend({
  type: z.literal("heading"),
  level: z.union([z.literal(2), z.literal(3), z.literal(4)]),
  text: z.string().min(1),
  anchorId: z.string().regex(/^[a-z0-9-]+$/).optional(),
});

export const CalloutBlockSchema = blockBase.extend({
  type: z.literal("callout"),
  tone: z.enum(["info", "warning", "success", "highlight"]).default("info"),
  html: z.string(),
});

export const ListBlockSchema = blockBase.extend({
  type: z.literal("list"),
  ordered: z.boolean().default(false),
  items: z.array(z.string()).min(1),
});

export const TableBlockSchema = blockBase.extend({
  type: z.literal("table"),
  headers: z.array(z.string()).min(1),
  rows: z.array(z.array(z.string()).min(1)).min(1),
});

export const FaqBlockSchema = blockBase.extend({
  type: z.literal("faq"),
  items: z
    .array(
      z.object({
        q: z.string().min(1),
        a: z.string().min(1),
      }),
    )
    .min(1),
});

export const TocBlockSchema = blockBase.extend({
  type: z.literal("toc"),
});

export const RelatedPostBlockSchema = blockBase.extend({
  type: z.literal("relatedPost"),
  slug: z.string().min(1),
});

export const HtmlBlockSchema = blockBase.extend({
  type: z.literal("html"),
  html: z.string(),
});

export const CtaBlockSchema = blockBase.extend({
  type: z.literal("cta"),
  text: z.string().min(1),
  href: z.string().min(1),
  variant: z.enum(["primary", "secondary"]).default("primary"),
});

export const VisualRefBlockSchema = blockBase.extend({
  type: z.literal("visualRef"),
  visualId: z.string().min(1),
  props: z.record(z.string(), z.unknown()).optional(),
});

export const BlogBlockSchema = z.discriminatedUnion("type", [
  ParagraphBlockSchema,
  HeadingBlockSchema,
  CalloutBlockSchema,
  ListBlockSchema,
  TableBlockSchema,
  FaqBlockSchema,
  TocBlockSchema,
  RelatedPostBlockSchema,
  HtmlBlockSchema,
  CtaBlockSchema,
  VisualRefBlockSchema,
]);

export const BlogBlocksSchema = z.array(BlogBlockSchema);

export type BlogBlock = z.infer<typeof BlogBlockSchema>;
export type BlogBlockType = BlogBlock["type"];
export type ParagraphBlock = z.infer<typeof ParagraphBlockSchema>;
export type HeadingBlock = z.infer<typeof HeadingBlockSchema>;
export type CalloutBlock = z.infer<typeof CalloutBlockSchema>;
export type ListBlock = z.infer<typeof ListBlockSchema>;
export type TableBlock = z.infer<typeof TableBlockSchema>;
export type FaqBlock = z.infer<typeof FaqBlockSchema>;
export type TocBlock = z.infer<typeof TocBlockSchema>;
export type RelatedPostBlock = z.infer<typeof RelatedPostBlockSchema>;
export type HtmlBlock = z.infer<typeof HtmlBlockSchema>;
export type CtaBlock = z.infer<typeof CtaBlockSchema>;
export type VisualRefBlock = z.infer<typeof VisualRefBlockSchema>;

export const BLOCK_TYPES_ORDERED: BlogBlockType[] = [
  "heading",
  "paragraph",
  "list",
  "table",
  "callout",
  "faq",
  "toc",
  "html",
  "cta",
  "relatedPost",
  "visualRef",
];

export function safeParseBlocks(input: unknown): BlogBlock[] {
  const parsed = BlogBlocksSchema.safeParse(input);
  if (!parsed.success) {
    if (import.meta.env.DEV) {
      console.warn("[blog] blocks parse failed", parsed.error.flatten());
    }
    return [];
  }
  return parsed.data;
}
