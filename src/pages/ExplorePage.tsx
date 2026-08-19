import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ExploreView from '../components/ExploreView';
import { usePromptHubContext } from '../hooks/PromptHubContext';
import { useSearchURLSync } from '../hooks/useSearchURLSync';

export default function ExplorePage() {
  const { state, actions } = usePromptHubContext();
  const navigate = useNavigate();

  // Sync search/category state with URL without causing flickers
  useSearchURLSync({
    searchQuery: state.searchQuery,
    selectedCategory: state.selectedCategoryFilter,
    onSearchChange: actions.setSearchQuery,
    onCategoryChange: actions.setSelectedCategoryFilter,
    categories: state.categories,
  });

  // Handle prompt details navigation
  useEffect(() => {
    if (state.selectedPromptId) {
      actions.setSelectedPromptId(null);
    }
  }, []);

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
