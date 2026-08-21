import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ExploreView from '../components/ExploreView';
import { usePromptHubContext } from '../hooks/PromptHubContext';

export default function SearchPage() {
  const { state, actions } = usePromptHubContext();
  const navigate = useNavigate();
  const location = useLocation();
  const isSyncingFromUrl = useRef(false);

  // Sync FROM URL query param to Context state
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const queryParam = searchParams.get('q') ?? '';

    if (queryParam !== state.searchQuery) {
      isSyncingFromUrl.current = true;
      actions.setSearchQuery(queryParam);
    }
  }, [location.search]);

  // Sync Context state to URL query param
  useEffect(() => {
    if (isSyncingFromUrl.current) {
      isSyncingFromUrl.current = false;
      return;
    }

    const searchParams = new URLSearchParams(location.search);
    const currentUrlQuery = searchParams.get('q') ?? '';

    if (state.searchQuery !== currentUrlQuery) {
      const target = state.searchQuery
        ? `/search?q=${encodeURIComponent(state.searchQuery)}`
        : '/search';

      const currentFullUrl = location.pathname + location.search;
      if (currentFullUrl !== target) {
        navigate(target, { replace: true });
      }
    }
  }, [state.searchQuery, location.pathname, location.search, navigate]);

  return (
    <ExploreView
      prompts={state.promptCards}
      categories={state.categories}
      collections={state.collections}
      filterOptions={state.filterOptions}
      contributors={state.contributors}
      isLoading={state.isLoadingPrompts}
      onPromptClick={(id) => {
        actions.handlePromptClick(id);
        navigate(`/prompt/${id}`);
      }}
      onOpenCollection={(collectionId) => {
        actions.handleCollectionClick(collectionId);
        navigate(`/collection/${collectionId}`);
      }}
      savedPromptIds={state.savedPromptIds}
      toggleSavePrompt={actions.toggleSavePrompt}
      isAuthenticated={Boolean(state.user?.id)}
      searchQuery={state.searchQuery}
      setSearchQuery={(query) => actions.setSearchQuery(query)}
      selectedCategoryFilter={state.selectedCategoryFilter}
      setSelectedCategoryFilter={(value) => actions.setSelectedCategoryFilter(value)}
      loadMorePrompts={actions.loadMorePrompts}
    />
  );
}
