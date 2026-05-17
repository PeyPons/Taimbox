import { useCallback } from "react";
import type { BlogBlock, BlogBlockType } from "@/lib/blog/blockSchema";
import { BLOCK_TYPES_ORDERED } from "@/lib/blog/blockSchema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";

interface BlogBlocksEditorProps {
  blocks: BlogBlock[];
  onChange: (blocks: BlogBlock[]) => void;
  visualIds: { id: string; mode: string }[];
  labels: {
    addBlock: string;
    block: string;
    remove: string;
    moveUp: string;
    moveDown: string;
    type: string;
    html: string;
    text: string;
    level: string;
    anchorId: string;
    tone: string;
    ordered: string;
    items: string;
    headers: string;
    rows: string;
    question: string;
    answer: string;
    slug: string;
    href: string;
    variant: string;
    visualId: string;
    addItem: string;
    tocHint: string;
  };
}

function newBlock(type: BlogBlockType): BlogBlock {
  const id = crypto.randomUUID();
  switch (type) {
    case "paragraph":
      return { id, type: "paragraph", html: "" };
    case "heading":
      return { id, type: "heading", level: 2, text: "" };
    case "callout":
      return { id, type: "callout", tone: "info", html: "" };
    case "list":
      return { id, type: "list", ordered: false, items: [""] };
    case "table":
      return { id, type: "table", headers: ["Col 1", "Col 2"], rows: [["", ""]] };
    case "faq":
      return { id, type: "faq", items: [{ q: "", a: "" }] };
    case "toc":
      return { id, type: "toc" };
    case "relatedPost":
      return { id, type: "relatedPost", slug: "" };
    case "html":
      return { id, type: "html", html: "" };
    case "cta":
      return { id, type: "cta", text: "", href: "/", variant: "primary" };
    case "visualRef":
      return { id, type: "visualRef", visualId: "" };
    default:
      return { id, type: "paragraph", html: "" };
  }
}

export function BlogBlocksEditor({ blocks, onChange, visualIds, labels }: BlogBlocksEditorProps) {
  const patch = useCallback(
    (index: number, next: BlogBlock) => {
      const copy = [...blocks];
      copy[index] = next;
      onChange(copy);
    },
    [blocks, onChange],
  );

  const remove = (index: number) => {
    onChange(blocks.filter((_, i) => i !== index));
  };

  const move = (index: number, dir: -1 | 1) => {
    const j = index + dir;
    if (j < 0 || j >= blocks.length) return;
    const copy = [...blocks];
    [copy[index], copy[j]] = [copy[j], copy[index]];
    onChange(copy);
  };

  const add = (type: BlogBlockType) => {
    onChange([...blocks, newBlock(type)]);
  };

  return (
    <div className="space-y-3">
      {blocks.map((b, index) => (
        <div
          key={b.id}
          className="rounded-lg border border-slate-200 bg-slate-50/80 p-3 space-y-3"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-medium text-slate-500">
              {labels.block} {index + 1} · <code className="text-slate-700">{b.type}</code>
            </span>
            <div className="flex gap-1">
              <Button type="button" variant="ghost" size="icon" className="h-7 w-7" disabled={index === 0} onClick={() => move(index, -1)} title={labels.moveUp}>
                <ChevronUp className="h-4 w-4" />
              </Button>
              <Button type="button" variant="ghost" size="icon" className="h-7 w-7" disabled={index === blocks.length - 1} onClick={() => move(index, 1)} title={labels.moveDown}>
                <ChevronDown className="h-4 w-4" />
              </Button>
              <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-red-600" onClick={() => remove(index)} title={labels.remove}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {(b.type === "paragraph" || b.type === "callout" || b.type === "html") && (
            <div className="grid gap-2">
              {b.type === "callout" && (
                <div className="grid gap-1">
                  <Label className="text-xs">{labels.tone}</Label>
                  <Select
                    value={b.tone}
                    onValueChange={(tone) =>
                      patch(index, { ...b, tone: tone as typeof b.tone })
                    }
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="info">info</SelectItem>
                      <SelectItem value="warning">warning</SelectItem>
                      <SelectItem value="success">success</SelectItem>
                      <SelectItem value="highlight">highlight</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              <Label className="text-xs">{labels.html}</Label>
              <Textarea
                rows={4}
                className="text-xs font-mono"
                value={b.html}
                onChange={(e) => patch(index, { ...b, html: e.target.value })}
              />
            </div>
          )}

          {b.type === "heading" && (
            <div className="grid gap-2 sm:grid-cols-3">
              <div className="grid gap-1 sm:col-span-2">
                <Label className="text-xs">{labels.text}</Label>
                <Input
                  className="h-8 text-xs"
                  value={b.text}
                  onChange={(e) => patch(index, { ...b, text: e.target.value })}
                />
              </div>
              <div className="grid gap-1">
                <Label className="text-xs">{labels.level}</Label>
                <Select
                  value={String(b.level)}
                  onValueChange={(v) =>
                    patch(index, { ...b, level: Number(v) as 2 | 3 | 4 })
                  }
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">H2</SelectItem>
                    <SelectItem value="3">H3</SelectItem>
                    <SelectItem value="4">H4</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1 sm:col-span-3">
                <Label className="text-xs">{labels.anchorId}</Label>
                <Input
                  className="h-8 text-xs font-mono"
                  value={b.anchorId ?? ""}
                  onChange={(e) =>
                    patch(index, {
                      ...b,
                      anchorId: e.target.value || undefined,
                    })
                  }
                  placeholder="mi-seccion"
                />
              </div>
            </div>
          )}

          {b.type === "list" && (
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={b.ordered}
                  onChange={(e) => patch(index, { ...b, ordered: e.target.checked })}
                />
                {labels.ordered}
              </label>
              {b.items.map((item, i) => (
                <Textarea
                  key={i}
                  rows={2}
                  className="text-xs"
                  value={item}
                  onChange={(e) => {
                    const items = [...b.items];
                    items[i] = e.target.value;
                    patch(index, { ...b, items });
                  }}
                />
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => patch(index, { ...b, items: [...b.items, ""] })}
              >
                {labels.addItem}
              </Button>
            </div>
          )}

          {b.type === "table" && (
            <div className="space-y-2">
              <Label className="text-xs">{labels.headers} (coma)</Label>
              <Input
                className="h-8 text-xs font-mono"
                value={b.headers.join(", ")}
                onChange={(e) =>
                  patch(index, {
                    ...b,
                    headers: e.target.value.split(",").map((s) => s.trim()),
                  })
                }
              />
              <Label className="text-xs">{labels.rows} (una fila por línea, celdas con |)</Label>
              <Textarea
                rows={4}
                className="text-xs font-mono"
                value={b.rows.map((r) => r.join(" | ")).join("\n")}
                onChange={(e) => {
                  const rows = e.target.value
                    .split("\n")
                    .filter((line) => line.trim())
                    .map((line) => line.split("|").map((c) => c.trim()));
                  patch(index, { ...b, rows });
                }}
              />
            </div>
          )}

          {b.type === "faq" && (
            <div className="space-y-3">
              {b.items.map((item, i) => (
                <div key={i} className="space-y-1 border-t border-slate-200 pt-2">
                  <Label className="text-xs">{labels.question}</Label>
                  <Input
                    className="h-8 text-xs"
                    value={item.q}
                    onChange={(e) => {
                      const items = b.items.map((it, j) =>
                        j === i ? { ...it, q: e.target.value } : it,
                      );
                      patch(index, { ...b, items });
                    }}
                  />
                  <Label className="text-xs">{labels.answer}</Label>
                  <Textarea
                    rows={2}
                    className="text-xs"
                    value={item.a}
                    onChange={(e) => {
                      const items = b.items.map((it, j) =>
                        j === i ? { ...it, a: e.target.value } : it,
                      );
                      patch(index, { ...b, items });
                    }}
                  />
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() =>
                  patch(index, { ...b, items: [...b.items, { q: "", a: "" }] })
                }
              >
                {labels.addItem}
              </Button>
            </div>
          )}

          {b.type === "toc" && (
            <p className="text-xs text-slate-500">{labels.tocHint}</p>
          )}

          {b.type === "relatedPost" && (
            <div className="grid gap-1">
              <Label className="text-xs">{labels.slug}</Label>
              <Input
                className="h-8 text-xs font-mono"
                value={b.slug}
                onChange={(e) => patch(index, { ...b, slug: e.target.value })}
              />
            </div>
          )}

          {b.type === "cta" && (
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="grid gap-1">
                <Label className="text-xs">{labels.text}</Label>
                <Input
                  className="h-8 text-xs"
                  value={b.text}
                  onChange={(e) => patch(index, { ...b, text: e.target.value })}
                />
              </div>
              <div className="grid gap-1">
                <Label className="text-xs">{labels.href}</Label>
                <Input
                  className="h-8 text-xs font-mono"
                  value={b.href}
                  onChange={(e) => patch(index, { ...b, href: e.target.value })}
                />
              </div>
              <div className="grid gap-1 sm:col-span-2">
                <Label className="text-xs">{labels.variant}</Label>
                <Select
                  value={b.variant}
                  onValueChange={(v) =>
                    patch(index, { ...b, variant: v as "primary" | "secondary" })
                  }
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="primary">primary</SelectItem>
                    <SelectItem value="secondary">secondary</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {b.type === "visualRef" && (
            <div className="grid gap-1">
              <Label className="text-xs">{labels.visualId}</Label>
              <Select
                value={b.visualId || undefined}
                onValueChange={(visualId) => patch(index, { ...b, visualId })}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="—" />
                </SelectTrigger>
                <SelectContent>
                  {visualIds
                    .filter((v) => v.mode === "inline")
                    .map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.id}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      ))}

      <Select onValueChange={(v) => add(v as BlogBlockType)}>
        <SelectTrigger className="h-9 w-full max-w-xs text-xs">
          <Plus className="h-3.5 w-3.5 mr-1" />
          <SelectValue placeholder={labels.addBlock} />
        </SelectTrigger>
        <SelectContent>
          {BLOCK_TYPES_ORDERED.map((type) => (
            <SelectItem key={type} value={type}>
              {type}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

