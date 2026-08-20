import { useNavigate } from 'react-router-dom';
import SubmitPromptView from '../components/SubmitPromptView';
import { usePromptHubContext } from '../hooks/PromptHubContext';

export default function SubmitPromptPage() {
  const { state, actions, openAuthModal } = usePromptHubContext();
  const navigate = useNavigate();

  const isAdmin = state.author?.is_admin === true;

  return (
    <SubmitPromptView
      onCancel={() => {
        actions.onSubmitClick();
        navigate('/explore');
      }}
      onSubmitPrompt={async (payload) => {
        const createdId = await actions.publishPrompt(payload);
        if (isAdmin) {
          navigate(`/prompt/${createdId}`);
        } else {
          navigate(`/submission-success/${createdId}`);
        }
        return createdId;
      }}
      user={state.user}
      author={state.author}
      onSignInClick={() => openAuthModal()}
    />
  );
}
