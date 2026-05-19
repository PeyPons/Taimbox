import * as React from 'react';

const MOBILE_BREAKPOINT = 768;
const WIDE_LAYOUT_BREAKPOINT = 1280;

function getIsMobile() {
  if (typeof window === 'undefined') return true;
  return window.innerWidth < MOBILE_BREAKPOINT;
}

function getIsWideLayout() {
  if (typeof window === 'undefined') return false;
  return window.innerWidth >= WIDE_LAYOUT_BREAKPOINT;
}

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(getIsMobile);

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener('change', onChange);
    setIsMobile(getIsMobile());
    return () => mql.removeEventListener('change', onChange);
  }, []);

  return isMobile;
}

/** >= 1280px: grid mes 5 columnas + panel lateral fijo */
export function useIsWideLayout() {
  const [isWideLayout, setIsWideLayout] = React.useState<boolean>(getIsWideLayout);

  React.useEffect(() => {
    const mql = window.matchMedia(`(min-width: ${WIDE_LAYOUT_BREAKPOINT}px)`);
    const onChange = () => {
      setIsWideLayout(getIsWideLayout());
    };
    mql.addEventListener('change', onChange);
    setIsWideLayout(getIsWideLayout());
    return () => mql.removeEventListener('change', onChange);
  }, []);

  return isWideLayout;
}
