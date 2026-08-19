import React, { createContext, useContext, useMemo, useState } from 'react';
import { usePromptHub } from './usePromptHub';
import type { PromptHubActions, PromptHubState } from './usePromptHub';

interface PromptHubContextValue {
  state: PromptHubState;
  actions: PromptHubActions;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  isFeedbackModalOpen: boolean;
  openFeedbackModal: () => void;
  closeFeedbackModal: () => void;
}

const PromptHubContext = createContext<PromptHubContextValue | undefined>(undefined);

export function PromptHubProvider({ children }: { children: React.ReactNode }) {
  const promptHub = usePromptHub();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);

  const value = useMemo(
    () => ({
      ...promptHub,
      isAuthModalOpen,
      openAuthModal: () => setIsAuthModalOpen(true),
      closeAuthModal: () => setIsAuthModalOpen(false),
      isFeedbackModalOpen,
      openFeedbackModal: () => setIsFeedbackModalOpen(true),
      closeFeedbackModal: () => setIsFeedbackModalOpen(false),
    }),
    [promptHub, isAuthModalOpen, isFeedbackModalOpen],
  );

  return <PromptHubContext.Provider value={value}>{children}</PromptHubContext.Provider>;
}

export function usePromptHubContext() {
  const context = useContext(PromptHubContext);
  if (!context) {
    throw new Error('usePromptHubContext must be used within a PromptHubProvider');
  }
  return context;
}
