import { sanitizeInlineHtml } from "@/lib/blog/sanitize";
import type { TableBlock as TableBlockType } from "@/lib/blog/blockSchema";

function CellContent({ html, className }: { html: string; className?: string }) {
  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: sanitizeInlineHtml(html) }}
    />
  );
}

export function TableBlock({ block }: { block: TableBlockType }) {
  return (
    <>
      {/* Móvil: tarjetas apiladas (sin scroll horizontal) */}
      <div className="md:hidden flex flex-col gap-4">
        {block.rows.map((row, rIdx) => (
          <article
            key={rIdx}
            className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3"
          >
            {row.map((cell, cIdx) => (
              <div key={cIdx} className={cIdx > 0 ? "pt-3 border-t border-white/10" : undefined}>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-sky-200/90 mb-1.5 leading-snug">
                  {block.headers[cIdx]}
                </p>
                <CellContent
                  html={cell}
                  className={`text-sm leading-relaxed text-indigo-100/90 ${cIdx === 0 ? "font-medium text-white" : ""}`}
                />
              </div>
            ))}
          </article>
        ))}
      </div>

      {/* Desktop / tablet ancha: tabla */}
      <div className="hidden md:block overflow-x-auto rounded-2xl border border-white/10 bg-white/5">
        <table className="w-full text-left text-sm lg:text-base">
          <thead>
            <tr className="border-b border-white/10 bg-white/5">
              {block.headers.map((h, i) => (
                <th
                  key={i}
                  className="p-3 lg:p-4 text-sky-200 font-semibold align-top whitespace-normal leading-snug"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="text-indigo-100/90">
            {block.rows.map((row, rIdx) => (
              <tr
                key={rIdx}
                className={rIdx === block.rows.length - 1 ? "" : "border-b border-white/10"}
              >
                {row.map((cell, cIdx) => (
                  <td
                    key={cIdx}
                    className={`p-3 lg:p-4 align-top whitespace-normal break-words leading-relaxed ${
                      cIdx === 0 ? "font-medium text-white" : ""
                    }`}
                  >
                    <CellContent html={cell} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
