import { useState } from 'react';
import { Database, ChevronsUpDown } from 'lucide-react';
import { SectionHeading } from '../components/SectionHeading';
import { ResourceCard } from '../components/ResourceCard';
import { TABLE_GROUPS, GROUP_ANCHOR_MAP } from '../data/tables';

export function ResourceReference() {
  const [allExpanded, setAllExpanded] = useState(false);
  const [key, setKey] = useState(0);

  const toggleAll = () => {
    setAllExpanded(!allExpanded);
    setKey((k) => k + 1);
  };

  return (
    <section>
      {TABLE_GROUPS.map(({ group, icon: GroupIcon, tables }) => {
        const anchorId = GROUP_ANCHOR_MAP[group] || `res-${group.toLowerCase().replace(/\s/g, '-')}`;
        return (
          <div key={group} className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <SectionHeading id={anchorId} level="h3" icon={GroupIcon} className="mb-0">
                {group}
              </SectionHeading>
              {group === TABLE_GROUPS[0].group && (
                <button
                  onClick={toggleAll}
                  className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-white transition-colors"
                >
                  <ChevronsUpDown className="h-3 w-3" />
                  {allExpanded ? 'Colapsar todo' : 'Expandir todo'}
                </button>
              )}
            </div>
            <div className="space-y-4">
              {tables.map((table) => (
                <div key={`${table.name}-${key}`} id={`resource-${table.name}`} className="scroll-mt-28">
                  <ResourceCard
                    table={table}
                    defaultExpanded={allExpanded}
                  />
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </section>
  );
}
