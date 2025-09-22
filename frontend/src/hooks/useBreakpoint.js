// Simple breakpoint hook for responsive behavior without external deps
import { useEffect, useState } from 'react';

const queries = {
  xs: '(max-width: 639px)', // < sm
  sm: '(min-width: 640px)',
  md: '(min-width: 768px)',
  lg: '(min-width: 1024px)',
  xl: '(min-width: 1280px)'
};

function useMediaQuery(query) {
  const getMatch = () => (typeof window !== 'undefined' ? window.matchMedia(query).matches : false);
  const [matches, setMatches] = useState(getMatch);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia(query);
    const handler = (e) => setMatches(e.matches);
    // Modern browsers
    if (mql.addEventListener) {
      mql.addEventListener('change', handler);
    } else {
      // Safari < 14
      mql.addListener(handler);
    }
    setMatches(mql.matches);
    return () => {
      if (mql.removeEventListener) {
        mql.removeEventListener('change', handler);
      } else {
        mql.removeListener(handler);
      }
    };
  }, [query]);

  return matches;
}

export default function useBreakpoint() {
  const isXs = useMediaQuery(queries.xs);
  const isSmUp = useMediaQuery(queries.sm);
  const isMdUp = useMediaQuery(queries.md);
  const isLgUp = useMediaQuery(queries.lg);
  const isXlUp = useMediaQuery(queries.xl);

  return {
    isXs,
    isSm: isSmUp,
    isMd: isMdUp,
    isLg: isLgUp,
    isXl: isXlUp,
    isMobile: isXs || !isSmUp,
  };
}
