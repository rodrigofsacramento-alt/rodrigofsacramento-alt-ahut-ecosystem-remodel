import { useState, useEffect, useCallback } from 'react';

type Breakpoint = 'base' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

const breakpoints: Record<Breakpoint, number> = {
  base: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

export function useResponsive() {
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 768
  );

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    const handleResize = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => setWindowWidth(window.innerWidth), 100);
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeout);
    };
  }, []);

  const up = useCallback(
    (bp: Breakpoint) => windowWidth >= breakpoints[bp],
    [windowWidth]
  );

  const down = useCallback(
    (bp: Breakpoint) => windowWidth < breakpoints[bp],
    [windowWidth]
  );

  const between = useCallback(
    (min: Breakpoint, max: Breakpoint) =>
      windowWidth >= breakpoints[min] && windowWidth < breakpoints[max],
    [windowWidth]
  );

  return {
    width: windowWidth,
    isMobile: windowWidth < 768,
    isTablet: windowWidth >= 768 && windowWidth < 1024,
    isDesktop: windowWidth >= 1024,
    up,
    down,
    between,
    breakpoints,
  };
}

// ── Responsive Grid helper ──
export function responsiveGrid<T>(items: T[], cols: Record<Breakpoint, number>): T[][] {
  const colCount = ((): number => {
    if (typeof window === 'undefined') return cols.base || 1;
    const w = window.innerWidth;
    if (w >= 1536) return cols['2xl'] || cols.xl || cols.lg || cols.md || cols.base || 1;
    if (w >= 1280) return cols.xl || cols.lg || cols.md || cols.base || 1;
    if (w >= 1024) return cols.lg || cols.md || cols.base || 1;
    if (w >= 768) return cols.md || cols.base || 1;
    return cols.base || 1;
  })();

  const grid: T[][] = [];
  for (let i = 0; i < items.length; i += colCount) {
    grid.push(items.slice(i, i + colCount));
  }
  return grid;
}

// ── Scroll Animation variants ──
export const scrollVariants = {
  fadeInUp: {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
  },
  fadeInLeft: {
    hidden: { opacity: 0, x: -30 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
  },
  fadeInRight: {
    hidden: { opacity: 0, x: 30 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
  },
  scaleIn: {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
  },
  stagger: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05, delayChildren: 0.1 },
    },
  },
  staggerItem: {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
  },
};

// ── Responsive CSS class generator ──
export function responsiveClass(
  base: string,
  variants: Partial<Record<Breakpoint, string>>
): string {
  let result = base;
  const map: Record<string, string> = {
    sm: 'sm:', md: 'md:', lg: 'lg:', xl: 'xl:', '2xl': '2xl:',
  };
  for (const [bp, cls] of Object.entries(variants)) {
    if (cls) {
      result += ` ${map[bp] || ''}${cls}`;
    }
  }
  return result;
}