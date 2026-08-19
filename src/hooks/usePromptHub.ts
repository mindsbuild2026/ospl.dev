/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Hook for prompt app state and Supabase data loading.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import {
  Category,
  CollectionDetail,
  CollectionSummary,
  Contributor,
  FilterOptions,
  Prompt,
  PromptCard,
  PromptSubmissionPayload,
} from '../types';
import {
  fetchCategories,
  fetchCollections,
  fetchCollectionById,
  fetchFilterOptions,
  fetchPromptCards,
  fetchPromptCardsByIds,
  fetchPromptsByCollectionId,
  fetchPromptDetail,
  fetchTopContributors,
  incrementPromptView,
  updatePromptBookmark,
  incrementPromptCopy,
  ratePrompt,
  createPromptFromPayload,
} from '../lib/promptRepository';
import {
  signInWithGithub,
  signOut as signOutService,
  getCurrentUser,
  getCurrentSession,
  fetchAuthorProfile,
  upsertAuthorProfile,
  ensureAuthorProfileExists,
  onAuthStateChange,
  type AuthorProfile,
} from '../lib/authService';
import { validatePromptSubmission } from '../lib/validation';
import { supabase } from '../lib/supabase';
import {
  getUserSavedPromptIds,
  getUserSavedPrompts,
  savePromptToBackend,
  removeSavedPromptFromBackend,
} from '../lib/savedPromptsService';
import { useDebounce, useLocalStorage } from './index';
import { DEFAULT_PAGINATION_LIMIT, ERROR_MESSAGES } from '../lib/constants';
import { getUserFriendlyMessage } from '../lib/errors';

export interface PromptHubState {
  promptCards: PromptCard[];
  categories: Category[];
  collections: CollectionSummary[];
  contributors: Contributor[];
  filterOptions: FilterOptions;
  selectedPrompt: Prompt | null;
  selectedCollection: CollectionDetail | null;
  collectionPrompts: PromptCard[];
  savedPrompts: PromptCard[];
  selectedPromptId: string | null;
  selectedCollectionId: string | null;
  selectedCategoryFilter: string | null;
  searchQuery: string;
  theme: 'light' | 'dark';
  savedPromptIds: string[];
  isBootstrapping: boolean;
  isLoadingPrompts: boolean;
  isLoadingDetail: boolean;
  isLoadingSavedCollections: boolean;
  dbError: string | null;
  isDbErrorDismissed: boolean;
  user: User | null;
  author: AuthorProfile | null;
  isLoadingAuth: boolean;
}

export interface PromptHubActions {
  setSelectedCategoryFilter: (value: string | null) => void;
  setSelectedPromptId: (id: string | null) => void;
  setSelectedCollectionId: (id: string | null) => void;
  setSearchQuery: (value: string) => void;
  onSubmitClick: () => void;
  viewSavedCollections: () => void;
  toggleSavePrompt: (id: string) => void;
  handlePromptClick: (id: string) => void;
  handleCollectionClick: (collectionId: string) => void;
  handleCategorySelected: (categoryValue: string) => void;
  handleToggleTheme: () => void;
  dismissError: () => void;
  publishPrompt: (newPrompt: PromptSubmissionPayload) => Promise<string>;
  signInWithGithub: () => Promise<void>;
  signOut: () => Promise<void>;
  updateAuthorProfile: (profileData: Partial<AuthorProfile>) => Promise<void>;
  loadMorePrompts: () => void;
  submitRating: (promptId: string, rating: number) => Promise<void>;
  handleCopyPrompt: (id: string) => void; // ✅ 1. Added Action Signature
}

const emptyFilterOptions: FilterOptions = {
  tags: [],
  aiPlatforms: [],
  promptTypes: [],
  difficulties: [],
};

export function usePromptHub(): { state: PromptHubState; actions: PromptHubActions } {
  const [promptCards, setPromptCards] = useState<PromptCard[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [collections, setCollections] = useState<CollectionSummary[]>([]);
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>(emptyFilterOptions);
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [selectedCollection, setSelectedCollection] = useState<CollectionDetail | null>(null);
  const [collectionPrompts, setCollectionPrompts] = useState<PromptCard[]>([]);
  const [savedPrompts, setSavedPrompts] = useState<PromptCard[]>([]);
  const [selectedPromptId, setSelectedPromptIdState] = useState<string | null>(null);
  const [selectedCollectionId, setSelectedCollectionIdState] = useState<string | null>(null);
  const [selectedCategoryFilter, setSelectedCategoryFilterState] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [theme, setTheme] = useLocalStorage<'light' | 'dark'>('prompthub_theme', 'light');
  const [savedPromptIds, setSavedPromptIds] = useState<string[]>([]);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isLoadingPrompts, setIsLoadingPrompts] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isLoadingSavedCollections, setIsLoadingSavedCollections] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);
  const [isDbErrorDismissed, setIsDbErrorDismissed] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [author, setAuthor] = useState<AuthorProfile | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const loadUserAuthorProfile = useCallback(async (currentUser: User) => {
    setUser(currentUser);
    try {
      const { author: authorProfile, error } = await fetchAuthorProfile(currentUser.id);
      if (error) {
        console.error('[Auth] Failed to fetch author profile:', error);
        setAuthor(null);
        return;
      }
      let activeAuthor = authorProfile;
      if (!activeAuthor) {
        const { author: createdAuthor, error: createError } = await ensureAuthorProfileExists(currentUser);
        if (createError) {
          console.error('[Auth] Failed to create author profile:', createError);
          setAuthor(null);
          return;
        }
        activeAuthor = createdAuthor;
      }
      if (activeAuthor) {
        // const { session } = await getCurrentSession();
        // if (session) {
        //   console.log('--- Authentication Audit Logs ---' , activeAuthor);
        //   console.log('session.user.id:', session.user.id);
        //   console.log('session.user.email:', session.user.email);
        //   console.log('author.id:', activeAuthor.id);
        //   console.log('author.is_admin:', activeAuthor.is_admin);
        //   console.log('---------------------------------');
        // }
        setAuthor(activeAuthor);
      } else {
        setAuthor(null);
      }
    } catch (error) {
      console.error('[Auth] Failed to synchronize author profile:', error);
      setAuthor(null);
    }
  }, []);

  useEffect(() => {
    let active = true;
    const initializeAuth = async () => {
      try {
        const { user: currentUser } = await getCurrentUser();
        if (!active) return;
        if (currentUser) {
          await loadUserAuthorProfile(currentUser);
        } else {
          setUser(null);
          setAuthor(null);
        }
      } catch (error) {
        console.error('[Auth] Failed to initialize auth:', error);
      } finally {
        if (active) setIsLoadingAuth(false);
      }
    };
    initializeAuth();

    const unsubscribe = onAuthStateChange(async (currentUser) => {
      if (!active) return;
      if (currentUser) {
        await loadUserAuthorProfile(currentUser);
      } else {
        setUser(null);
        setAuthor(null);
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [loadUserAuthorProfile]);

  const loadMetadata = useCallback(async () => {
    setIsBootstrapping(true);
    setDbError(null);
    try {
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Database network timeout. Displaying application state.')), 5000)
      );

      const fetchPromise = Promise.all([
        fetchCategories(),
        fetchCollections(),
        fetchTopContributors(8),
        fetchFilterOptions(),
      ]);

      const [nextCategories, nextCollections, nextContributors, nextFilterOptions] = (await Promise.race([
        fetchPromise,
        timeoutPromise,
      ])) as [Category[], CollectionSummary[], Contributor[], FilterOptions];

      setCategories(nextCategories);
      setCollections(nextCollections);
      setContributors(nextContributors);
      setFilterOptions(nextFilterOptions);
    } catch (error) {
      console.warn('[usePromptHub] Metadata load warning:', error);
      setDbError(getUserFriendlyMessage(error));
    } finally {
      setIsBootstrapping(false);
    }
  }, []);

  useEffect(() => {
    loadMetadata();
  }, [loadMetadata]);

  useEffect(() => {
    let cancelled = false;
    const loadPrompts = async () => {
      setIsLoadingPrompts(true);
      try {
        const category = selectedCategoryFilter
          ? categories.find((item) => [item.id, item.name, item.slug].includes(selectedCategoryFilter))
          : undefined;
        const nextPrompts = await fetchPromptCards({
          search: debouncedSearchQuery === 'saved_items_filter_special' ? undefined : debouncedSearchQuery,
          categorySlug: category?.slug,
          categoryId: category?.id,
          sortBy: 'trending',
          limit: debouncedSearchQuery === 'saved_items_filter_special' ? 500 : DEFAULT_PAGINATION_LIMIT,
        });
        if (cancelled) return;
        setPromptCards(nextPrompts);
      } catch (error) {
        if (cancelled) return;
        setDbError(getUserFriendlyMessage(error) || ERROR_MESSAGES.UNABLE_TO_LOAD_PROMPTS);
        setPromptCards([]);
      } finally {
        if (!cancelled) setIsLoadingPrompts(false);
      }
    };

    if (!isBootstrapping) {
      loadPrompts();
    }
    return () => {
      cancelled = true;
    };
  }, [debouncedSearchQuery, isBootstrapping, selectedCategoryFilter, categories]);

  useEffect(() => {
    let cancelled = false;
    const loadPromptDetail = async () => {
      if (!selectedPromptId) {
        setSelectedPrompt((prev) => (prev !== null ? null : prev));
        return;
      }
      setIsLoadingDetail(true);
      setSelectedPrompt((prev) => (prev !== null ? null : prev));
      try {
        const detail = await fetchPromptDetail(selectedPromptId);
        if (cancelled) return;
        setSelectedPrompt(detail);
      } catch (error) {
        if (cancelled) return;
        setDbError(getUserFriendlyMessage(error) || ERROR_MESSAGES.UNABLE_TO_LOAD_DETAILS);
      } finally {
        if (!cancelled) setIsLoadingDetail(false);
      }
    };
    loadPromptDetail();
    return () => {
      cancelled = true;
    };
  }, [selectedPromptId]);

  useEffect(() => {
    let cancelled = false;
    const loadCollectionDetail = async () => {
      if (!selectedCollectionId) {
        setSelectedCollection((prev) => (prev !== null ? null : prev));
        setCollectionPrompts((prev) => (prev.length > 0 ? [] : prev));
        return;
      }
      setIsLoadingDetail(true);
      setSelectedCollection((prev) => (prev !== null ? null : prev));
      setCollectionPrompts((prev) => (prev.length > 0 ? [] : prev));
      try {
        const [collection, prompts] = await Promise.all([
          fetchCollectionById(selectedCollectionId),
          fetchPromptsByCollectionId(selectedCollectionId),
        ]);
        if (cancelled) return;
        setSelectedCollection(collection);
        setCollectionPrompts(prompts);
      } catch (error) {
        if (cancelled) return;
        setDbError(getUserFriendlyMessage(error) || ERROR_MESSAGES.UNABLE_TO_LOAD_DETAILS);
      } finally {
        if (!cancelled) setIsLoadingDetail(false);
      }
    };
    loadCollectionDetail();
    return () => {
      cancelled = true;
    };
  }, [selectedCollectionId]);

  // Sync backend saved prompts for authenticated user
  useEffect(() => {
    let cancelled = false;
    const syncSavedPrompts = async () => {
      if (!user?.id) {
        setSavedPromptIds([]);
        setSavedPrompts([]);
        return;
      }
      setIsLoadingSavedCollections(true);
      try {
        const [ids, prompts] = await Promise.all([
          getUserSavedPromptIds(user.id),
          getUserSavedPrompts(user.id),
        ]);
        if (cancelled) return;
        setSavedPromptIds(ids);
        setSavedPrompts(prompts);
      } catch (error) {
        if (cancelled) return;
        console.error('[usePromptHub] Failed to fetch saved prompts from backend:', error);
        setDbError(getUserFriendlyMessage(error) || ERROR_MESSAGES.UNABLE_TO_LOAD_PROMPTS);
        setSavedPromptIds([]);
        setSavedPrompts([]);
      } finally {
        if (!cancelled) setIsLoadingSavedCollections(false);
      }
    };
    syncSavedPrompts();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
  }, [theme]);

  const setSelectedPromptId = useCallback((id: string | null) => {
    setSelectedPromptIdState(id);
    if (id === null) {
      setSelectedPrompt((prev) => (prev !== null ? null : prev));
    }
  }, []);

  const setSelectedCollectionId = useCallback((id: string | null) => {
    setSelectedCollectionIdState(id);
    if (id === null) {
      setSelectedCollection((prev) => (prev !== null ? null : prev));
      setCollectionPrompts((prev) => (prev.length > 0 ? [] : prev));
    }
  }, []);

  const setSelectedCategoryFilter = useCallback((value: string | null) => {
    setSelectedCategoryFilterState(value);
  }, []);

  const onSubmitClick = useCallback(() => {
    setSelectedPromptId(null);
    setSelectedCollectionId(null);
    setSelectedCategoryFilter(null);
    setSearchQuery('');
  }, [setSelectedCategoryFilter, setSelectedCollectionId, setSelectedPromptId]);

  const viewSavedCollections = useCallback(() => {
    setSelectedPromptId(null);
    setSelectedCollectionId(null);
    setSelectedCategoryFilter(null);
  }, [setSelectedCategoryFilter, setSelectedCollectionId, setSelectedPromptId]);

  const loadMorePrompts = useCallback(async () => {
    try {
      const category = selectedCategoryFilter
        ? categories.find((item) => [item.id, item.name, item.slug].includes(selectedCategoryFilter))
        : undefined;
      const nextPrompts = await fetchPromptCards({
        search: debouncedSearchQuery === 'saved_items_filter_special' ? undefined : debouncedSearchQuery,
        categorySlug: category?.slug,
        categoryId: category?.id,
        sortBy: 'trending',
        limit: DEFAULT_PAGINATION_LIMIT,
        offset: promptCards.length,
      });
      setPromptCards((prev) => [...prev, ...nextPrompts]);
    } catch (error) {
      setDbError(getUserFriendlyMessage(error) || ERROR_MESSAGES.UNABLE_TO_LOAD_PROMPTS);
    }
  }, [categories, debouncedSearchQuery, promptCards.length, selectedCategoryFilter]);

  const toggleSavePrompt = useCallback(
    async (id: string) => {
      if (!user?.id) {
        setDbError('Please sign in to save prompts to your backend favorites.');
        return;
      }

      const isSaved = savedPromptIds.includes(id);
      const prevSavedIds = savedPromptIds;

      // Optimistic UI state update
      const nextSavedIds = isSaved
        ? savedPromptIds.filter((pId) => pId !== id)
        : [...savedPromptIds, id];

      setSavedPromptIds(nextSavedIds);

      setPromptCards((previous) =>
        previous.map((prompt) =>
          prompt.id === id
            ? {
                ...prompt,
                stats: {
                  ...prompt.stats,
                  bookmarks: isSaved ? Math.max(0, prompt.stats.bookmarks - 1) : prompt.stats.bookmarks + 1,
                },
              }
            : prompt
        )
      );

      setSelectedPrompt((previous) =>
        previous && previous.id === id
          ? {
              ...previous,
              stats: {
                ...previous.stats,
                bookmarks: isSaved ? Math.max(0, previous.stats.bookmarks - 1) : previous.stats.bookmarks + 1,
              },
            }
          : previous
      );

      try {
        if (isSaved) {
          await removeSavedPromptFromBackend(user.id, id);
          setSavedPrompts((prev) => prev.filter((p) => p.id !== id));
        } else {
          await savePromptToBackend(user.id, id);
          const updatedSavedPrompts = await getUserSavedPrompts(user.id);
          setSavedPrompts(updatedSavedPrompts);
        }
      } catch (error) {
        console.error('[usePromptHub] Backend save/unsave mutation failed:', error);
        // Rollback optimistic state on failure
        setSavedPromptIds(prevSavedIds);
        setDbError(getUserFriendlyMessage(error) || 'Failed to sync saved prompt with backend.');
      }
    },
    [user?.id, savedPromptIds]
  );

  const handleToggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, [setTheme]);

  const handlePromptClick = useCallback((id: string) => {
    setDbError(null);
    setIsDbErrorDismissed(false);
    setSelectedPromptId(id);
    setPromptCards((prev) =>
      prev.map((prompt) => {
        if (prompt.id !== id) return prompt;
        return {
          ...prompt,
          stats: {
            ...prompt.stats,
            views: (prompt.stats?.views ?? 0) + 1,
          },
        };
      })
    );
    setSelectedPrompt((prev) => {
      if (!prev || prev.id !== id) return prev;
      return {
        ...prev,
        stats: {
          ...prev.stats,
          views: (prev.stats?.views ?? 0) + 1,
        },
      };
    });
    incrementPromptView(id).catch((error) => {
      console.warn('Failed to sync prompt view analytics:', getUserFriendlyMessage(error));
    });
  }, [setSelectedPromptId]);

  const handleCollectionClick = useCallback((collectionId: string) => {
    setDbError(null);
    setIsDbErrorDismissed(false);
    setSelectedCollectionId(collectionId);
    setSelectedPromptId(null);
  }, [setSelectedCollectionId, setSelectedPromptId]);

  const handleCategorySelected = useCallback((categoryValue: string) => {
    const category = categories.find((item) => [item.id, item.name, item.slug].includes(categoryValue));
    setSelectedCategoryFilter(category?.name || categoryValue);
    setSearchQuery('');
    setSelectedPromptId(null);
    setSelectedCollectionId(null);
  }, [categories, setSelectedCategoryFilter, setSelectedCollectionId, setSelectedPromptId]);

  // ✅ 2. IMPLEMENTED handleCopyPrompt
  const handleCopyPrompt = useCallback((id: string) => {
    incrementPromptCopy(id)
      .then((res) => {
        if (!res.success) return;

        setPromptCards((prev) =>
          prev.map((prompt) => {
            if (prompt.id !== id) return prompt;
            const updatedCopies = res.copies > 0 ? res.copies : (prompt.stats?.copies ?? 0) + 1;
            return {
              ...prompt,
              stats: {
                ...prompt.stats,
                copies: updatedCopies,
              },
            };
          })
        );

        setSelectedPrompt((prev) => {
          if (!prev || prev.id !== id) return prev;
          const updatedCopies = res.copies > 0 ? res.copies : (prev.stats?.copies ?? 0) + 1;
          return {
            ...prev,
            stats: {
              ...prev.stats,
              copies: updatedCopies,
            },
          };
        });
      })
      .catch((error) => {
        console.warn('Failed to sync prompt copy analytics:', getUserFriendlyMessage(error));
      });
  }, []);

  const publishPrompt = useCallback(async (newPrompt: PromptSubmissionPayload): Promise<string> => {
    const errors = validatePromptSubmission(newPrompt);
    if (errors.length > 0) {
      const errorMsg = errors.map((e) => e.message).join(' ');
      console.error('[publishPrompt] Submission aborted due to validation errors:', errors);
      setDbError(`Cannot publish prompt: ${errorMsg}`);
      throw new Error(`Validation Error: ${errorMsg}`);
    }
    try {
      const createdId = await createPromptFromPayload(newPrompt);
      const detail = await fetchPromptDetail(createdId);
      const refreshed = await fetchPromptCards({ limit: DEFAULT_PAGINATION_LIMIT, sortBy: 'Newest' });
      setPromptCards(refreshed);
      setSelectedPrompt(detail);
      setSelectedPromptId(createdId);
      return createdId;
    } catch (error) {
      setDbError(getUserFriendlyMessage(error) || ERROR_MESSAGES.UNABLE_TO_PUBLISH);
      throw error;
    }
  }, [setSelectedPromptId]);

  const dismissError = useCallback(() => {
    setIsDbErrorDismissed(true);
  }, []);

  const handleSignInWithGithub = useCallback(async () => {
    try {
      await signInWithGithub();
    } catch (error) {
      setDbError(getUserFriendlyMessage(error) || 'Failed to sign in with GitHub');
      throw error;
    }
  }, []);

  const handleSignOut = useCallback(async () => {
    try {
      const { error } = await signOutService();
      if (error) {
        throw error;
      }
      setUser(null);
      setAuthor(null);
      setSelectedPromptId(null);
      setSelectedCollectionId(null);
      setSelectedCategoryFilter(null);
      setSearchQuery('');
      setDbError(null);
    } catch (error) {
      setDbError(getUserFriendlyMessage(error) || 'Failed to sign out');
      throw error;
    }
  }, [setSelectedCategoryFilter, setSelectedCollectionId, setSelectedPromptId]);

  const handleUpdateAuthorProfile = useCallback(async (profileData: Partial<AuthorProfile>) => {
    if (!user) {
      throw new Error('User not authenticated');
    }
    try {
      const { author: updatedAuthor, error } = await upsertAuthorProfile(user.id, profileData);
      if (error) {
        throw error;
      }
      setAuthor(updatedAuthor);
    } catch (error) {
      setDbError(getUserFriendlyMessage(error) || 'Failed to update profile');
      throw error;
    }
  }, [user]);

  const submitRating = useCallback(async (promptId: string, rating: number) => {
    try {
      if (!user) {
        throw new Error('Must be authenticated to rate prompts');
      }
      if (rating < 1 || rating > 5) {
        throw new Error('Rating must be between 1 and 5');
      }
      const res = await ratePrompt(promptId, rating);
      console.log('[v0] Rating submitted successfully:', { promptId, rating, res });
      
      if (res && res.rating_count !== undefined) {
        setSelectedPrompt((previous) =>
          previous && previous.id === promptId
            ? {
                ...previous,
                stats: {
                  ...previous.stats,
                  rating: res.rating_average !== null && res.rating_average !== undefined ? Number(res.rating_average) : 0,
                  ratingCount: Number(res.rating_count),
                },
              }
            : previous
        );
      }
    } catch (error) {
      console.error('[v0] Failed to submit rating:', error);
      setDbError(getUserFriendlyMessage(error) || 'Failed to submit rating');
      throw error;
    }
  }, [user]);

  const state: PromptHubState = useMemo(
    () => ({
      promptCards,
      categories,
      collections,
      contributors,
      filterOptions,
      selectedPrompt,
      selectedCollection,
      collectionPrompts,
      savedPrompts,
      selectedPromptId,
      selectedCollectionId,
      selectedCategoryFilter,
      searchQuery,
      theme,
      savedPromptIds,
      isBootstrapping,
      isLoadingPrompts,
      isLoadingDetail,
      isLoadingSavedCollections,
      dbError,
      isDbErrorDismissed,
      user,
      author,
      isLoadingAuth,
    }),
    [
      promptCards,
      categories,
      collections,
      contributors,
      filterOptions,
      selectedPrompt,
      selectedCollection,
      collectionPrompts,
      savedPrompts,
      selectedPromptId,
      selectedCollectionId,
      selectedCategoryFilter,
      searchQuery,
      theme,
      savedPromptIds,
      isBootstrapping,
      isLoadingPrompts,
      isLoadingDetail,
      isLoadingSavedCollections,
      dbError,
      isDbErrorDismissed,
      user,
      author,
      isLoadingAuth,
    ]
  );

  const actions: PromptHubActions = useMemo(
    () => ({
      setSelectedCategoryFilter,
      setSelectedPromptId,
      setSelectedCollectionId,
      setSearchQuery,
      onSubmitClick,
      viewSavedCollections,
      toggleSavePrompt,
      handlePromptClick,
      handleCollectionClick,
      handleCategorySelected,
      handleToggleTheme,
      dismissError,
      publishPrompt,
      signInWithGithub: handleSignInWithGithub,
      signOut: handleSignOut,
      updateAuthorProfile: handleUpdateAuthorProfile,
      loadMorePrompts,
      submitRating,
      handleCopyPrompt, // ✅ 3. Exported in actions bundle
    }),
    [
      setSelectedCategoryFilter,
      setSelectedPromptId,
      setSelectedCollectionId,
      setSearchQuery,
      onSubmitClick,
      viewSavedCollections,
      toggleSavePrompt,
      handlePromptClick,
      handleCollectionClick,
      handleCategorySelected,
      handleToggleTheme,
      dismissError,
      publishPrompt,
      handleSignInWithGithub,
      handleSignOut,
      handleUpdateAuthorProfile,
      loadMorePrompts,
      submitRating,
      handleCopyPrompt, // Include in dependencies
    ]
  );

  return { state, actions };
}
