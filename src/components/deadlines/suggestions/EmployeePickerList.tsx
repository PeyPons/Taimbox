import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Search, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import type { EmployeeOption } from '@/components/deadlines/suggestions/types';

export function EmployeePickerList({
  title,
  hint,
  options,
  selectedId,
  onSelect,
  emptyMessage,
  compact = true,
  fillHeight = false,
}: {
  title: string;
  hint?: string;
  options: EmployeeOption[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  emptyMessage?: string;
  compact?: boolean;
  fillHeight?: boolean;
}) {
  const { t } = useTranslation('app');
  const [search, setSearch] = useState('');

  const filtered = search.trim()
    ? options.filter((o) => o.name.toLowerCase().includes(search.trim().toLowerCase()))
    : options;

  return (
    <div className={cn('space-y-2.5', fillHeight && 'flex flex-col flex-1 min-h-0')}>
      <div>
        <p className="text-sm font-semibold text-slate-800">{title}</p>
        {hint && <p className="text-xs text-slate-500 mt-0.5">{hint}</p>}
      </div>
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
        <Input
          placeholder={t('deadlines.suggestions.searchByName', 'Buscar por nombre...')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={cn('pl-8', compact ? 'h-9 text-sm' : 'pl-9 h-10')}
        />
      </div>
      {filtered.length === 0 ? (
        <p className="text-sm text-slate-500 py-6 text-center">
          {emptyMessage ?? t('deadlines.suggestions.noPeopleAvailable', 'No hay personas disponibles.')}
        </p>
      ) : (
        <div
          className={cn(
            'space-y-1 overflow-y-auto pr-1',
            fillHeight
              ? 'flex-1 min-h-0'
              : compact
                ? 'max-h-[min(52vh,440px)]'
                : 'max-h-[min(40vh,320px)] space-y-1.5'
          )}
        >
          {filtered.map((emp) => {
            const selected = emp.id === selectedId;
            return (
              <button
                key={emp.id}
                type="button"
                onClick={() => onSelect(emp.id)}
                className={cn(
                  'w-full flex items-center text-left transition-colors border',
                  compact
                    ? 'gap-2 rounded-lg px-2 py-1.5 min-h-[2.5rem]'
                    : 'gap-3 rounded-xl p-3',
                  selected
                    ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                )}
              >
                <Avatar
                  className={cn(
                    'border border-slate-200 shrink-0',
                    compact ? 'h-7 w-7' : 'h-10 w-10'
                  )}
                >
                  <AvatarImage src={emp.avatarUrl} alt={emp.name} />
                  <AvatarFallback
                    className={cn(
                      'bg-primary/10 text-primary font-semibold',
                      compact ? 'text-[10px]' : 'text-sm'
                    )}
                  >
                    {emp.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      'text-slate-900 truncate',
                      compact ? 'text-sm font-medium leading-tight' : 'font-medium'
                    )}
                  >
                    {emp.name}
                  </p>
                  {emp.subtitle && (
                    <p
                      className={cn(
                        'text-slate-500 truncate',
                        compact ? 'text-[11px] leading-tight' : 'text-xs'
                      )}
                    >
                      {emp.subtitle}
                    </p>
                  )}
                </div>
                <Badge
                  variant="secondary"
                  className={cn(
                    'shrink-0 font-mono',
                    compact ? 'text-[10px] px-1.5 py-0 h-5' : 'text-xs',
                    emp.loadPct > 100 && 'bg-red-50 text-red-700',
                    emp.loadPct >= 85 && emp.loadPct <= 100 && 'bg-amber-50 text-amber-800'
                  )}
                >
                  {emp.loadPct}%
                </Badge>
                {!compact && <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
      {filtered.length > 0 && (
        <p className="text-[11px] text-slate-400 text-right">
          {t('deadlines.suggestions.peopleInList', '{{count}} en la lista', { count: filtered.length })}
        </p>
      )}
    </div>
  );
}
