import { useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import CategoriesView from '../components/CategoriesView';
import { usePromptHubContext } from '../hooks/PromptHubContext';

export default function CategoriesPage() {
  const { state, actions } = usePromptHubContext();
  const navigate = useNavigate();

  // Memoize counts to prevent recalculating on independent state updates
  const promptsCountMap = useMemo(
    () =>
      state.categories.reduce<Record<string, number>>((acc, curr) => {
        acc[curr.id] = curr.promptCount || 0;
        acc[curr.name] = curr.promptCount || 0;
        return acc;
      }, {}),
    [state.categories],
  );

  // Memoize navigation action to avoid recreating callback functions every render
  const handleCategorySelection = useCallback(
    (categoryValue: string) => {
      const category = state.categories.find((item) =>
        [item.id, item.name, item.slug].includes(categoryValue),
      );
      
      const slug = category?.slug || categoryValue.toLowerCase().replace(/\s+/g, '-');
      
      // Update global prompt states safely
      actions.handleCategorySelected(categoryValue);
      
      // Navigate to the dynamic landing page
      navigate(`/category/${slug}`);
    },
    [state.categories, actions, navigate]
  );

  return (
    <CategoriesView
      categories={state.categories}
      onCategorySelected={handleCategorySelection}
      promptsCountMap={promptsCountMap}
    />
  );
}
