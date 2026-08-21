/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Mail, Check, Bell, Sparkles, Send } from 'lucide-react';

interface NewsletterSubscribeProps {
  totalCopies?: number;
}

export default function NewsletterSubscribe({ totalCopies = 0 }: NewsletterSubscribeProps) {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const practitionerCount = totalCopies > 0 ? (totalCopies * 3 + 250).toLocaleString() : '500+';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim() && email.includes('@')) {
      setSubmitted(true);
      setEmail('');
      setTimeout(() => setSubmitted(false), 5000);
    }
  };

  return (
    <section className="py-16 md:py-20 select-none">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="bg-brand-text dark:bg-neutral-900 border border-brand-text/10 dark:border-neutral-800 rounded-[32px] p-8 md:p-14 text-white relative overflow-hidden">
          
          {/* Circular color background accent bubble */}
          <div className="absolute left-1/3 top-1/2 w-80 h-80 bg-brand-accent/20 rounded-full blur-[80px] pointer-events-none -translate-y-1/2" />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center relative z-10">
            
            {/* Context Columns */}
            <div className="space-y-6">
              <span className="px-3.5 py-1.5 bg-white/10 text-white font-mono text-[10px] sm:text-[11px] font-bold uppercase tracking-wider rounded-full flex items-center gap-2 w-max border border-white/5">
                <Bell className="w-3.5 h-3.5 text-brand-hover animate-pulse" />
                <span>WEEKLY SYSTEM DROP</span>
              </span>

              <h3 className="font-display text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
                Unlock specialized system guides directly in your inbox
              </h3>

              <p className="font-sans text-sm sm:text-base text-neutral-300 leading-relaxed max-w-xl">
                Join {practitionerCount}+ AI practitioners and prompt engineers getting curated weekly reports, alerts for new categories, and direct copyable system prompts.
              </p>

              <div className="space-y-3.5 pt-2">
                <div className="flex items-center gap-3 text-xs sm:text-sm font-medium text-neutral-200">
                  <div className="w-5 h-5 rounded-full bg-[#f3e8ff]/10 flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 text-brand-hover" />
                  </div>
                  <span>Weekly AI prompt updates & blueprint teardowns</span>
                </div>
                <div className="flex items-center gap-3 text-xs sm:text-sm font-medium text-neutral-200">
                  <div className="w-5 h-5 rounded-full bg-[#f3e8ff]/10 flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 text-brand-hover" />
                  </div>
                  <span>Instant alerts for trending categories and new models</span>
                </div>
                <div className="flex items-center gap-3 text-xs sm:text-sm font-medium text-neutral-200">
                  <div className="w-5 h-5 rounded-full bg-[#f3e8ff]/10 flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 text-brand-hover" />
                  </div>
                  <span>Curated collections of verified high-performing recipes</span>
                </div>
              </div>
            </div>

            {/* Email form column */}
            <div className="bg-white/5 border border-white/10 rounded-[28px] p-6 sm:p-8 backdrop-blur-md">
              <h4 className="font-display text-lg font-bold mb-3">Newsletter Subscription</h4>
              <p className="font-sans text-xs sm:text-[13px] text-neutral-300 mb-6 leading-relaxed">
                We respect your time. Expect 1 concise email per week. Zero spam, unsubscribe at any time.
              </p>

              {submitted ? (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-350 p-5 rounded-2xl flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                    <Check className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <h5 className="font-sans font-bold text-sm text-white mb-0.5">Subscription confirmed!</h5>
                    <p className="font-sans text-xs text-neutral-300 leading-relaxed">
                      Thank you for subscribing. The next drop arrives on Tuesday!
                    </p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="relative">
                    <Mail className="absolute left-4.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-neutral-400" />
                    <input
                      type="email"
                      required
                      placeholder="Enter your professional email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-neutral-900/50 hover:bg-neutral-900 border border-white/10 focus:border-white/30 rounded-2xl py-4 pl-12 pr-4 font-sans text-xs sm:text-sm text-white placeholder-neutral-500 transition-colors"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-4 bg-white text-black hover:bg-neutral-100 rounded-2xl font-sans font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer active:scale-95"
                  >
                    <span>Subscribe to weekly updates</span>
                    <Send className="w-3.5 h-3.5 shrink-0" />
                  </button>
                </form>
              )}
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}
