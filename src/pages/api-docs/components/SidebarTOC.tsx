import { useState } from 'react';
import { ChevronDown, ChevronRight, ChevronsUpDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { TOC_GROUPS } from '../data/toc';
import { SearchBar } from './SearchBar';

interface SidebarTOCProps {
  activeSection: string;
  onNavigate?: (id: string) => void;
}

export function SidebarTOC({ activeSection, onNavigate }: SidebarTOCProps) {
  const { t } = useTranslation('apiDocs');
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    TOC_GROUPS.forEach((g) => {
      init[g.titleKey] = g.defaultOpen ?? false;
    });
    return init;
  });

  const toggleGroup = (titleKey: string) => {
    setOpenGroups((prev) => ({ ...prev, [titleKey]: !prev[titleKey] }));
  };

  const expandAll = () => {
    const all: Record<string, boolean> = {};
    TOC_GROUPS.forEach((g) => { all[g.titleKey] = true; });
    setOpenGroups(all);
  };

  const collapseAll = () => {
    const all: Record<string, boolean> = {};
    TOC_GROUPS.forEach((g) => { all[g.titleKey] = false; });
    setOpenGroups(all);
  };

  const allOpen = TOC_GROUPS.every((g) => openGroups[g.titleKey]);

  const handleClick = (id: string) => {
    onNavigate?.(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <nav className="space-y-3">
      <SearchBar />

      <div className="flex items-center justify-between px-1">
        <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-400/60">
          {t('toc.content')}
        </p>
        <button
          type="button"
          onClick={allOpen ? collapseAll : expandAll}
          className="text-[10px] text-slate-500 hover:text-white transition-colors flex items-center gap-1"
          title={allOpen ? t('toc.collapseAll') : t('toc.expandAll')}
        >
          <ChevronsUpDown className="h-3 w-3" />
        </button>
      </div>

      {TOC_GROUPS.map((group) => {
        const isOpen = openGroups[group.titleKey];
        const GroupIcon = group.icon;
        const hasActive = group.items.some((item) => item.id === activeSection);
        const groupTitle = t(group.titleKey);

        return (
          <div key={group.titleKey}>
            <button
              type="button"
              onClick={() => toggleGroup(group.titleKey)}
              className={cn(
                'w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors',
                hasActive
                  ? 'text-indigo-300 bg-white/5'
                  : 'text-indigo-400/60 hover:text-indigo-300 hover:bg-white/5',
              )}
            >
              <GroupIcon className="h-3.5 w-3.5 shrink-0" />
              <span className="flex-1 text-left normal-case font-medium tracking-normal">{groupTitle}</span>
              {isOpen ? (
                <ChevronDown className="h-3 w-3 shrink-0" />
              ) : (
                <ChevronRight className="h-3 w-3 shrink-0" />
              )}
            </button>

            {isOpen && (
              <div className="ml-3 mt-0.5 space-y-0.5 border-l border-white/5 pl-2">
                {group.items.map(({ id, labelKey }) => (
                  <button
                    type="button"
                    key={id}
                    onClick={() => handleClick(id)}
                    className={cn(
                      'w-full text-left px-2 py-1 rounded-md text-xs transition-all duration-200 flex items-center gap-1.5',
                      activeSection === id
                        ? 'text-white bg-white/10 font-medium'
                        : 'text-indigo-200/50 hover:text-white hover:bg-white/5',
                    )}
                  >
                    {activeSection === id && (
                      <span className="w-0.5 h-3 bg-indigo-400 rounded-full shrink-0" />
                    )}
                    {t(labelKey)}
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}
