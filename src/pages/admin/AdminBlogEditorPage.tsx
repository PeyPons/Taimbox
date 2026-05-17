import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAppTranslation } from "@/hooks/useAppTranslation";
import { useCreatePost, useUpdatePost, blogQueryKeys } from "@/hooks/useBlogPosts";
import { getPostById } from "@/lib/blog/client";
import { BlogBlocksSchema } from "@/lib/blog/blockSchema";
import type { BlogBlock } from "@/lib/blog/blockSchema";
import type { BlogPostRecord, BlogPostStatus } from "@/lib/blog/types";
import { listVisualIds } from "@/lib/blog/visualRegistry";
import { BlockRenderer } from "@/components/landing/blog/BlockRenderer";
import { BlogBlocksEditor } from "@/components/admin/BlogBlocksEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Save, ArrowLeft, Eye, AlertCircle } from "lucide-react";
import { toast } from "@/lib/notify";

interface FormState {
  slug: string;
  status: BlogPostStatus;
  pathEs: string;
  pathEn: string;
  date: string;
  readingMinutes: number;
  relatedSlug: string;
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

function defaultBlocksJson(): string {
  return JSON.stringify(
    [
      {
        id: crypto.randomUUID(),
        type: "paragraph",
        html: "Escribe aquí el primer párrafo del artículo.",
      },
    ],
    null,
    2,
  );
}

function recordToFormState(record: BlogPostRecord | null): FormState {
  if (!record) {
    return {
      slug: "",
      status: "draft",
      pathEs: "/blog/",
      pathEn: "/en/blog/",
      date: new Date().toISOString().slice(0, 10),
      readingMinutes: 5,
      relatedSlug: "",
      titleEs: "",
      titleEn: "",
      descriptionEs: "",
      descriptionEn: "",
      metaTitleEs: "",
      metaTitleEn: "",
      metaDescriptionEs: "",
      metaDescriptionEn: "",
      blocksEsRaw: defaultBlocksJson(),
      blocksEnRaw: defaultBlocksJson(),
      jsonLdEsRaw: "",
      jsonLdEnRaw: "",
    };
  }
  return {
    slug: record.slug,
    status: record.status,
    pathEs: record.pathEs,
    pathEn: record.pathEn,
    date: record.date,
    readingMinutes: record.readingMinutes,
    relatedSlug: record.relatedSlug ?? "",
    titleEs: record.titleEs,
    titleEn: record.titleEn,
    descriptionEs: record.descriptionEs,
    descriptionEn: record.descriptionEn,
    metaTitleEs: record.metaTitleEs ?? "",
    metaTitleEn: record.metaTitleEn ?? "",
    metaDescriptionEs: record.metaDescriptionEs ?? "",
    metaDescriptionEn: record.metaDescriptionEn ?? "",
    blocksEsRaw: JSON.stringify(record.blocksEs, null, 2),
    blocksEnRaw: JSON.stringify(record.blocksEn, null, 2),
    jsonLdEsRaw: record.jsonLdEs ? JSON.stringify(record.jsonLdEs, null, 2) : "",
    jsonLdEnRaw: record.jsonLdEn ? JSON.stringify(record.jsonLdEn, null, 2) : "",
  };
}

function tryParseJson<T>(raw: string): { ok: true; value: T } | { ok: false; error: string } {
  const trimmed = raw.trim();
  if (trimmed.length === 0) return { ok: true, value: undefined as T };
  try {
    return { ok: true, value: JSON.parse(trimmed) as T };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "JSON invalido" };
  }
}

function safeParseBlocksRaw(raw: string): BlogBlock[] | string {
  const parsed = tryParseJson<unknown>(raw);
  if (!parsed.ok) return parsed.error;
  if (parsed.value === undefined) return [];
  const validated = BlogBlocksSchema.safeParse(parsed.value);
  if (!validated.success) {
    return validated.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
  }
  return validated.data;
}

export default function AdminBlogEditorPage() {
  const { t } = useAppTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isNew = id == null;

  // Cargar el post existente por id (no por slug, porque el slug puede cambiar).
  const { data: existing, isLoading } = useQuery({
    queryKey: id != null ? ["blog", "by-id", id] : ["blog", "by-id", "__noop"],
    queryFn: async () => {
      if (id == null) return null;
      return getPostById(id);
    },
    enabled: id != null,
  });

  const [form, setForm] = useState<FormState>(() => recordToFormState(null));
  const [activeLang, setActiveLang] = useState<"es" | "en">("es");
  const [previewLang, setPreviewLang] = useState<"es" | "en">("es");

  useEffect(() => {
    if (!isNew && existing) setForm(recordToFormState(existing));
  }, [isNew, existing]);

  const blocksEsResult = useMemo(() => safeParseBlocksRaw(form.blocksEsRaw), [form.blocksEsRaw]);
  const blocksEnResult = useMemo(() => safeParseBlocksRaw(form.blocksEnRaw), [form.blocksEnRaw]);
  const blocksEsError = typeof blocksEsResult === "string" ? blocksEsResult : null;
  const blocksEnError = typeof blocksEnResult === "string" ? blocksEnResult : null;
  const previewBlocks: BlogBlock[] = previewLang === "es"
    ? (blocksEsError ? [] : (blocksEsResult as BlogBlock[]))
    : (blocksEnError ? [] : (blocksEnResult as BlogBlock[]));

  const visualIds = useMemo(() => listVisualIds(), []);

  const createMutation = useCreatePost();
  const updateMutation = useUpdatePost();
  const isSaving = createMutation.isPending || updateMutation.isPending;

  const validateForm = (): string | null => {
    if (!form.slug.trim()) return t("admin.blog.errSlugRequired", "El slug es obligatorio.");
    if (!/^[a-z0-9-]+$/.test(form.slug)) {
      return t("admin.blog.errSlugFormat", "El slug solo puede contener minusculas, numeros y guiones.");
    }
    if (!form.pathEs.startsWith("/blog/")) return t("admin.blog.errPathEs", "La ruta ES debe empezar por /blog/.");
    if (!form.pathEn.startsWith("/en/blog/")) return t("admin.blog.errPathEn", "La ruta EN debe empezar por /en/blog/.");
    if (!form.titleEs.trim() || !form.titleEn.trim()) {
      return t("admin.blog.errTitles", "Los títulos en ambos idiomas son obligatorios.");
    }
    if (!form.descriptionEs.trim() || !form.descriptionEn.trim()) {
      return t("admin.blog.errDescriptions", "Las descripciones en ambos idiomas son obligatorias.");
    }
    if (blocksEsError) return t("admin.blog.errBlocksEs", "Error en bloques ES: ") + blocksEsError;
    if (blocksEnError) return t("admin.blog.errBlocksEn", "Error en bloques EN: ") + blocksEnError;
    const jsonLdEs = tryParseJson(form.jsonLdEsRaw);
    if (!jsonLdEs.ok) return t("admin.blog.errJsonLdEs", "Error en JSON-LD ES: ") + jsonLdEs.error;
    const jsonLdEn = tryParseJson(form.jsonLdEnRaw);
    if (!jsonLdEn.ok) return t("admin.blog.errJsonLdEn", "Error en JSON-LD EN: ") + jsonLdEn.error;
    return null;
  };

  const handleSave = async () => {
    const err = validateForm();
    if (err) {
      toast.error(err);
      return;
    }
    const jsonLdEs = tryParseJson<Record<string, unknown> | Record<string, unknown>[]>(form.jsonLdEsRaw);
    const jsonLdEn = tryParseJson<Record<string, unknown> | Record<string, unknown>[]>(form.jsonLdEnRaw);
    const input = {
      slug: form.slug.trim(),
      status: form.status,
      pathEs: form.pathEs.trim(),
      pathEn: form.pathEn.trim(),
      titleEs: form.titleEs.trim(),
      titleEn: form.titleEn.trim(),
      descriptionEs: form.descriptionEs.trim(),
      descriptionEn: form.descriptionEn.trim(),
      metaTitleEs: form.metaTitleEs.trim() || null,
      metaTitleEn: form.metaTitleEn.trim() || null,
      metaDescriptionEs: form.metaDescriptionEs.trim() || null,
      metaDescriptionEn: form.metaDescriptionEn.trim() || null,
      date: form.date,
      readingMinutes: Math.min(239, Math.max(1, form.readingMinutes || 1)),
      relatedSlug: form.relatedSlug.trim() || null,
      blocksEs: blocksEsResult as BlogBlock[],
      blocksEn: blocksEnResult as BlogBlock[],
      jsonLdEs: jsonLdEs.ok ? (jsonLdEs.value ?? null) : null,
      jsonLdEn: jsonLdEn.ok ? (jsonLdEn.value ?? null) : null,
    };
    try {
      if (isNew) {
        const created = await createMutation.mutateAsync(input);
        toast.success(t("admin.blog.created", "Post creado"));
        navigate(`/admin/blog/edit/${created.id}`, { replace: true });
      } else if (existing) {
        await updateMutation.mutateAsync({ id: existing.id, input });
        toast.success(t("admin.blog.saved", "Cambios guardados"));
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : t("admin.blog.errSave", "Error al guardar");
      toast.error(msg);
    }
  };

  if (!isNew && isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/admin/blog")}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            {t("admin.blog.backToList", "Lista")}
          </Button>
          <h1 className="text-2xl font-bold text-slate-900">
            {isNew
              ? t("admin.blog.editorTitleNew", "Nuevo post")
              : t("admin.blog.editorTitleEdit", "Editar post")}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <Save className="h-4 w-4 mr-1" />
            )}
            {t("common.save", "Guardar")}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Editor */}
        <div className="space-y-6">
          {/* Metadatos comunes */}
          <Card>
            <CardHeader>
              <CardTitle>{t("admin.blog.sectionGeneral", "Identidad y rutas")}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="bp-slug">{t("admin.blog.slug", "Slug interno")}</Label>
                <Input
                  id="bp-slug"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  placeholder="mi-articulo-2026"
                />
                <p className="text-xs text-slate-500">
                  {t(
                    "admin.blog.slugHelp",
                    "Identificador estable interno. No es la URL; otros posts lo referencian en relatedSlug.",
                  )}
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="bp-pathEs">{t("admin.blog.pathEs", "Ruta ES")}</Label>
                  <Input
                    id="bp-pathEs"
                    value={form.pathEs}
                    onChange={(e) => setForm({ ...form, pathEs: e.target.value })}
                    placeholder="/blog/mi-articulo"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="bp-pathEn">{t("admin.blog.pathEn", "Ruta EN")}</Label>
                  <Input
                    id="bp-pathEn"
                    value={form.pathEn}
                    onChange={(e) => setForm({ ...form, pathEn: e.target.value })}
                    placeholder="/en/blog/my-article"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="bp-status">{t("admin.blog.status", "Estado")}</Label>
                  <Select
                    value={form.status}
                    onValueChange={(v) => setForm({ ...form, status: v as BlogPostStatus })}
                  >
                    <SelectTrigger id="bp-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">
                        {t("admin.blog.statusDraft", "Borrador")}
                      </SelectItem>
                      <SelectItem value="published">
                        {t("admin.blog.statusPublished", "Publicado")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="bp-date">{t("admin.blog.date", "Fecha")}</Label>
                  <Input
                    id="bp-date"
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="bp-mins">
                    {t("admin.blog.readingMinutes", "Min. lectura")}
                  </Label>
                  <Input
                    id="bp-mins"
                    type="number"
                    min={1}
                    max={239}
                    value={form.readingMinutes}
                    onChange={(e) =>
                      setForm({ ...form, readingMinutes: Number(e.target.value) || 0 })
                    }
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="bp-relatedSlug">
                  {t("admin.blog.relatedSlug", "Slug relacionado (opcional)")}
                </Label>
                <Input
                  id="bp-relatedSlug"
                  value={form.relatedSlug}
                  onChange={(e) => setForm({ ...form, relatedSlug: e.target.value })}
                  placeholder="que-es-timeboxing"
                />
              </div>
            </CardContent>
          </Card>

          {/* Tabs ES / EN para textos */}
          <Card>
            <CardHeader>
              <CardTitle>{t("admin.blog.sectionLocale", "Traducciones y SEO")}</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={activeLang} onValueChange={(v) => setActiveLang(v as "es" | "en")}>
                <TabsList>
                  <TabsTrigger value="es">Español</TabsTrigger>
                  <TabsTrigger value="en">English</TabsTrigger>
                </TabsList>
                {(["es", "en"] as const).map((lng) => (
                  <TabsContent key={lng} value={lng} className="space-y-4 pt-4">
                    <div className="grid gap-2">
                      <Label>
                        {t("admin.blog.title", "Título")} ({lng.toUpperCase()})
                      </Label>
                      <Input
                        value={lng === "es" ? form.titleEs : form.titleEn}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            ...(lng === "es"
                              ? { titleEs: e.target.value }
                              : { titleEn: e.target.value }),
                          })
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>
                        {t("admin.blog.description", "Descripción")} ({lng.toUpperCase()})
                      </Label>
                      <Textarea
                        rows={3}
                        value={lng === "es" ? form.descriptionEs : form.descriptionEn}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            ...(lng === "es"
                              ? { descriptionEs: e.target.value }
                              : { descriptionEn: e.target.value }),
                          })
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>
                        {t("admin.blog.metaTitle", "Meta title (SEO)")} ({lng.toUpperCase()})
                      </Label>
                      <Input
                        value={lng === "es" ? form.metaTitleEs : form.metaTitleEn}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            ...(lng === "es"
                              ? { metaTitleEs: e.target.value }
                              : { metaTitleEn: e.target.value }),
                          })
                        }
                        placeholder={t(
                          "admin.blog.metaTitleHint",
                          "Si está vacío usa el título normal.",
                        )}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>
                        {t("admin.blog.metaDescription", "Meta description (SEO)")} (
                        {lng.toUpperCase()})
                      </Label>
                      <Textarea
                        rows={2}
                        value={lng === "es" ? form.metaDescriptionEs : form.metaDescriptionEn}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            ...(lng === "es"
                              ? { metaDescriptionEs: e.target.value }
                              : { metaDescriptionEn: e.target.value }),
                          })
                        }
                        placeholder={t(
                          "admin.blog.metaDescriptionHint",
                          "Si está vacío usa la descripción normal.",
                        )}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>
                        {t("admin.blog.blocks", "Contenido del artículo")} ({lng.toUpperCase()})
                      </Label>
                      {!(lng === "es" ? blocksEsError : blocksEnError) &&
                      Array.isArray(lng === "es" ? blocksEsResult : blocksEnResult) ? (
                        <BlogBlocksEditor
                          blocks={(lng === "es" ? blocksEsResult : blocksEnResult) as BlogBlock[]}
                          visualIds={visualIds}
                          onChange={(next) =>
                            setForm({
                              ...form,
                              ...(lng === "es"
                                ? { blocksEsRaw: JSON.stringify(next, null, 2) }
                                : { blocksEnRaw: JSON.stringify(next, null, 2) }),
                            })
                          }
                          labels={{
                            addBlock: t("admin.blog.addBlock", "Añadir bloque…"),
                            block: t("admin.blog.block", "Bloque"),
                            remove: t("common.delete", "Eliminar"),
                            moveUp: t("admin.blog.moveUp", "Subir"),
                            moveDown: t("admin.blog.moveDown", "Bajar"),
                            type: t("admin.blog.blockType", "Tipo"),
                            html: t("admin.blog.html", "HTML"),
                            text: t("admin.blog.text", "Texto"),
                            level: t("admin.blog.level", "Nivel"),
                            anchorId: t("admin.blog.anchorId", "anchorId (TOC)"),
                            tone: t("admin.blog.tone", "Tono"),
                            ordered: t("admin.blog.orderedList", "Lista numerada"),
                            items: t("admin.blog.items", "Ítems"),
                            headers: t("admin.blog.tableHeaders", "Cabeceras"),
                            rows: t("admin.blog.tableRows", "Filas"),
                            question: t("admin.blog.faqQ", "Pregunta"),
                            answer: t("admin.blog.faqA", "Respuesta"),
                            slug: t("admin.blog.relatedSlugField", "Slug relacionado"),
                            href: t("admin.blog.href", "Enlace"),
                            variant: t("admin.blog.variant", "Variante"),
                            visualId: t("admin.blog.visualId", "Infografía"),
                            addItem: t("admin.blog.addItem", "Añadir ítem"),
                            tocHint: t(
                              "admin.blog.tocHint",
                              "El índice se genera automáticamente desde los títulos con anchorId.",
                            ),
                          }}
                        />
                      ) : (
                        <Textarea
                          rows={16}
                          className="font-mono text-xs"
                          value={lng === "es" ? form.blocksEsRaw : form.blocksEnRaw}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              ...(lng === "es"
                                ? { blocksEsRaw: e.target.value }
                                : { blocksEnRaw: e.target.value }),
                            })
                          }
                        />
                      )}
                      {(lng === "es" ? blocksEsError : blocksEnError) != null && (
                        <p className="text-xs text-red-600 inline-flex items-start gap-1">
                          <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                          {lng === "es" ? blocksEsError : blocksEnError}
                        </p>
                      )}
                      <details className="text-xs text-slate-500">
                        <summary className="cursor-pointer">
                          {t("admin.blog.blocksJsonAdvanced", "Edición JSON avanzada")}
                        </summary>
                        <Textarea
                          rows={10}
                          className="font-mono text-[10px] mt-2"
                          value={lng === "es" ? form.blocksEsRaw : form.blocksEnRaw}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              ...(lng === "es"
                                ? { blocksEsRaw: e.target.value }
                                : { blocksEnRaw: e.target.value }),
                            })
                          }
                        />
                      </details>
                    </div>
                    <div className="grid gap-2">
                      <Label>
                        {t("admin.blog.jsonLd", "JSON-LD (opcional)")} ({lng.toUpperCase()})
                      </Label>
                      <Textarea
                        rows={6}
                        className="font-mono text-xs"
                        placeholder={t(
                          "admin.blog.jsonLdHint",
                          "Vacío = se genera Article básico automáticamente.",
                        )}
                        value={lng === "es" ? form.jsonLdEsRaw : form.jsonLdEnRaw}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            ...(lng === "es"
                              ? { jsonLdEsRaw: e.target.value }
                              : { jsonLdEnRaw: e.target.value }),
                          })
                        }
                      />
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">
                {t("admin.blog.visualRefIds", "visualIds disponibles")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-xs text-slate-700 grid grid-cols-1 sm:grid-cols-2 gap-1">
                {visualIds.map((v) => (
                  <li key={v.id} className="font-mono">
                    {v.id}{" "}
                    <span className="text-slate-400">({v.mode})</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Preview */}
        <div className="space-y-3 xl:sticky xl:top-6 xl:self-start">
          <div className="flex items-center justify-between">
            <Label className="inline-flex items-center gap-2">
              <Eye className="h-4 w-4" />
              {t("admin.blog.preview", "Previsualización")}
            </Label>
            <Tabs value={previewLang} onValueChange={(v) => setPreviewLang(v as "es" | "en")}>
              <TabsList className="h-7">
                <TabsTrigger value="es" className="h-6 text-xs">
                  ES
                </TabsTrigger>
                <TabsTrigger value="en" className="h-6 text-xs">
                  EN
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <div className="rounded-2xl border border-slate-300 bg-gradient-to-br from-indigo-950 via-purple-950 to-indigo-900 p-4 sm:p-6 max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-white mb-2">
              {previewLang === "es" ? form.titleEs : form.titleEn}
            </h2>
            <p className="text-indigo-100/80 text-sm mb-6">
              {previewLang === "es" ? form.descriptionEs : form.descriptionEn}
            </p>
            <BlockRenderer blocks={previewBlocks} />
          </div>
          <p className="text-xs text-slate-500">
            {t(
              "admin.blog.previewHint",
              "La previsualización usa el mismo BlockRenderer que la web pública. Los visualRef de tipo fullPage no se pre-renderizan aquí.",
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
