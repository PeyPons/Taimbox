import { useState } from 'react';
import { List, ChevronDown, ChevronUp } from 'lucide-react';
import type { BlogVariant } from './blogVariants';

export interface BlogTOCItem {
  id: string;
  label: string;
}

interface BlogTOCProps {
  items: BlogTOCItem[];
  className?: string;
  /** `editorial`: fondo claro y texto oscuro para cuerpo tipo artículo en #FCFCFD. */
  variant?: BlogVariant;
}

export function BlogTOC({ items, className = '', variant = 'default' }: BlogTOCProps) {
  const [open, setOpen] = useState(false);
  const isEditorial = variant === 'editorial';

  const shell = isEditorial
    ? 'rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden'
    : 'rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden';
  const btnChevron = isEditorial ? 'text-slate-500' : 'text-indigo-300';
  const titleRow = isEditorial
    ? 'flex items-center gap-2 text-slate-900 font-semibold text-sm'
    : 'flex items-center gap-2 text-white font-semibold text-sm';
  const iconClass = isEditorial ? 'h-4 w-4 shrink-0 text-indigo-600' : 'h-4 w-4 shrink-0 text-indigo-400';
  const borderT = isEditorial ? 'border-t border-slate-200' : 'border-t border-white/10';
  const linkClass = isEditorial
    ? 'text-sm text-indigo-800 hover:text-indigo-950 transition-colors block py-0.5'
    : 'text-sm text-indigo-200/90 hover:text-white transition-colors block py-0.5';

  return (
    <div className={`${shell} ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 p-4 text-left sm:cursor-default sm:pointer-events-none"
        aria-expanded={open}
        aria-controls="blog-toc-list"
      >
        <span className={titleRow}>
          <List className={iconClass} />
          Contenido de esta guía
        </span>
        <span className={`sm:hidden ${btnChevron}`}>
          {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </span>
      </button>
      <div
        id="blog-toc-list"
        className={`${borderT} ${open ? 'block' : 'hidden sm:block'}`}
      >
        <ul className="p-4 pt-3 space-y-2">
          {items.map((item) => (
            <li key={item.id}>
              <a href={`#${item.id}`} className={linkClass}>
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
