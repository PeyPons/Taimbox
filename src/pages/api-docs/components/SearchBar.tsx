import { useState, useEffect, useRef, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TOC_GROUPS } from '../data/toc';
import { TABLE_GROUPS } from '../data/tables';

interface SearchResult {
  id: string;
  label: string;
  group: string;
}

function buildIndex(): SearchResult[] {
  const results: SearchResult[] = [];
  for (const g of TOC_GROUPS) {
    for (const item of g.items) {
      results.push({ id: item.id, label: item.label, group: g.title });
    }
  }
  for (const tg of TABLE_GROUPS) {
    for (const t of tg.tables) {
      results.push({ id: `resource-${t.name}`, label: t.name, group: `Recurso: ${tg.group}` });
      for (const col of t.columns) {
        results.push({ id: `resource-${t.name}`, label: `${t.name}.${col.name}`, group: `Campo` });
      }
    }
  }
  return results;
}

export function SearchBar() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const index = useMemo(buildIndex, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return index.filter((r) => r.label.toLowerCase().includes(q)).slice(0, 12);
  }, [query, index]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
      if (e.key === 'Escape') {
        setOpen(false);
        setQuery('');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const navigate = (id: string) => {
    setOpen(false);
    setQuery('');
    requestAnimationFrame(() => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  };

  if (!open) {
    return (
      <button
        onClick={() => {
          setOpen(true);
          setTimeout(() => inputRef.current?.focus(), 50);
        }}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-900/40 border border-white/10 text-indigo-200 text-sm hover:bg-indigo-800/50 hover:text-white transition-colors"
      >
        <Search className="h-3.5 w-3.5 shrink-0" />
        <span className="flex-1 text-left">Buscar...</span>
        <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white/10 text-[10px] font-mono text-slate-500">
          Ctrl K
        </kbd>
      </button>
    );
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-950/90 border border-indigo-500/40">
        <Search className="h-3.5 w-3.5 text-indigo-300 shrink-0" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar..."
          className="flex-1 min-w-0 bg-transparent text-sm text-white placeholder:text-slate-500 outline-none"
        />
        <button onClick={() => { setOpen(false); setQuery(''); }}>
          <X className="h-3.5 w-3.5 text-slate-400 hover:text-white" />
        </button>
      </div>
      {filtered.length > 0 && (
        <div
          className={cn(
            'absolute top-full left-0 right-0 mt-1 rounded-lg bg-slate-900/95 backdrop-blur-sm',
            'border border-white/10 shadow-xl shadow-black/20 z-50',
            'max-h-64 overflow-y-auto overflow-x-hidden scrollbar-slim',
          )}
        >
          {filtered.map((r, i) => (
            <button
              key={`${r.id}-${i}`}
              onClick={() => navigate(r.id)}
              className={cn(
                'w-full text-left px-3 py-2 text-sm hover:bg-white/10 transition-colors',
                'flex items-center justify-between gap-3 min-w-0',
                i > 0 && 'border-t border-white/5',
              )}
            >
              <span className="text-white font-mono text-xs truncate min-w-0">
                {r.label}
              </span>
              <span className="text-[10px] text-slate-500 shrink-0">{r.group}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
