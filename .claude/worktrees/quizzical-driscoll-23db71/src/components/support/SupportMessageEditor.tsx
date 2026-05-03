import { useCallback, useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "@tiptap/markdown";
import Placeholder from "@tiptap/extension-placeholder";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Bold, Italic, Code } from "lucide-react";
import type { Editor } from "@tiptap/core";

/** Editor con barra de formato (negrita, cursiva, código). El valor se guarda como Markdown. */
interface SupportMessageEditorProps {
  value: string;
  onChange: (markdown: string) => void;
  placeholder?: string;
  minHeight?: string;
  className?: string;
  id?: string;
}

function Toolbar({ editor }: { editor: Editor | null }) {
  if (!editor) return null;
  return (
    <div className="flex items-center gap-0.5 border-b border-slate-200 bg-slate-50/80 px-2 py-1 rounded-t-md">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0 text-slate-600 hover:text-slate-900 data-[state=on]:bg-slate-200"
        onClick={() => editor.chain().focus().toggleBold().run()}
        data-state={editor.isActive("bold") ? "on" : "off"}
      >
        <Bold className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0 text-slate-600 hover:text-slate-900 data-[state=on]:bg-slate-200"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        data-state={editor.isActive("italic") ? "on" : "off"}
      >
        <Italic className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0 text-slate-600 hover:text-slate-900 data-[state=on]:bg-slate-200"
        onClick={() => editor.chain().focus().toggleCode().run()}
        data-state={editor.isActive("code") ? "on" : "off"}
      >
        <Code className="h-4 w-4" />
      </Button>
    </div>
  );
}

export function SupportMessageEditor({
  value,
  onChange,
  placeholder = "Escribe aquí…",
  minHeight = "120px",
  className,
  id,
}: SupportMessageEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Markdown,
      Placeholder.configure({ placeholder }),
    ],
    content: value || "",
    contentType: "markdown",
    editorProps: {
      attributes: {
        class:
          "min-h-[80px] px-3 py-2 text-sm text-slate-700 focus:outline-none [&_strong]:font-semibold [&_em]:italic [&_code]:rounded [&_code]:bg-slate-200 [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-xs",
      },
    },
    onUpdate: ({ editor: ed }) => {
      const md = "getMarkdown" in ed && typeof (ed as { getMarkdown: () => string }).getMarkdown === "function"
        ? (ed as { getMarkdown: () => string }).getMarkdown()
        : "";
      onChange(md);
    },
    immediatelyRender: false,
  });

  const setContentFromValue = useCallback(() => {
    if (!editor) return;
    const getMd = "getMarkdown" in editor && typeof (editor as { getMarkdown: () => string }).getMarkdown === "function"
      ? (editor as { getMarkdown: () => string }).getMarkdown()
      : "";
    const current = getMd ?? "";
    if (value !== current) {
      editor.commands.setContent(value || "", { contentType: "markdown", emitUpdate: false });
    }
  }, [editor, value]);

  useEffect(() => {
    if (!editor) return;
    setContentFromValue();
  }, [editor, setContentFromValue]);

  return (
    <div
      id={id}
      className={cn(
        "rounded-md border border-input bg-background text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 overflow-hidden",
        className,
      )}
    >
      <Toolbar editor={editor} />
      <div style={{ minHeight }} className="[&_.ProseMirror]:min-h-[80px] [&_.ProseMirror]:px-3 [&_.ProseMirror]:py-2">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
