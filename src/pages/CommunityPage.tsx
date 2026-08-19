import CommunityView from '../components/CommunityView';
import { usePromptHubContext } from '../hooks/PromptHubContext';

export default function CommunityPage() {
  const { state, actions } = usePromptHubContext();

  return (
    <CommunityView
      contributors={state.contributors}
      prompts={state.promptCards}
      onContributionClick={() => {
        actions.onSubmitClick();
      }}
    />
  );
}
