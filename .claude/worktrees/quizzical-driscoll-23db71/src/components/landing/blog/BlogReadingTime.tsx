import { Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { BlogVariant } from './blogVariants';

interface BlogReadingTimeProps {
  minutes: number;
  className?: string;
  variant?: BlogVariant;
}

export function BlogReadingTime({ minutes, className = '', variant = 'default' }: BlogReadingTimeProps) {
  const { t } = useTranslation('blog');
  const isEditorial = variant === 'editorial';
  const text = isEditorial ? 'text-slate-600' : 'text-indigo-200/80';
  const icon = isEditorial ? 'text-slate-500' : '';

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-sm ${text} ${className}`}
      aria-label={t('components.readingTime.aria', { count: minutes })}
    >
      <Clock className={`h-4 w-4 shrink-0 ${icon}`} />
      {t('components.readingTime.text', { count: minutes })}
    </span>
  );
}
