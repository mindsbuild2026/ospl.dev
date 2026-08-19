import { useNavigate } from 'react-router-dom';
import SubmitPromptView from '../components/SubmitPromptView';
import { usePromptHubContext } from '../hooks/PromptHubContext';

export default function SubmitPromptPage() {
  const { state, actions, openAuthModal } = usePromptHubContext();
  const navigate = useNavigate();

  return (
    <SubmitPromptView
      onCancel={() => {
        actions.onSubmitClick();
        navigate('/explore');
      }}
      onSubmitPrompt={async (payload) => {
        const createdId = await actions.publishPrompt(payload);
        navigate(`/prompt/${createdId}`);
        return createdId;
      }}
      user={state.user}
      author={state.author}
      onSignInClick={() => openAuthModal()}
    />
  );
}
