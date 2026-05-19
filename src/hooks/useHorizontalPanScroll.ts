import { RefObject, useEffect } from 'react';

const INTERACTIVE_SELECTOR =
  'button, a, input, textarea, select, label, [contenteditable="true"], [data-no-drag-scroll]';

interface UseHorizontalPanScrollOptions {
  enabled?: boolean;
}

function isInteractiveTarget(target: EventTarget | null): boolean {
  return target instanceof Element && !!target.closest(INTERACTIVE_SELECTOR);
}

/** Contenedor overflow-y ascendente (p. ej. lista de tareas en columna semanal). */
function findNestedVerticalScroller(target: EventTarget | null, stopAt: HTMLElement): HTMLElement | null {
  if (!(target instanceof Element)) return null;
  let node: Element | null = target;
  while (node && node !== stopAt) {
    if (node instanceof HTMLElement) {
      const { overflowY } = window.getComputedStyle(node);
      if (
        (overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay') &&
        node.scrollHeight > node.clientHeight + 1
      ) {
        return node;
      }
    }
    node = node.parentElement;
  }
  return null;
}

function shouldDeferToVerticalScroll(event: WheelEvent, horizontalEl: HTMLElement): boolean {
  const verticalScroller = findNestedVerticalScroller(event.target, horizontalEl);
  if (!verticalScroller || Math.abs(event.deltaY) < Math.abs(event.deltaX)) return false;

  const { scrollTop, scrollHeight, clientHeight } = verticalScroller;
  const atTop = scrollTop <= 0;
  const atBottom = scrollTop + clientHeight >= scrollHeight - 1;
  if (event.deltaY < 0 && !atTop) return true;
  if (event.deltaY > 0 && !atBottom) return true;
  return false;
}

function setupHorizontalPanScroll(el: HTMLElement) {
  let isDragging = false;
  let startX = 0;
  let startScrollLeft = 0;
  let priorSnapType = '';

  const canScroll = () => el.scrollWidth > el.clientWidth + 1;

  const beginDrag = (clientX: number) => {
    if (!canScroll()) return false;
    isDragging = true;
    startX = clientX;
    startScrollLeft = el.scrollLeft;
    priorSnapType = el.style.scrollSnapType;
    el.style.scrollSnapType = 'none';
    el.classList.add('cursor-grabbing', 'select-none');
    return true;
  };

  const moveDrag = (clientX: number) => {
    if (!isDragging) return;
    el.scrollLeft = startScrollLeft - (clientX - startX);
  };

  const endDrag = () => {
    if (!isDragging) return;
    isDragging = false;
    el.style.scrollSnapType = priorSnapType;
    el.classList.remove('cursor-grabbing', 'select-none');
  };

  const onMouseDown = (event: MouseEvent) => {
    if (event.button !== 0 || isInteractiveTarget(event.target)) return;
    if (!beginDrag(event.clientX)) return;
    event.preventDefault();

    const onMouseMove = (moveEvent: MouseEvent) => {
      moveDrag(moveEvent.clientX);
      moveEvent.preventDefault();
    };

    const onMouseUp = () => {
      endDrag();
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const onWheel = (event: WheelEvent) => {
    if (!canScroll()) return;
    if (shouldDeferToVerticalScroll(event, el)) return;

    const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
    if (delta === 0) return;

    el.scrollLeft += delta;
    event.preventDefault();
    event.stopPropagation();
  };

  el.classList.add('cursor-grab', 'touch-pan-x');
  el.addEventListener('mousedown', onMouseDown);
  el.addEventListener('wheel', onWheel, { passive: false, capture: true });

  return () => {
    endDrag();
    el.classList.remove('cursor-grab', 'cursor-grabbing', 'select-none', 'touch-pan-x');
    el.removeEventListener('mousedown', onMouseDown);
    el.removeEventListener('wheel', onWheel, true);
  };
}

/**
 * Scroll horizontal con arrastre (click + drag) y rueda del ratón en contenedores overflow-x.
 */
export function useHorizontalPanScroll<T extends HTMLElement>(
  ref: RefObject<T | null>,
  { enabled = true }: UseHorizontalPanScrollOptions = {}
) {
  useEffect(() => {
    if (!enabled) return;

    let disposed = false;
    let cleanup: (() => void) | undefined;

    const attach = () => {
      if (disposed || cleanup) return;
      const el = ref.current;
      if (!el) return;
      cleanup = setupHorizontalPanScroll(el);
    };

    attach();
    const frameId = requestAnimationFrame(attach);
    const timeoutId = window.setTimeout(attach, 200);

    const ro = new ResizeObserver(attach);
    if (ref.current) ro.observe(ref.current);

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      window.clearTimeout(timeoutId);
      ro.disconnect();
      cleanup?.();
    };
  }, [ref, enabled]);
}

export function scrollChildIntoHorizontalView(
  container: HTMLElement | null,
  childSelector: string
) {
  if (!container) return;
  const child = container.querySelector<HTMLElement>(childSelector);
  if (!child) return;
  const left = child.offsetLeft - (container.clientWidth - child.clientWidth) / 2;
  container.scrollTo({ left: Math.max(0, left), behavior: 'smooth' });
}
