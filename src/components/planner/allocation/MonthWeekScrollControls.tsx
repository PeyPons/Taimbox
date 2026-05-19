import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { RefObject, useCallback, useEffect, useState } from 'react';

interface MonthWeekScrollControlsProps {
  containerRef: RefObject<HTMLDivElement | null>;
  active?: boolean;
  className?: string;
}

export function MonthWeekScrollControls({
  containerRef,
  active = true,
  className,
}: MonthWeekScrollControlsProps) {
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = containerRef.current;
    if (!el) {
      setCanScrollLeft(false);
      setCanScrollRight(false);
      return;
    }
    const maxScroll = el.scrollWidth - el.clientWidth;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < maxScroll - 4);
  }, [containerRef]);

  useEffect(() => {
    if (!active) return;

    let cancelled = false;
    let ro: ResizeObserver | null = null;
    let el: HTMLDivElement | null = null;

    const setup = () => {
      if (cancelled) return;
      el = containerRef.current;
      if (!el) return;

      updateScrollState();
      el.addEventListener('scroll', updateScrollState, { passive: true });
      ro = new ResizeObserver(updateScrollState);
      ro.observe(el);
    };

    setup();
    const timeoutId = window.setTimeout(setup, 150);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
      if (el) el.removeEventListener('scroll', updateScrollState);
      ro?.disconnect();
    };
  }, [containerRef, updateScrollState, active]);

  const scrollByPage = (direction: -1 | 1) => {
    const el = containerRef.current;
    if (!el) return;
    const amount = Math.max(280, Math.round(el.clientWidth * 0.75));
    el.scrollBy({ left: direction * amount, behavior: 'smooth' });
  };

  if (!canScrollLeft && !canScrollRight) return null;

  return (
    <>
      <div
        className={cn(
          'pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-slate-50/95 to-transparent z-[1]',
          !canScrollLeft && 'opacity-0',
          className
        )}
        aria-hidden
      />
      <div
        className={cn(
          'pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-slate-50/95 to-transparent z-[1]',
          !canScrollRight && 'opacity-0',
          className
        )}
        aria-hidden
      />
      <Button
        type="button"
        variant="secondary"
        size="icon"
        className={cn(
          'absolute left-0 top-1/2 -translate-y-1/2 z-10 h-9 w-9 rounded-full shadow-md',
          !canScrollLeft && 'opacity-40 pointer-events-none'
        )}
        onClick={() => scrollByPage(-1)}
        aria-label="Semana anterior"
        disabled={!canScrollLeft}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="secondary"
        size="icon"
        className={cn(
          'absolute right-0 top-1/2 -translate-y-1/2 z-10 h-9 w-9 rounded-full shadow-md',
          !canScrollRight && 'opacity-40 pointer-events-none'
        )}
        onClick={() => scrollByPage(1)}
        aria-label="Semana siguiente"
        disabled={!canScrollRight}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </>
  );
}
