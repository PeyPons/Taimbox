import { Clock } from 'lucide-react';

interface BlogReadingTimeProps {
  minutes: number;
  className?: string;
}

export function BlogReadingTime({ minutes, className = '' }: BlogReadingTimeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-sm text-indigo-200/80 ${className}`}
      aria-label={`Tiempo de lectura estimado: ${minutes} minutos`}
    >
      <Clock className="h-4 w-4 shrink-0" />
      ~{minutes} min de lectura
    </span>
  );
}
