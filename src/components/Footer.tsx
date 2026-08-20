/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useNavigate } from 'react-router-dom';
import { Category } from '../types';

interface FooterProps {
  categories: Category[];
  setSelectedCategoryFilter: (category: string | null) => void;
  setSelectedPromptId: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
  onFeedbackClick?: () => void;
}

export default function Footer({
  categories,
  setSelectedCategoryFilter,
  setSelectedPromptId,
  setSearchQuery,
  onFeedbackClick,
}: FooterProps) {
  const navigate = useNavigate();

  const handleLogoClick = () => {
    setSelectedCategoryFilter(null);
    setSelectedPromptId(null);
    setSearchQuery('');
    navigate('/explore');
  };

  const seoPaths = categories.map((category) => ({
    slug: category.slug,
    label: `${category.name} Prompts`,
  }));

  return (
    <footer className="w-full mt-auto bg-white dark:bg-[#09090b] border-t border-neutral-100 dark:border-neutral-900 py-12 px-4 md:px-8 relative z-10 transition-colors duration-300 pb-24">
      <div className="max-w-7xl mx-auto space-y-10">
        <div className="border-b border-neutral-100 dark:border-neutral-900/60 pb-8 select-none">
          <span className="font-sans text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider block mb-4 text-center md:text-left">
            Popular Directories & SEO Channels
          </span>

          <div className="flex flex-wrap justify-center md:justify-start gap-3">
            {seoPaths.map((path) => (
              <button
                key={path.slug}
                onClick={() => {
                  setSelectedCategoryFilter(null);
                  setSelectedPromptId(null);
                  setSearchQuery('');
                  navigate(`/category/${path.slug}`);
                }}
                className="font-sans text-[13px] font-medium text-neutral-600 dark:text-neutral-300 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:bg-brand-accent hover:text-white hover:border-brand-accent dark:hover:bg-brand-accent dark:hover:text-white dark:hover:border-brand-accent px-3 py-1.5 rounded-full transition-all duration-200 ease-in-out hover:scale-[1.03] active:scale-95 focus:outline-none focus:ring-2 focus:ring-brand-accent/50 cursor-pointer"
              >
                {path.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div
            onClick={handleLogoClick}
            className="font-display text-xl font-extrabold text-brand-text dark:text-brand-text-dark tracking-tight cursor-pointer transition-colors hover:text-brand-accent flex items-center gap-2"
          >
            <div className="w-7 h-7 bg-brand-accent rounded-full flex items-center justify-center text-white text-xs font-black">
              P
            </div>
            <span>PromptHub</span>
          </div>

          <nav className="flex flex-wrap justify-center gap-6 text-xs font-sans font-bold tracking-wider text-neutral-500 dark:text-neutral-400">
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="hover:text-brand-accent transition-colors"
            >
              GITHUB
            </a>
            <a href="#" className="hover:text-brand-accent transition-colors">
              DOCUMENTATION
            </a>
            {onFeedbackClick && (
              <button
                onClick={onFeedbackClick}
                className="hover:text-brand-accent transition-colors bg-none border-none cursor-pointer p-0 font-sans text-xs font-bold tracking-wider text-purple-600 dark:text-purple-400"
              >
                FEEDBACK
              </button>
            )}
            <button
              onClick={() => navigate('/privacy-policy')}
              className="hover:text-brand-accent transition-colors bg-none border-none cursor-pointer p-0 font-sans text-xs font-bold tracking-wider"
            >
              PRIVACY
            </button>
            <button
              onClick={() => navigate('/terms-and-conditions')}
              className="hover:text-brand-accent transition-colors bg-none border-none cursor-pointer p-0 font-sans text-xs font-bold tracking-wider"
            >
              TERMS OF SERVICE
            </button>
          </nav>

          <div className="text-[11px] text-neutral-400 dark:text-neutral-500 font-mono tracking-wide md:text-right flex flex-col md:items-end gap-1">
            <span>© {new Date().getFullYear()} PROMPTHUB. ALL RIGHTS RESERVED.</span>
            <span className="font-sans text-xs text-neutral-500 dark:text-neutral-400 font-medium">
              Built by{' '}
              <a
                href="https://www.mindsbuild.com"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-neutral-700 dark:text-neutral-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
              >
                MindsBuild
              </a>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
