import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppTranslation } from "@/hooks/useAppTranslation";
import { useTranslation } from "react-i18next";
import { useAllPostSummaries, useDeletePost } from "@/hooks/useBlogPosts";
import type { BlogPostSummary } from "@/lib/blog/types";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Pencil, Trash2, ExternalLink, Search } from "lucide-react";
import { toast } from "@/lib/notify";

function formatDate(dateStr: string, locale: string): string {
  try {
    return new Date(dateStr).toLocaleDateString(locale.startsWith("en") ? "en-GB" : "es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export default function AdminBlogPage() {
  const { t } = useAppTranslation();
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [postToDelete, setPostToDelete] = useState<BlogPostSummary | null>(null);

  const { data: posts, isLoading, isError } = useAllPostSummaries();
  const deleteMutation = useDeletePost();

  const filtered = useMemo(() => {
    const all = posts ?? [];
    const needle = query.trim().toLowerCase();
    if (needle.length === 0) return all;
    return all.filter(
      (p) =>
        p.slug.toLowerCase().includes(needle)
        || p.titleEs.toLowerCase().includes(needle)
        || p.titleEn.toLowerCase().includes(needle),
    );
  }, [posts, query]);

  const handleDelete = async () => {
    if (!postToDelete) return;
    try {
      await deleteMutation.mutateAsync(postToDelete.id);
      toast.success(t("admin.blog.deleted"));
      setPostToDelete(null);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : t("admin.blog.errDelete");
      toast.error(msg);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {t("admin.blog.listTitle")}
          </h1>
          <p className="text-slate-600 mt-1">
            {t("admin.blog.listDescription")}
          </p>
        </div>
        <Button onClick={() => navigate("/admin/blog/new")} className="gap-1">
          <Plus className="h-4 w-4" />
          {t("admin.blog.newPost")}
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="relative max-w-md">
            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("admin.blog.searchPlaceholder")}
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
          ) : isError ? (
            <p className="text-red-600 text-center py-8">
              {t("admin.blog.errLoad")}
            </p>
          ) : filtered.length === 0 ? (
            <p className="text-slate-500 text-center py-8">
              {t("admin.blog.empty")}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("admin.blog.cols.title")}</TableHead>
                  <TableHead>{t("admin.blog.cols.slug")}</TableHead>
                  <TableHead>{t("admin.blog.cols.status")}</TableHead>
                  <TableHead>{t("admin.blog.cols.date")}</TableHead>
                  <TableHead className="text-right">
                    {t("common.actions")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((post) => (
                  <TableRow key={post.id}>
                    <TableCell className="font-medium max-w-md">
                      <div className="truncate">{post.titleEs}</div>
                      <div className="text-xs text-slate-500 truncate">{post.titleEn}</div>
                    </TableCell>
                    <TableCell className="text-slate-600 font-mono text-xs">
                      {post.slug}
                    </TableCell>
                    <TableCell>
                      {post.status === "published" ? (
                        <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-0">
                          {t("admin.blog.statusPublished")}
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          {t("admin.blog.statusDraft")}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-slate-500">{formatDate(post.date, i18n.language)}</TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex gap-1">
                        {post.status === "published" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            asChild
                            title={t("admin.blog.viewLive")}
                          >
                            <Link to={post.pathEs} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4" />
                            </Link>
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => navigate(`/admin/blog/edit/${post.id}`)}
                          title={t("common.edit")}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => setPostToDelete(post)}
                          title={t("common.delete")}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={postToDelete != null} onOpenChange={(o) => !o && setPostToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("admin.blog.deleteConfirmTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("admin.blog.deleteConfirmBody")}
              {postToDelete != null && (
                <span className="block mt-2 font-mono text-xs text-slate-700">
                  {postToDelete.slug}
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                t("common.delete")
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
