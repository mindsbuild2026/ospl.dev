import { ReactElement, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { usePromptHubContext } from '../hooks/PromptHubContext';
import { LoadingSpinner } from '../components/shared';

interface ProtectedRouteProps {
  children: ReactElement;
  requiredRole?: 'admin' | 'user';
}

export default function ProtectedRoute({ children, requiredRole = 'user' }: ProtectedRouteProps) {
  const {
    state: { user, author, isLoadingAuth },
    openAuthModal,
  } = usePromptHubContext();
  const location = useLocation();
  const [modalShown, setModalShown] = useState(false);

  // Show auth modal once when auth is done loading and user is not authenticated
  useEffect(() => {
    if (!isLoadingAuth && !user && !modalShown) {
      openAuthModal();
      setModalShown(true);
    }
  }, [isLoadingAuth, user, modalShown, openAuthModal]);

  // Still loading authentication - show spinner
  if (isLoadingAuth) {
    return <LoadingSpinner label="Checking authentication" />;
  }

  // Not authenticated - redirect to explore
  if (!user) {
    return <Navigate to="/explore" state={{ from: location }} replace />;
  }

  // Admin route but user is not admin
  if (requiredRole === 'admin' && (!author || !author.is_admin)) {
    return <Navigate to="/explore" state={{ from: location }} replace />;
  }

  // User is authenticated and authorized
  return children;
}
