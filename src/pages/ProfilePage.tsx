import { useNavigate } from 'react-router-dom';
import ProfileView from '../components/ProfileView';
import { usePromptHubContext } from '../hooks/PromptHubContext';

export default function ProfilePage() {
  const { state, actions } = usePromptHubContext();
  const navigate = useNavigate();

  return (
    <ProfileView
      user={state.user}
      author={state.author}
      onBack={() => navigate('/explore')}
      updateAuthorProfile={actions.updateAuthorProfile}
    />
  );
}
