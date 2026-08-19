import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import CategoryLandingPage from '../components/CategoryLandingPage';
import { usePromptHubContext } from '../hooks/PromptHubContext';

export default function CategoryPage() {
  const { state, actions } = usePromptHubContext();
  const { slug } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (!slug) return;
    actions.setSelectedPromptId(null);
    actions.setSelectedCollectionId(null);
    actions.setSearchQuery('');
  }, [actions, slug]);

  return (
    <CategoryLandingPage
      categorySlug={slug ?? ''}
      categories={state.categories}
      filterOptions={state.filterOptions}
      onPromptClick={(id) => {
        actions.handlePromptClick(id);
        navigate(`/prompt/${id}`);
      }}
      onBack={() => navigate('/explore')}
      onNavigateToCategorySlug={(nextSlug) => navigate(`/category/${nextSlug}`)}
    />
  );
}
