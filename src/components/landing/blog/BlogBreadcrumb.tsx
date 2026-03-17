import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

interface BlogBreadcrumbProps {
  title: string;
  className?: string;
}

export function BlogBreadcrumb({ title, className = '' }: BlogBreadcrumbProps) {
  return (
    <nav
      className={`flex items-center gap-1.5 text-sm text-indigo-200/80 ${className}`}
      aria-label="Breadcrumb"
    >
      <Link to="/blog" className="hover:text-white transition-colors">
        Blog
      </Link>
      <ChevronRight className="h-4 w-4 shrink-0 text-indigo-300/60" />
      <span className="text-white/90 truncate" aria-current="page">
        {title}
      </span>
    </nav>
  );
}
