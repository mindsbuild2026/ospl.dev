/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Zap,
  GitBranch,
  Coins,
  ShieldCheck,
  Award,
  Code2,
  Quote,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import OsplLogo from './OsplLogo';

export default function WhyPromptHub() {
  const features = [
    {
      title: "Cure the 'Blank Page' Syndrome",
      description: "Skip the trial and error. Grab copy-paste, battle-tested solutions that get the best results instantly without knowing advanced prompt engineering.",
      icon: Zap,
      color: "bg-amber-100/50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200/20"
    },
    {
      title: "Complex Workflow Bundles",
      description: "Go beyond single prompts. Access chained prompt sequences that take you from raw data to a finished product, step-by-step.",
      icon: GitBranch,
      color: "bg-blue-100/50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200/20"
    },
    {
      title: "Token & Cost Efficiency",
      description: "Poorly engineered prompts waste tokens. Use highly-optimized instructions that save API costs and reduce latency for your business.",
      icon: Coins,
      color: "bg-emerald-100/50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200/20"
    },
    {
      title: "Beat 'Model Drift'",
      description: "Prompts break when models update. We categorize strictly by model version (GPT-4o, Claude 3.5) with community voting for 'Still Working' or 'Broken'.",
      icon: ShieldCheck,
      color: "bg-purple-100/50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200/20"
    },
    {
      title: "High Signal, Zero Noise",
      description: "No generic 'Act as a writer' fluff. Our reputation system ensures only professional, high-value prompts from advanced engineers rise to the top.",
      icon: Award,
      color: "bg-rose-100/50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400 border-rose-200/20"
    },
    {
      title: "Variable Placeholders",
      description: "Stop editing messy blocks of text. Use clean UI inputs to easily customize dynamic variables like [Role], [Tone], and [Topic] before copying.",
      icon: Code2,
      color: "bg-indigo-100/50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 border-indigo-200/20"
    }
  ];

  return (
    <section className="py-20 border-b border-neutral-100 dark:border-neutral-900/60 select-none">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-4xl mx-auto mb-16 space-y-4">
          <span className="px-3.5 py-1.5 bg-brand-accent/5 text-brand-accent border border-brand-accent/15 dark:border-brand-accent/25 rounded-full font-mono text-[10px] sm:text-[11px] font-bold uppercase tracking-wider w-max mx-auto block shadow-sm">
            The Professional Edge
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-brand-text dark:text-white tracking-tight leading-tight">
            Stop Wasting Tokens. <br className="hidden sm:block" />
            <span className="text-brand-accent dark:text-brand-accent-light">Start Building Workflows.</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 text-left font-sans text-sm sm:text-base text-neutral-500 dark:text-neutral-400 leading-relaxed max-w-3xl mx-auto">
            <p>
              Basic prompts are no longer enough. Businesses and creators need verified, multi-step prompt sequences that actually work across the latest models without hallucinating or wasting API costs.
            </p>
            <p>
              OSPL is a curated ecosystem designed for professionals. Discover tightly engineered workflows, track model compatibility, and swap variables effortlessly.
            </p>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div
                key={idx}
                className="bg-white dark:bg-neutral-900/40 border border-neutral-200/60 dark:border-neutral-800/80 rounded-[28px] p-8 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-xl hover:border-brand-accent/40 dark:hover:border-brand-accent/40 transition-all duration-300 group hover:-translate-y-1.5 relative overflow-hidden"
              >
                {/* Subtle background glow effect on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-transparent to-neutral-50 dark:to-neutral-800/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                
                <div className="relative z-10">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border mb-6 ${feature.color} shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-display text-lg sm:text-xl font-bold text-brand-text dark:text-white mb-3 group-hover:text-brand-accent transition-colors">
                    {feature.title}
                  </h3>
                  <p className="font-sans text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Highlight Quote Card & Mission Statement */}
        <div className="bg-gradient-to-br from-neutral-50 to-white dark:from-neutral-900/60 dark:to-neutral-900/30 border border-neutral-200/60 dark:border-neutral-800/80 rounded-[32px] p-8 md:p-12 relative overflow-hidden flex flex-col lg:flex-row items-stretch justify-between gap-8 md:gap-12 shadow-sm">
          
          {/* Subtle decorative glow */}
          <div className="absolute left-1/4 top-1/2 w-72 h-72 bg-brand-accent/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2" />
          
          {/* Quote side */}
          <div className="flex-1 flex flex-col justify-between relative z-10">
            <div className="space-y-6">
              <div className="w-10 h-10 rounded-full bg-brand-accent/10 text-brand-accent flex items-center justify-center border border-brand-accent/20">
                <Quote className="w-4 h-4 fill-current" />
              </div>
              <blockquote className="font-display text-base sm:text-lg lg:text-xl italic font-medium text-neutral-700 dark:text-neutral-300 leading-relaxed">
                "The value of AI is no longer in basic prompts—it’s in vetted, reliable, and complex system instructions. OSPL curates the signal from the noise."
              </blockquote>
            </div>
            
            <div className="pt-8 flex items-center gap-4">
              <div className="w-11 h-11 rounded-full bg-brand-accent text-white flex items-center justify-center p-2 shadow-md">
                <OsplLogo className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-sans text-sm font-bold text-brand-text dark:text-white uppercase tracking-wide">
                  OSPL Architecture
                </p>
                <p className="font-sans text-[12px] text-neutral-500 dark:text-neutral-400 font-medium">
                  Built for Professional Use Cases
                </p>
              </div>
            </div>
          </div>

          {/* Divider line for wide screen */}
          <div className="hidden lg:block w-px bg-neutral-200 dark:bg-neutral-800 self-stretch my-4" />

          {/* Mission Statement side */}
          <div className="w-full lg:w-[400px] bg-white dark:bg-neutral-950/90 border border-neutral-200/80 dark:border-neutral-800 rounded-[24px] p-7 sm:p-8 flex flex-col justify-center relative z-10 shadow-lg">
            <span className="flex items-center gap-2 font-mono text-[11px] font-bold text-brand-accent uppercase tracking-wider mb-5">
              <Sparkles className="w-4 h-4 text-brand-accent" />
              <span>The Next Level</span>
            </span>
            <h4 className="font-display text-xl sm:text-2xl font-black text-brand-text dark:text-white leading-tight mb-4">
              From Raw Data to Finished Product
            </h4>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6 leading-relaxed">
              Discover powerful workflows, utilize interactive playgrounds to test logic before copying, and deploy production-ready instructions instantly.
            </p>
            <button
              onClick={() => {
                const exploreEl = document.getElementById('explore_list');
                if (exploreEl) {
                  exploreEl.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="flex items-center gap-2 text-sm font-bold text-brand-accent hover:text-brand-accent-light transition-colors w-max group cursor-pointer"
            >
              Explore Verified Workflows 
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
          
        </div>
      </div>
    </section>
  );
}
