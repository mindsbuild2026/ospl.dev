import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SavedCollectionsView from '../components/SavedCollectionsView';
import { usePromptHubContext } from '../hooks/PromptHubContext';

export default function SavedPromptsPage() {
  const { state, actions } = usePromptHubContext();
  const navigate = useNavigate();

  useEffect(() => {
    actions.viewSavedCollections();
  }, [actions]);

  return (
    <SavedCollectionsView
      prompts={state.savedPrompts}
      savedCount={state.savedPromptIds.length}
      isLoading={state.isLoadingSavedCollections}
      error={state.dbError}
      onBack={() => navigate('/explore')}
      onPromptClick={(id) => {
        actions.handlePromptClick(id);
        navigate(`/prompt/${id}`);
      }}
    />
  );
}
