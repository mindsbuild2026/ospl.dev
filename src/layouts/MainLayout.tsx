import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { usePromptHubContext } from '../hooks/PromptHubContext';
import { useScrollToTop } from '../hooks/useScrollToTop';
import Header from '../components/Header';
import Footer from '../components/Footer';
import FloatingSubmitBtn from '../components/FloatingSubmitBtn';
import AuthModal from '../components/AuthModal';
import { ErrorAlert, LoadingSpinner } from '../components/shared';

export default function MainLayout() {
  const { state, actions, isAuthModalOpen, openAuthModal, closeAuthModal } = usePromptHubContext();
  const location = useLocation();
  const navigate = useNavigate();

  // Scroll to top when pathname changes (but not on search/filter query string changes)
  useScrollToTop();

  // Only show initial loader for bootstrapping, not for auth loading
  // Auth loading is handled per route (ProtectedRoute/PublicRoute)
  const showInitialLoader = state.isBootstrapping;
  const hideFloatingButton = location.pathname === '/submit';

  return (
    <div className="font-sans antialiased bg-brand-bg dark:bg-brand-bg-dark text-brand-text dark:text-brand-text-dark min-h-screen flex flex-col transition-colors duration-300">
      <Header
        setSelectedCategoryFilter={actions.setSelectedCategoryFilter}
        setSelectedPromptId={actions.setSelectedPromptId}
        setSelectedCollectionId={actions.setSelectedCollectionId}
        setSearchQuery={actions.setSearchQuery}
        theme={state.theme}
        toggleTheme={actions.handleToggleTheme}
        onSubmitClick={() => {
          actions.onSubmitClick();
          navigate('/submit');
        }}
        onViewSavedCollections={() => {
          actions.viewSavedCollections();
          navigate('/saved');
        }}
        savedCount={state.savedPromptIds.length}
        user={state.user}
        author={state.author}
        onSignInClick={() => openAuthModal()}
        onSignOutClick={actions.signOut}
      />

      {state.dbError && !state.isDbErrorDismissed && (
        <ErrorAlert
          message={state.dbError}
          title="Data status"
          onDismiss={actions.dismissError}
          variant="banner"
        />
      )}

      <main className="flex-1 pt-20 flex flex-col">
        {showInitialLoader ? <LoadingSpinner label="Loading application data" /> : <Outlet />}
      </main>

      <Footer
        categories={state.categories}
        setSelectedCategoryFilter={actions.setSelectedCategoryFilter}
        setSelectedPromptId={actions.setSelectedPromptId}
        setSearchQuery={actions.setSearchQuery}
      />

      {!hideFloatingButton && (
        <FloatingSubmitBtn
          onClick={() => {
            actions.onSubmitClick();
            navigate('/submit');
          }}
        />
      )}

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={closeAuthModal}
        signInWithGithub={actions.signInWithGithub}
      />
    </div>
  );
}
