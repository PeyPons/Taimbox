import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { BlogVariant } from './blogVariants';

interface BlogRelatedPostProps {
  title: string;
  description: string;
  href: string;
  className?: string;
  variant?: BlogVariant;
}

export function BlogRelatedPost({
  title,
  description,
  href,
  className = '',
  variant = 'default',
}: BlogRelatedPostProps) {
  const { t } = useTranslation('blog');
  const isEditorial = variant === 'editorial';
  const shell = isEditorial
    ? 'rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:p-6 transition-all duration-300 hover:border-slate-300 hover:bg-white shadow-sm'
    : 'rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-5 sm:p-6 transition-all duration-300 hover:border-white/20 hover:bg-white/[0.08]';
  const label = isEditorial ? 'text-xs font-semibold uppercase tracking-wider text-indigo-700 mb-3' : 'text-xs font-semibold uppercase tracking-wider text-indigo-300/90 mb-3';
  const h3 = isEditorial
    ? 'text-lg font-bold text-slate-900 mb-2 group-hover:text-indigo-800 transition-colors'
    : 'text-lg font-bold text-white mb-2 group-hover:text-indigo-200 transition-colors';
  const desc = isEditorial ? 'text-sm text-slate-600 leading-relaxed mb-2' : 'text-sm text-indigo-100/90 leading-relaxed mb-2';
  const arrow = isEditorial
    ? 'inline-flex items-center gap-2 text-indigo-700 text-sm font-medium group-hover:text-indigo-900 transition-colors'
    : 'inline-flex items-center gap-2 text-indigo-300 text-sm font-medium group-hover:text-white transition-colors';

  return (
    <div className={`${shell} ${className}`}>
      <p className={label}>{t('components.relatedPost.label')}</p>
      <Link to={href} className="group block" aria-label={t('components.relatedPost.aria', { title })}>
        <h3 className={h3}>{title}</h3>
        <p className={desc}>{description}</p>
        <span className={arrow} aria-hidden="true">
          <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
        </span>
      </Link>
    </div>
  );
}
