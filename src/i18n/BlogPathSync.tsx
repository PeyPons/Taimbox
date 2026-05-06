import { useEffect } from "react";
import { usePublishedPathPairs } from "@/hooks/useBlogPosts";
import { setBlogPathCache } from "./publicPaths";

/**
 * Mantiene el cache runtime de paths ES↔EN del blog sincronizado con Supabase.
 * Sin esto, hreflang/canonical de posts publicados desde admin (sin desplegar)
 * caerian al mapeo `/en${path}` por defecto, rompiendo SEO.
 *
 * Debe montarse dentro de QueryClientProvider y BrowserRouter.
 */
export function BlogPathSync() {
  const { data } = usePublishedPathPairs();
  useEffect(() => {
    if (data) setBlogPathCache(data);
  }, [data]);
  return null;
}
