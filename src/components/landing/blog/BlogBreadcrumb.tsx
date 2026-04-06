import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { localizedPathFromEs } from '@/i18n/publicPaths';

interface BlogBreadcrumbProps {
  title: string;
  className?: string;
}

export function BlogBreadcrumb({ title, className = '' }: BlogBreadcrumbProps) {
  const { t, i18n } = useTranslation('landing');
  const blogPath = localizedPathFromEs('/blog', i18n.language);

  return (
    <nav
      className={`flex items-center gap-1.5 text-sm text-indigo-200/80 ${className}`}
      aria-label={t('blog.breadcrumbAria')}
    >
      <Link to={blogPath} className="hover:text-white transition-colors">
        {t('footer.links.blog')}
      </Link>
      <ChevronRight className="h-4 w-4 shrink-0 text-indigo-300/60" />
      <span className="text-white/90 truncate" aria-current="page">
        {title}
      </span>
    </nav>
  );
}
