/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Search,
  Sun,
  Moon,
  Sparkles,
  Heart,
  Menu,
  X,
  LogIn,
  LogOut,
  Plus,
  User as UserIcon,
} from 'lucide-react';
import { User } from '@supabase/supabase-js';
import { LookupAuthor } from '../types';

interface HeaderProps {
  setSelectedCategoryFilter: (category: string | null) => void;
  setSelectedPromptId: (id: string | null) => void;
  setSelectedCollectionId: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  onSubmitClick: () => void;
  onViewSavedCollections: () => void;
  savedCount: number;
  user: User | null;
  author: LookupAuthor | null;
  onSignInClick: () => void;
  onSignOutClick: () => Promise<void>;
}

export default function Header({
  setSelectedCategoryFilter,
  setSelectedPromptId,
  setSelectedCollectionId,
  setSearchQuery,
  theme,
  toggleTheme,
  onSubmitClick,
  onViewSavedCollections,
  savedCount,
  user,
  author,
  onSignInClick,
  onSignOutClick,
}: HeaderProps) {
  const [localSearch, setLocalSearch] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const isAdmin = author?.is_admin === true;

  const path = location.pathname;
  const isExploreActive = path === '/explore' || path === '/search' || path.startsWith('/category/');
  const isCategoriesActive = path === '/categories';
  const isCommunityActive = path === '/community';
  const isDashboardActive = path === '/' || path === '/dashboard';

  const clearNavigationState = () => {
    setSelectedPromptId(null);
    setSelectedCollectionId(null);
    setSelectedCategoryFilter(null);
    setSearchQuery('');
    setLocalSearch('');
    setIsMobileMenuOpen(false);
  };

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedQuery = localSearch.trim();
    setSearchQuery(trimmedQuery);
    setSelectedPromptId(null);
    setSelectedCollectionId(null);
    setSelectedCategoryFilter(null);
    setIsMobileMenuOpen(false);
    if (trimmedQuery) {
      navigate(`/search?q=${encodeURIComponent(trimmedQuery)}`);
    } else {
      navigate('/explore');
    }
  };

  const navigateTo = (destination: string) => {
    clearNavigationState();
    navigate(destination);
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-20 z-50 bg-white/90 dark:bg-[#09090b]/90 backdrop-blur-md border-b border-neutral-100 dark:border-neutral-800/80 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 md:px-8 h-full flex items-center justify-between">
        <div
          onClick={() => navigateTo('/explore')}
          className="flex items-center gap-3 cursor-pointer group shrink-0"
        >
          <div className="w-9 h-9 bg-black dark:bg-white text-white dark:text-black flex items-center justify-center font-display font-black text-base rounded-xl transition-all group-hover:bg-brand-accent dark:group-hover:bg-brand-accent dark:group-hover:text-white shadow-sm">
            P
          </div>
          <div className="flex flex-col">
            <h1 className="font-display font-bold tracking-tight text-base text-brand-text dark:text-brand-text-dark leading-none">
              PromptHub
            </h1>
            <span className="text-[10px] text-brand-muted dark:text-brand-muted-dark font-medium mt-0.5">
              Open-Source Library
            </span>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-7">

          {user && (
            <>
              <button
                onClick={() => navigateTo('/')}
                className={`font-sans text-[15px] font-medium transition-colors relative py-1 cursor-pointer ${isDashboardActive
                  ? 'text-black dark:text-white font-bold'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white'
                  }`}
              >
                Dashboard
              </button>
            </>
          )}

          {isAdmin && (
            <button
              onClick={() => navigateTo('/admin/moderation')}
              className={`font-sans text-[15px] font-medium transition-colors relative py-1 cursor-pointer ${location.pathname.startsWith('/admin')
                ? 'text-brand-accent dark:text-brand-accent font-bold'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-brand-accent dark:hover:text-brand-accent'
                }`}
            >
              Admin
            </button>
          )}

          <button
            onClick={() => navigateTo('/explore')}
            className={`font-sans text-[15px] font-medium transition-colors relative py-1 cursor-pointer ${isExploreActive
              ? 'text-black dark:text-white font-bold'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white'
              }`}
          >
            Explore
          </button>

          <button
            onClick={() => navigateTo('/categories')}
            className={`font-sans text-[15px] font-medium transition-colors relative py-1 cursor-pointer ${isCategoriesActive
              ? 'text-black dark:text-white font-bold'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white'
              }`}
          >
            Categories
          </button>

          <button
            onClick={() => navigateTo('/community')}
            className={`font-sans text-[15px] font-medium transition-colors relative py-1 cursor-pointer ${isCommunityActive
              ? 'text-black dark:text-white font-bold'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white'
              }`}
          >
            Community
          </button>
        </nav>

        <div className="flex items-center gap-2.5 sm:gap-3.5">
          <form onSubmit={handleSearchSubmit} className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500" />
            <input
              type="text"
              placeholder="Search prompts..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="bg-neutral-50 dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800/80 text-brand-text dark:text-brand-text-dark placeholder:text-neutral-400/80 font-sans text-xs rounded-full py-2 pl-9 pr-4 w-48 lg:w-56 focus:outline-none focus:border-brand-accent transition-all text-ellipsis"
            />
          </form>

          {user && (
            <button
              onClick={() => {
                onViewSavedCollections();
                navigate('/saved');
              }}
              title="View saved prompts"
              className="p-2 border border-brand-accent/20 text-brand-accent bg-brand-accent/5 hover:bg-brand-accent/10 rounded-full transition-all relative cursor-pointer"
            >
              <Heart className="w-4 h-4 fill-brand-accent text-brand-accent" />
              <span className="absolute -top-1 -right-1 bg-brand-accent text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-sm">
                {savedCount}
              </span>
            </button>
          )}

          <button
            onClick={toggleTheme}
            className="p-2 text-neutral-500 hover:text-brand-accent hover:bg-neutral-50 dark:text-neutral-400 dark:hover:text-brand-accent dark:hover:bg-neutral-900 border border-neutral-200/55 dark:border-neutral-800 hover:border-brand-accent/50 dark:hover:border-brand-accent/50 rounded-full transition-colors cursor-pointer bg-transparent"
            title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          >
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>

          {user && (
            <button
              onClick={onSubmitClick}
              className="bg-black text-white dark:bg-white dark:text-black hover:bg-brand-accent dark:hover:bg-brand-accent dark:hover:text-white px-5 py-2.5 rounded-full font-sans font-bold text-xs uppercase tracking-wide transition-all duration-300 transform active:scale-95 cursor-pointer shadow-sm hover:shadow-brand-accent/10 hidden md:block"
            >
              Submit Prompt
            </button>
          )}

          {user ? (
            <div className="relative hidden md:block">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 p-1 rounded-full border border-neutral-200 dark:border-neutral-800 hover:border-brand-accent dark:hover:border-brand-accent transition-all cursor-pointer bg-transparent"
                title="Account menu"
              >
                {author?.avatar_url ? (
                  <img
                    src={author.avatar_url}
                    alt={author.name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 flex items-center justify-center font-display font-bold text-xs">
                    {author?.name?.slice(0, 2).toUpperCase() || 'U'}
                  </div>
                )}
              </button>
              {isUserMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setIsUserMenuOpen(false)}
                  />

                  <div className="absolute right-0 mt-2.5 w-56 rounded-2xl border border-neutral-200 bg-white p-2.5 shadow-xl dark:border-neutral-800 dark:bg-neutral-900 z-20 animate-in fade-in-50 slide-in-from-top-1 duration-150">

                    <div className="mb-1.5 border-b border-neutral-200 px-3 py-2 dark:border-neutral-800">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-xs font-bold text-neutral-900 dark:text-neutral-100">
                          {author?.name || 'Creator'}
                        </p>
                        {isAdmin && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-brand-accent/15 text-brand-accent border border-brand-accent/25 uppercase tracking-wide">
                            Admin
                          </span>
                        )}
                      </div>

                      <p className="mt-0.5 truncate text-[10px] font-medium text-neutral-500 dark:text-neutral-400">
                        {author?.handle || user.email}
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        navigate('/');
                        clearNavigationState();
                      }}
                      className="flex w-full cursor-pointer items-center gap-2 rounded-xl bg-transparent px-3 py-2 text-left text-xs font-semibold text-neutral-700 transition-colors hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      Dashboard
                    </button>

                    {isAdmin && (
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          navigate('/admin/moderation');
                          clearNavigationState();
                        }}
                        className="flex w-full cursor-pointer items-center gap-2 rounded-xl bg-transparent px-3 py-2 text-left text-xs font-semibold text-brand-accent transition-colors hover:bg-neutral-100 dark:text-brand-accent dark:hover:bg-neutral-800"
                      >
                        <Sparkles className="h-3.5 w-3.5 text-brand-accent" />
                        Admin
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        navigate('/profile');
                      }}
                      className="flex w-full cursor-pointer items-center gap-2 rounded-xl bg-transparent px-3 py-2 text-left text-xs font-semibold text-neutral-700 transition-colors hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
                    >
                      <UserIcon className="h-3.5 w-3.5" />
                      My Profile
                    </button>

                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onSubmitClick();
                      }}
                      className="flex w-full cursor-pointer items-center gap-2 rounded-xl bg-transparent px-3 py-2 text-left text-xs font-semibold text-neutral-700 transition-colors hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Submit a Prompt
                    </button>

                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onViewSavedCollections();
                        navigate('/saved');
                      }}
                      className="flex w-full cursor-pointer items-center gap-2 rounded-xl bg-transparent px-3 py-2 text-left text-xs font-semibold text-neutral-700 transition-colors hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
                    >
                      <Heart className="h-3.5 w-3.5" />
                      Saved Prompts
                    </button>

                    <div className="my-1.5 border-t border-neutral-200 dark:border-neutral-800" />

                    <button
                      onClick={async () => {
                        setIsUserMenuOpen(false);
                        await onSignOutClick();
                        navigate('/explore');
                      }}
                      className="flex w-full cursor-pointer items-center gap-2 rounded-xl bg-transparent px-3 py-2 text-left text-xs font-semibold text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <button
              onClick={onSignInClick}
              className="border border-neutral-300 dark:border-neutral-705 hover:border-brand-accent dark:hover:border-brand-accent hover:text-brand-accent dark:hover:text-brand-accent px-4 py-2.5 rounded-full font-sans font-bold text-xs uppercase tracking-wide transition-all duration-300 cursor-pointer hidden md:flex items-center gap-1.5 bg-transparent text-neutral-700 dark:text-neutral-300"
            >
              <LogIn className="w-3.5 h-3.5" />
              Login with GitHub
            </button>
          )}

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-neutral-500 hover:text-brand-accent hover:bg-neutral-50 dark:text-neutral-400 dark:hover:text-brand-accent dark:hover:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-full transition-colors cursor-pointer md:hidden bg-transparent"
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? <X className="w-4.5 h-4.5" /> : <Menu className="w-4.5 h-4.5" />}
          </button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-20 left-0 w-full bg-white dark:bg-[#09090b] border-b border-neutral-100 dark:border-neutral-800/80 shadow-xl overflow-hidden transition-all duration-300 z-50">
          <div className="px-6 py-6 flex flex-col gap-5">
            {user && author && (
              <div className="flex items-center gap-3 pb-4 border-b border-neutral-100 dark:border-neutral-800/80">
                {author.avatar_url ? (
                  <img
                    src={author.avatar_url}
                    alt={author.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-650 dark:text-neutral-350 flex items-center justify-center font-display font-bold text-sm">
                    {author.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="flex flex-col truncate">
                  <span className="text-sm font-bold text-neutral-900 dark:text-white leading-none">
                    {author.name}
                  </span>
                  <span className="text-[10px] text-neutral-500 mt-1.5 truncate">
                    {author.handle || user.email}
                  </span>
                </div>
              </div>
            )}

            <form onSubmit={handleSearchSubmit} className="relative w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />

              <input
                type="text"
                placeholder="Search prompts..."
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-brand-text dark:text-brand-text-dark placeholder:text-neutral-400 font-sans text-sm rounded-full py-3.5 pl-11 pr-11 focus:outline-none focus:border-brand-accent transition-colors"
              />

              {localSearch && (
                <button
                  type="button"
                  onClick={() => {
                    setLocalSearch("");
                    setSearchQuery("");
                  }}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-full text-neutral-400 hover:text-neutral-600 hover:bg-neutral-200 dark:hover:bg-neutral-800 dark:hover:text-neutral-200 transition-colors"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </form>

            <nav className="flex flex-col gap-3">
              <button
                onClick={() => navigateTo('/explore')}
                className={`text-left font-sans text-base font-semibold py-2.5 border-b border-neutral-50 dark:border-neutral-900 cursor-pointer bg-transparent border-0 ${isExploreActive ? 'text-brand-accent' : 'text-neutral-600 dark:text-neutral-450'
                  }`}
              >
                Explore Prompts
              </button>

              <button
                onClick={() => navigateTo('/categories')}
                className={`text-left font-sans text-base font-semibold py-2.5 border-b border-neutral-50 dark:border-neutral-900 cursor-pointer bg-transparent border-0 ${isCategoriesActive ? 'text-brand-accent' : 'text-neutral-600 dark:text-neutral-450'
                  }`}
              >
                Categories
              </button>

              <button
                onClick={() => navigateTo('/community')}
                className={`text-left font-sans text-base font-semibold py-2.5 border-b border-neutral-50 dark:border-neutral-900 cursor-pointer bg-transparent border-0 ${isCommunityActive ? 'text-brand-accent' : 'text-neutral-600 dark:text-neutral-450'
                  }`}
              >
                Trending Prompts
              </button>

              {user && (
                <>
                  <button
                    onClick={() => navigateTo('/')}
                    className={`text-left font-sans text-base font-semibold py-2.5 border-b border-neutral-50 dark:border-neutral-900 cursor-pointer bg-transparent border-0 ${isDashboardActive ? 'text-brand-accent' : 'text-neutral-600 dark:text-neutral-450'
                      }`}
                  >
                    Dashboard
                  </button>

                  {isAdmin && (
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        navigateTo('/admin/moderation');
                      }}
                      className="text-left font-sans text-base font-semibold py-2.5 border-b border-neutral-50 dark:border-neutral-900 cursor-pointer bg-transparent border-0 text-brand-accent"
                    >
                      Admin
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onViewSavedCollections();
                      navigate('/saved');
                    }}
                    className="text-left font-sans text-base font-semibold py-2.5 border-b border-neutral-50 dark:border-neutral-900 cursor-pointer bg-transparent border-0 text-neutral-600 dark:text-neutral-450"
                  >
                    Saved Collections
                  </button>

                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      navigate('/profile');
                    }}
                    className="text-left font-sans text-base font-semibold py-2.5 border-b border-neutral-50 dark:border-neutral-900 cursor-pointer bg-transparent border-0 text-neutral-600 dark:text-neutral-450"
                  >
                    My Profile
                  </button>

                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onSubmitClick();
                    }}
                    className="text-left font-sans text-base font-semibold py-2.5 border-b border-neutral-50 dark:border-neutral-900 cursor-pointer bg-transparent border-0 text-neutral-600 dark:text-neutral-450"
                  >
                    Submit a Prompt
                  </button>
                </>
              )}
            </nav>

            <div className="flex flex-col gap-2.5 pt-2">
              {user && (
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onSubmitClick();
                  }}
                  className="w-full bg-black text-white dark:bg-white dark:text-black hover:bg-brand-accent dark:hover:bg-brand-accent dark:hover:text-white py-3.5 rounded-full font-sans font-bold text-sm uppercase tracking-wide transition-all text-center cursor-pointer border-0"
                >
                  Submit a Prompt
                </button>
              )}

              {user ? (
                <button
                  onClick={async () => {
                    setIsMobileMenuOpen(false);
                    await onSignOutClick();
                    navigate('/explore');
                  }}
                  className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-250 dark:border-neutral-800 text-red-650 hover:bg-red-50/20 py-3.5 rounded-full font-sans font-bold text-sm uppercase tracking-wide transition-all text-center cursor-pointer"
                >
                  Sign Out
                </button>
              ) : (
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onSignInClick();
                  }}
                  className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-250 dark:border-neutral-805 text-neutral-900 dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-850 py-3.5 rounded-full font-sans font-bold text-sm uppercase tracking-wide transition-all text-center cursor-pointer"
                >
                  Login with GitHub
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
