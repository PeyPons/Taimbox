import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";

const defaultClass = "text-slate-700 text-sm whitespace-pre-wrap";

const components: React.ComponentProps<typeof ReactMarkdown>["components"] = {
  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold text-slate-800">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  code: ({ children }) => (
    <code className="rounded bg-slate-200 px-1 py-0.5 font-mono text-xs">{children}</code>
  ),
  ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-0.5">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-0.5">{children}</ol>,
  li: ({ children }) => <li className="text-slate-700">{children}</li>,
  br: () => <br />,
};

interface SupportMessageContentProps {
  content: string;
  className?: string;
}

/**
 * Renderiza el contenido de un mensaje de ticket de soporte con formato Markdown.
 * Soporta **negrita**, *cursiva*, `código`, listas y saltos de línea.
 * Los mensajes se almacenan como texto; el formato se interpreta al mostrar.
 */
export function SupportMessageContent({ content, className }: SupportMessageContentProps) {
  const text = content?.trim() || "";
  if (!text) return null;

  return (
    <div className={className ?? defaultClass}>
      <ReactMarkdown remarkPlugins={[remarkBreaks]} components={components}>
        {text}
      </ReactMarkdown>
    </div>
  );
}
