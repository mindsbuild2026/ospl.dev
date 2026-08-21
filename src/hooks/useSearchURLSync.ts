/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Hook to synchronize search/filter state with URL without causing flickers
 * Uses one-way sync from URL on mount, then updates URL on state change
 */
import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

interface UseSearchURLSyncProps {
  searchQuery: string;
  selectedCategory: string | null;
  onSearchChange: (query: string) => void;
  onCategoryChange: (category: string | null) => void;
  categories: Array<{ id: string; name: string; slug: string }>;
}

export function useSearchURLSync({
  searchQuery,
  selectedCategory,
  onSearchChange,
  onCategoryChange,
  categories,
}: UseSearchURLSyncProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const isInitialMount = useRef(true);
  const lastUrlRef = useRef('');

  // Only sync FROM URL on initial mount
  useEffect(() => {
    if (!isInitialMount.current) return;

    const searchParams = new URLSearchParams(location.search);
    const urlQuery = searchParams.get('q') ?? '';
    const urlCategory = searchParams.get('category') ?? '';

    if (urlQuery) {
      onSearchChange(urlQuery);
    }

    if (urlCategory) {
      // Resolve category slug to name
      const categoryName =
        categories.find(
          (item) => item.slug === urlCategory || item.name.toLowerCase() === urlCategory.toLowerCase(),
        )?.name ?? urlCategory;
      onCategoryChange(categoryName);
    }

    isInitialMount.current = false;
  }, []);

  // Update URL when state changes (but skip if we're already at that URL)
  useEffect(() => {
    if (isInitialMount.current) return;

    const params = new URLSearchParams();
    if (searchQuery) {
      params.set('q', searchQuery);
    }
    if (selectedCategory) {
      const categorySlug = categories.find((item) => item.name === selectedCategory)?.slug;
      params.set('category', categorySlug || selectedCategory);
    }

    const basePath = location.pathname.startsWith('/search') ? '/search' : '/explore';
    const newUrl = params.toString() ? `${basePath}?${params.toString()}` : basePath;
    const currentUrl = location.pathname + location.search;

    // Only navigate if URL actually changed
    if (currentUrl !== newUrl) {
      navigate(newUrl, { replace: true });
      lastUrlRef.current = newUrl;
    }
  }, [searchQuery, selectedCategory, categories, navigate, location.pathname, location.search]);
}
