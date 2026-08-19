import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardView from '../components/DashboardView';
import { usePromptHubContext } from '../hooks/PromptHubContext';

export default function DashboardPage() {
  const { state, actions } = usePromptHubContext();
  const navigate = useNavigate();

  const savedPromptIds = state.savedPromptIds || [];

  const handleEditProfile = () => {
    navigate('/settings');
  };

  const handleSubmitPrompt = () => {
    actions.onSubmitClick();
    navigate('/submit');
  };

  const handleExplore = () => {
    actions.setSelectedPromptId(null);
    actions.setSelectedCollectionId(null);
    actions.setSelectedCategoryFilter(null);
    actions.setSearchQuery('');
    navigate('/explore');
  };

  return (
    <DashboardView
      user={state.user}
      author={state.author}
      prompts={state.promptCards}
      savedPrompts={state.savedPrompts}
      savedPromptIds={savedPromptIds}
      toggleSavePrompt={actions.toggleSavePrompt}
      onPromptClick={(id) => {
        actions.handlePromptClick(id);
        navigate(`/prompt/${id}`);
      }}
      onEditProfile={handleEditProfile}
      onSubmitPromptClick={handleSubmitPrompt}
      onExploreClick={handleExplore}
    />
  );
}
