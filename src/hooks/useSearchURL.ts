import { useEffect } from 'react';

interface SearchParams {
  q?: string;
  category?: string;
}

/**
 * Hook to synchronize search query and filters with URL
 * Does NOT trigger auto-scroll to preserve user scroll position
 */
export function useSearchURL(
  searchQuery: string,
  onSearchChange: (query: string) => void,
  selectedCategoryFilter: string | null,
  onCategoryChange: (category: string | null) => void,
) {
  // Initialize state from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlQuery = params.get('q');
    const urlCategory = params.get('category');

    if (urlQuery && urlQuery !== searchQuery) {
      onSearchChange(urlQuery);
    }
    if (urlCategory && urlCategory !== selectedCategoryFilter) {
      onCategoryChange(urlCategory);
    }
  }, []); // Only on mount

  // Update URL when search query or category changes
  useEffect(() => {
    const params = new URLSearchParams();
    
    if (searchQuery) {
      params.set('q', searchQuery);
    }
    if (selectedCategoryFilter) {
      params.set('category', selectedCategoryFilter);
    }

    const newUrl = params.toString() ? `?${params.toString()}` : window.location.pathname;
    if (window.location.search !== newUrl) {
      window.history.replaceState(null, '', newUrl);
    }
  }, [searchQuery, selectedCategoryFilter]);
}
