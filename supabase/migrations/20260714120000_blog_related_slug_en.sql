-- Slug relacionado por idioma: related_slug (ES) y related_slug_en (EN, opcional).

ALTER TABLE public.blog_posts
  ADD COLUMN IF NOT EXISTS related_slug_en text;

COMMENT ON COLUMN public.blog_posts.related_slug_en IS
  'Slug interno del artículo relacionado en la versión EN. Si es NULL, se usa related_slug.';
