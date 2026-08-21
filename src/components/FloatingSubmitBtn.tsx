/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Plus } from 'lucide-react';

interface FloatingSubmitBtnProps {
  onClick: () => void;
  isVisible?: boolean;
}

export default function FloatingSubmitBtn({ onClick, isVisible = true }: FloatingSubmitBtnProps) {
  return (
    <button
      id="floating-submit-btn"
      onClick={onClick}
      className={`fixed bottom-6 right-6 z-40 flex items-center gap-2 bg-brand-accent hover:bg-brand-hover text-white px-5 py-3.5 rounded-full font-sans font-bold text-xs uppercase tracking-wider transition-all duration-300 shadow-lg shadow-brand-accent/20 hover:shadow-brand-accent/30 hover:-translate-y-1 active:translate-y-0 active:scale-95 cursor-pointer border border-brand-accent/10 ${
        isVisible
          ? 'opacity-100 translate-y-0 pointer-events-auto scale-100'
          : 'opacity-0 translate-y-10 pointer-events-none scale-90'
      }`}
      aria-label="Submit a Prompt"
    >
      <Plus className="w-4 h-4" />
      <span>Submit Prompt</span>
    </button>
  );
}
