import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import type { ColumnDef } from '../data/types';

export function ParamTable({ columns }: { columns: ColumnDef[] }) {
  const { t } = useTranslation('apiDocs');

  return (
    <div className="overflow-x-auto -mx-1">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/15">
            <th className="text-left py-2.5 px-3 text-indigo-300 font-semibold text-xs uppercase tracking-wider">{t('paramTable.field')}</th>
            <th className="text-left py-2.5 px-3 text-indigo-300 font-semibold text-xs uppercase tracking-wider">{t('paramTable.type')}</th>
            <th className="text-center py-2.5 px-3 text-indigo-300 font-semibold text-xs uppercase tracking-wider">{t('paramTable.required')}</th>
            <th className="text-left py-2.5 px-3 text-indigo-300 font-semibold text-xs uppercase tracking-wider hidden lg:table-cell">{t('paramTable.default')}</th>
            <th className="text-left py-2.5 px-3 text-indigo-300 font-semibold text-xs uppercase tracking-wider hidden md:table-cell">{t('paramTable.relation')}</th>
            <th className="text-left py-2.5 px-3 text-indigo-300 font-semibold text-xs uppercase tracking-wider">{t('paramTable.description')}</th>
          </tr>
        </thead>
        <tbody>
          {columns.map((col, i) => (
            <tr key={col.name} className={cn('border-b border-white/5', i % 2 === 0 ? 'bg-white/[0.02]' : '')}>
              <td className="py-2 px-3 font-mono text-white text-xs whitespace-nowrap">
                {col.name}
                {col.pk && <span className="ml-1.5 text-[9px] px-1 py-0.5 rounded bg-amber-500/20 text-amber-300 font-sans">PK</span>}
              </td>
              <td className="py-2 px-3 font-mono text-purple-300 text-xs whitespace-nowrap">{col.type}</td>
              <td className="py-2 px-3 text-center text-xs">
                {col.required ? <span className="text-rose-400">{t('paramTable.yes')}</span> : <span className="text-slate-500">{t('paramTable.no')}</span>}
              </td>
              <td className="py-2 px-3 font-mono text-slate-400 text-[11px] hidden lg:table-cell whitespace-nowrap">
                {col.default || '\u2014'}
              </td>
              <td className="py-2 px-3 font-mono text-cyan-300/80 text-[11px] hidden md:table-cell whitespace-nowrap">
                {col.fk || '\u2014'}
              </td>
              <td className="py-2 px-3 text-indigo-100/80 text-xs leading-relaxed">
                {col.description}
                {col.check && <span className="ml-1 text-[10px] text-amber-300/70">({col.check})</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
