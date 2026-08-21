import { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { usePromptHubContext } from '../hooks/PromptHubContext';
import { useScrollToTop } from '../hooks/useScrollToTop';
import Header from '../components/Header';
import Footer from '../components/Footer';
import FloatingSubmitBtn from '../components/FloatingSubmitBtn';
import AuthModal from '../components/AuthModal';
import FeedbackModal from '../components/feedback/FeedbackModal';
import FeedbackButton from '../components/feedback/FeedbackButton';
import { ErrorAlert, LoadingSpinner } from '../components/shared';

export default function MainLayout() {
  const {
    state,
    actions,
    isAuthModalOpen,
    openAuthModal,
    closeAuthModal,
    isFeedbackModalOpen,
    openFeedbackModal,
    closeFeedbackModal,
  } = usePromptHubContext();
  const location = useLocation();
  const navigate = useNavigate();

  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [showFloatingWidgets, setShowFloatingWidgets] = useState(false);

  useEffect(() => {
    let lastScrollY = window.scrollY;
    let ticking = false;

    const updateScrollState = () => {
      const currentScrollY = window.scrollY;
      const scrollDiff = currentScrollY - lastScrollY;

      // 1. Header auto-hide: Hide when scrolling down past 80px, reappear when scrolling up or at top
      if (currentScrollY <= 20) {
        setIsHeaderVisible(true);
      } else if (scrollDiff > 4 && currentScrollY > 80) {
        setIsHeaderVisible(false); // Scrolling down -> hide header
      } else if (scrollDiff < -4) {
        setIsHeaderVisible(true); // Scrolling up -> show header
      }

      // 2. Bottom corner floating widget: Appear ONLY if scrolling down / scrolled past top threshold
      if (currentScrollY > 150) {
        if (scrollDiff > 2) {
          setShowFloatingWidgets(true);
        }
      } else {
        setShowFloatingWidgets(false);
      }

      lastScrollY = currentScrollY;
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateScrollState);
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

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
        searchQuery={state.searchQuery}
        isVisible={isHeaderVisible}
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
        onFeedbackClick={openFeedbackModal}
      />

      {!hideFloatingButton && (
        <>
          <FloatingSubmitBtn
            onClick={() => {
              actions.onSubmitClick();
              navigate('/submit');
            }}
            isVisible={showFloatingWidgets}
          />
          <FeedbackButton
            onClick={openFeedbackModal}
            isVisible={showFloatingWidgets}
          />
        </>
      )}

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={closeAuthModal}
        signInWithGithub={actions.signInWithGithub}
      />

      <FeedbackModal
        isOpen={isFeedbackModalOpen}
        onClose={closeFeedbackModal}
        user={state.user}
        authorName={state.author?.name}
      />
    </div>
  );
}

