import { useState } from 'react';
import { Link2, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { toast } from '@/lib/notify';

interface SectionHeadingProps {
  id: string;
  level?: 'h1' | 'h2' | 'h3';
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
  children: React.ReactNode;
}

const levelStyles = {
  h1: 'text-3xl sm:text-4xl font-black',
  h2: 'text-2xl font-bold',
  h3: 'text-lg font-bold',
};

const iconSizes = {
  h1: 'h-8 w-8',
  h2: 'h-6 w-6',
  h3: 'h-5 w-5',
};

export function SectionHeading({ id, level = 'h2', icon: Icon, className, children }: SectionHeadingProps) {
  const { t } = useTranslation('apiDocs');
  const [copied, setCopied] = useState(false);

  const copyLink = (e: React.MouseEvent) => {
    e.preventDefault();
    const url = `${window.location.origin}${window.location.pathname}#${id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      toast.success(t('toastLinkCopied'), { description: t('toastLinkCopiedDesc') });
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      toast.error(t('toastCopyFailed'));
    });
  };

  const HeadingTag = level;

  return (
    <div id={id} className={cn('scroll-mt-24 group/heading', className)}>
      <div className="flex items-center gap-2 w-full">
        <HeadingTag
          className={cn(
            'text-white flex items-center gap-3 mb-0',
            levelStyles[level],
          )}
        >
          {Icon && <Icon className={cn('text-indigo-300 shrink-0', iconSizes[level])} />}
          {children}
        </HeadingTag>
        <button
          type="button"
          onClick={copyLink}
          aria-label={t('copySectionAria')}
          className={cn(
            'shrink-0 p-1.5 rounded-md transition-all',
            'opacity-40 hover:opacity-100 group-hover/heading:opacity-100',
            'text-slate-400 hover:text-white hover:bg-white/10 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-indigo-400/50',
          )}
        >
          {copied ? (
            <Check className="h-4 w-4 text-emerald-400" />
          ) : (
            <Link2 className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
}
