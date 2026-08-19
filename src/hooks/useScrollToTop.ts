import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Hook that scrolls to the top of the page when the route pathname changes.
 * Enables smooth transitions between pages without preserving old scroll positions.
 * Does NOT scroll for search/filter query string changes (only pathname changes).
 */
export function useScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Reset scroll position to top whenever pathname changes
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [pathname]);
}
