import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import AuthLayout from '../layouts/AuthLayout';
import ProtectedRoute from './ProtectedRoute';
import PublicRoute from './PublicRoute';
import AuthCallback from '../components/AuthCallback';
import { LoadingSpinner } from '../components/shared';

const DashboardPage = lazy(() => import('../pages/DashboardPage'));
const ExplorePage = lazy(() => import('../pages/ExplorePage'));
const CategoriesPage = lazy(() => import('../pages/CategoriesPage'));
const PromptDetailPage = lazy(() => import('../pages/PromptDetailPage'));
const SubmitPromptPage = lazy(() => import('../pages/SubmitPromptPage'));
const ProfilePage = lazy(() => import('../pages/ProfilePage'));
const SettingsPage = lazy(() => import('../pages/SettingsPage'));
const SavedPromptsPage = lazy(() => import('../pages/SavedPromptsPage'));
const SearchPage = lazy(() => import('../pages/SearchPage'));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'));
const PrivacyPolicyPage = lazy(() => import('../pages/PrivacyPolicyPage'));
const TermsPage = lazy(() => import('../pages/TermsPage'));
const CollectionDetailPage = lazy(() => import('../pages/CollectionDetailPage'));
const CommunityPage = lazy(() => import('../pages/CommunityPage'));
const CategoryPage = lazy(() => import('../pages/CategoryPage'));
const AdminModerationPage = lazy(() => import('../pages/AdminModerationPage'));
const SubmissionSuccessPage = lazy(() => import('../pages/SubmissionSuccessPage'));

export default function AppRoutes() {
  return (
    <Suspense fallback={<LoadingSpinner label="Loading page" />}>
      <Routes>
        <Route element={<MainLayout />}>
          <Route
            index
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="explore"
            element={
              <PublicRoute>
                <ExplorePage />
              </PublicRoute>
            }
          />
          <Route
            path="search"
            element={
              <PublicRoute>
                <SearchPage />
              </PublicRoute>
            }
          />
          <Route
            path="categories"
            element={
              <PublicRoute>
                <CategoriesPage />
              </PublicRoute>
            }
          />
          <Route
            path="category/:slug"
            element={
              <PublicRoute>
                <CategoryPage />
              </PublicRoute>
            }
          />
          <Route
            path="community"
            element={
              <PublicRoute>
                <CommunityPage />
              </PublicRoute>
            }
          />
          <Route
            path="prompt/:id"
            element={
              <PublicRoute>
                <PromptDetailPage />
              </PublicRoute>
            }
          />
          <Route
            path="collection/:id"
            element={
              <PublicRoute>
                <CollectionDetailPage />
              </PublicRoute>
            }
          />
          <Route
            path="submit"
            element={
              <ProtectedRoute>
                <SubmitPromptPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="submission-success/:id"
            element={
              <ProtectedRoute>
                <SubmissionSuccessPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="settings"
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="saved"
            element={
              <ProtectedRoute>
                <SavedPromptsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/moderation"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminModerationPage />
              </ProtectedRoute>
            }
          />
          <Route path="dashboard" element={<Navigate to="/" replace />} />
          <Route path="saved-collections" element={<Navigate to="/saved" replace />} />
          <Route
            path="privacy-policy"
            element={
              <PublicRoute>
                <PrivacyPolicyPage />
              </PublicRoute>
            }
          />
          <Route
            path="terms-and-conditions"
            element={
              <PublicRoute>
                <TermsPage />
              </PublicRoute>
            }
          />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
        <Route
          path="auth/callback"
          element={
            <AuthLayout>
              <AuthCallback />
            </AuthLayout>
          }
        />
      </Routes>
    </Suspense>
  );
}
