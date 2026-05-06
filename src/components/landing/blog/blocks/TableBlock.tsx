import type { TableBlock as TableBlockType } from "@/lib/blog/blockSchema";

export function TableBlock({ block }: { block: TableBlockType }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5 my-8">
      <table className="w-full text-left text-sm sm:text-base">
        <thead>
          <tr className="border-b border-white/10 bg-white/5">
            {block.headers.map((h, i) => (
              <th
                key={i}
                className="p-3 sm:p-4 text-sky-200 font-semibold"
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
                  className={`p-3 sm:p-4 align-top ${cIdx === 0 ? "font-medium text-white" : ""}`}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
