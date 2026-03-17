import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

interface BlogRelatedPostProps {
  title: string;
  description: string;
  href: string;
  className?: string;
}

export function BlogRelatedPost({ title, description, href, className = '' }: BlogRelatedPostProps) {
  return (
    <div
      className={`rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-5 sm:p-6 transition-all duration-300 hover:border-white/20 hover:bg-white/[0.08] ${className}`}
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-indigo-300/90 mb-3">
        También te puede interesar
      </p>
      <Link to={href} className="group block">
        <h3 className="text-lg font-bold text-white mb-2 group-hover:text-indigo-200 transition-colors">
          {title}
        </h3>
        <p className="text-sm text-indigo-100/90 leading-relaxed mb-3">{description}</p>
        <span className="inline-flex items-center gap-2 text-indigo-300 text-sm font-medium group-hover:text-white transition-colors">
          Leer artículo
          <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
        </span>
      </Link>
    </div>
  );
}
