import { useState } from 'react';
import { List, ChevronDown, ChevronUp } from 'lucide-react';

export interface BlogTOCItem {
  id: string;
  label: string;
}

interface BlogTOCProps {
  items: BlogTOCItem[];
  className?: string;
}

export function BlogTOC({ items, className = '' }: BlogTOCProps) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className={`rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden ${className}`}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 p-4 text-left sm:cursor-default sm:pointer-events-none"
        aria-expanded={open}
        aria-controls="blog-toc-list"
      >
        <span className="flex items-center gap-2 text-white font-semibold text-sm">
          <List className="h-4 w-4 shrink-0 text-indigo-400" />
          Contenido de esta guía
        </span>
        <span className="sm:hidden text-indigo-300">
          {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </span>
      </button>
      <div
        id="blog-toc-list"
        className={`border-t border-white/10 ${open ? 'block' : 'hidden sm:block'}`}
      >
        <ul className="p-4 pt-3 space-y-2">
          {items.map((item) => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                className="text-sm text-indigo-200/90 hover:text-white transition-colors block py-0.5"
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
