import type { HTMLAttributes } from 'react';

import { cn } from '@/lib/utils';
import { useMouseWheelScroll } from '@/hooks/useMouseWheelScroll';

/** Contenedor con scroll vertical que respeta la rueda dentro de Sheet/Dialog (remove-scroll). */
export function ScrollWheelArea({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  const ref = useMouseWheelScroll<HTMLDivElement>();
  return <div ref={ref} className={cn(className)} {...props} />;
}
