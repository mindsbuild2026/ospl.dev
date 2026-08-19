import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ExploreView from '../components/ExploreView';
import { usePromptHubContext } from '../hooks/PromptHubContext';

export default function SearchPage() {
  const { state, actions } = usePromptHubContext();
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);

  const queryParam = searchParams.get('q') ?? '';

  useEffect(() => {
    if (queryParam !== state.searchQuery) {
      actions.setSearchQuery(queryParam);
    }
  }, [actions, queryParam, state.searchQuery]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (state.searchQuery) {
      params.set('q', state.searchQuery);
    }
    const searchString = params.toString();
    const target = searchString ? `/search?${searchString}` : '/search';
    if (location.pathname !== '/search' || location.search !== (searchString ? `?${searchString}` : '')) {
      navigate(target, { replace: true });
    }
  }, [location.pathname, location.search, navigate, state.searchQuery]);

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
