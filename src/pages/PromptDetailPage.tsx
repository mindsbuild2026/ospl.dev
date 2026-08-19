import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PromptDetailView from '../components/PromptDetailView';
import { usePromptHubContext } from '../hooks/PromptHubContext';
import { LoadingSpinner, ErrorAlert } from '../components/shared';

export default function PromptDetailPage() {
  const { state, actions } = usePromptHubContext();
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) return;
    actions.setSelectedPromptId(id);
    actions.setSelectedCollectionId(null);
  }, [actions, id]);

  if (state.isLoadingDetail) {
    return <LoadingSpinner label="Loading prompt details" />;
  }

  // Show error if present and not dismissed
  if (state.dbError && !state.isDbErrorDismissed) {
    return (
      <div className="max-w-3xl mx-auto py-24 px-6">
        <ErrorAlert
          message={state.dbError}
          title="Failed to Load Prompt"
          onDismiss={actions.dismissError}
          variant="page"
        />
        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/explore')}
            className="inline-block px-6 py-2 bg-brand-accent text-white rounded-lg hover:opacity-90 transition-opacity"
          >
            Back to Explore
          </button>
        </div>
      </div>
    );
  }

  if (!state.selectedPrompt) {
    return (
      <div className="max-w-3xl mx-auto py-24 px-6 text-center">
        <div className="mb-6">
          <div className="text-6xl mb-4">404</div>
          <h2 className="font-display text-3xl font-bold text-brand-text dark:text-white">Prompt not found</h2>
          <p className="text-sm text-neutral-500 mt-3">We couldn&apos;t find the prompt you&apos;re looking for.</p>
        </div>
        <button
          onClick={() => navigate('/explore')}
          className="inline-block px-6 py-2 bg-brand-accent text-white rounded-lg hover:opacity-90 transition-opacity"
        >
          Back to Explore
        </button>
      </div>
    );
  }

  return (
    <PromptDetailView
      prompt={state.selectedPrompt}
      allPrompts={[]}
      onBack={() => navigate('/explore')}
      onPromptClick={(nextId) => {
        actions.handlePromptClick(nextId);
        navigate(`/prompt/${nextId}`);
      }}
      isSaved={state.savedPromptIds.includes(state.selectedPrompt.id)}
      toggleSave={() => actions.toggleSavePrompt(state.selectedPrompt.id)}
      isAuthenticated={Boolean(state.user?.id)}
      onCopy={actions.handleCopyPrompt}
    />
  );
}
