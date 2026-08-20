/**
 * SubmissionSuccessPage Page Component
 * Handles post-submission routing and loading state for /submission-success/:id
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SubmissionSuccessView from '../components/SubmissionSuccessView';
import { usePromptHubContext } from '../hooks/PromptHubContext';
import { fetchPromptDetail } from '../lib/promptRepository';
import { Prompt } from '../types';
import { LoadingSpinner, ErrorAlert } from '../components/shared';

export default function SubmissionSuccessPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state } = usePromptHubContext();

  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      navigate('/explore');
      return;
    }

    let isMounted = true;

    // Check if prompt is already in state
    if (state.selectedPrompt && state.selectedPrompt.id === id) {
      setPrompt(state.selectedPrompt);
      setIsLoading(false);
      return;
    }

    // Otherwise fetch directly from backend to support browser refreshes
    setIsLoading(true);
    fetchPromptDetail(id)
      .then((data) => {
        if (!isMounted) return;
        if (data) {
          setPrompt(data);
        } else {
          setError('Submission record not found.');
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.warn('[SubmissionSuccessPage] Error loading prompt submission:', err);
        setError('Unable to load submission details.');
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [id, navigate, state.selectedPrompt]);

  if (isLoading) {
    return <LoadingSpinner label="Loading submission status..." />;
  }

  if (error || !prompt) {
    return (
      <div className="max-w-3xl mx-auto py-24 px-6 text-center">
        <ErrorAlert
          message={error || 'Unable to display submission confirmation.'}
          title="Submission Confirmation"
        />
        <div className="mt-6 flex justify-center gap-4">
          <button
            onClick={() => navigate('/explore')}
            className="px-6 py-2.5 bg-purple-600 text-white font-bold text-xs rounded-xl hover:bg-purple-700 transition"
          >
            Go to Explore
          </button>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 font-bold text-xs rounded-xl hover:bg-neutral-200 transition"
          >
            My Submissions
          </button>
        </div>
      </div>
    );
  }

  return (
    <SubmissionSuccessView
      prompt={prompt}
      onGoToExplore={() => navigate('/explore')}
      onViewMySubmissions={() => navigate('/')}
    />
  );
}
