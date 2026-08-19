import { useNavigate } from 'react-router-dom';
import ProfileView from '../components/ProfileView';
import { usePromptHubContext } from '../hooks/PromptHubContext';

export default function SettingsPage() {
  const { state, actions } = usePromptHubContext();
  const navigate = useNavigate();

  return (
    <ProfileView
      user={state.user}
      author={state.author}
      onBack={() => navigate('/')}
      updateAuthorProfile={actions.updateAuthorProfile}
    />
  );
}
