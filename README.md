# OSPL — Open-Source Prompt Library

<div align="center">

![OSPL Banner](/public/android-chrome-512x512.png)

### The Free, Open-Source Prompt Library for Everyone.

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61dafb)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-6.4-646cff)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ecf8e)](https://supabase.com/)

[Explore OSPL](https://ospl.dev) • [Submit a Prompt](https://ospl.dev/submit) • [Documentation](#architecture--system-design)

</div>

---

## 🌟 Overview

**OSPL (Open-Source Prompt Library)** is a community-driven, free, and open-source platform designed to curate, version, test, and deploy high-quality AI system prompts, workflows, and instructions.

Built for AI engineers, prompt designers, developers, and creators, OSPL provides a production-grade library with zero paywalls or static placeholders—delivering real-time data, automated quality checks, and interactive template playgrounds across all major AI platforms (OpenAI, Anthropic Claude, Google Gemini, Meta Llama, Midjourney, and more).

---

## ✨ Key Features

### 🚀 1. Production-Ready Prompt Catalog
- **Dynamic Real-Time Data**: Live aggregation of prompt counts, view metrics, copy counts, and verified author profiles directly from Supabase PostgreSQL.
- **Multi-Platform Support**: Tailored tagging and formatting for OpenAI GPT-4o, Anthropic Claude 3.5, Google Gemini 1.5, Meta Llama 3, Midjourney v6, and general LLMs.
- **Interactive `{{variable}}` Parser**: Automatically detects double-curly brace variables (e.g. `{{target_audience}}`, `{{tech_stack}}`) in prompt text and dynamically generates live interactive user input forms.

### 📚 2. Dynamic Collections System
- **Dual Junction Table Support**: Dual-write and union querying across `collection_prompts` and `prompt_collections` ensures newly created prompt associations update instantly without data loss.
- **Real-Time Aggregation**: Aggregates distinct prompt counts per collection regardless of moderation status, maintaining instant feedback for creators.

### 🛡️ 3. Multi-Stage AI Moderation Engine
- **Automated Quality Verification**: Incoming submissions are evaluated for structure, clarity, parameter safety, and prompt quality score (0–100).
- **Admin Review Pipeline**: Moderation queue (`pending`, `approved`, `rejected`) with full admin dashboard interface (`/admin/moderation`).

### 🔍 4. Smart Search & Smooth Navigation
- **URL Synchronization**: Deep-linking search queries (`/search?q=query`) with browser history integration.
- **Auto-Scroll to Results**: Submitting searches or clicking popular search tags automatically scrolls smoothly down to the prompt catalog results section (`#explore_list`).
- **Debounced Instant Suggestions**: Debounced search input avoids flickering and reduces API load while showing instant popover matches.

### 🎨 5. Premium UI & Micro-Interactions
- **Smart Auto-Hiding Header**: Header automatically hides on scroll-down (`-translate-y-full`) and smoothly reappears on scroll-up (`translate-y-0`) like modern premium web applications.
- **Dynamic Floating Corner Widgets**: Action buttons (`Submit Prompt` and `Feedback`) remain unobtrusive at the top of pages and smoothly pop into view as the user scrolls into content.
- **Dark & Light Mode**: Seamless dark/light theme switching with custom design system variables.

---

## 🏗️ Architecture & System Design

```
                     ┌─────────────────────────────────────────┐
                     │          Vite + React 18 SPA            │
                     └────────────────────┬────────────────────┘
                                          │
                  ┌───────────────────────┼───────────────────────┐
                  ▼                       ▼                       ▼
        ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
        │  React Router v6 │    │  Context API     │    │ Custom Hooks     │
        │  (AppRoutes)     │    │ (PromptHubState) │    │ (useSmartScroll) │
        └─────────┬────────┘    └─────────┬────────┘    └─────────┬────────┘
                  │                       │                       │
                  └───────────────────────┼───────────────────────┘
                                          │
                                          ▼
                       ┌─────────────────────────────────────┐
                       │        Supabase Backend Service     │
                       ├─────────────────────────────────────┤
                       │  • PostgreSQL Database & RLS        │
                       │  • GitHub OAuth Authentication      │
                       │  • SQL Views & RPC Aggregations     │
                       └─────────────────────────────────────┘
```

---

## 📁 Repository Structure

```
ospl/
├── assets/                  # Brand SVG logos (ospl.svg) & favicon sources
├── docs/                    # Database schemas & SQL setup documentation
├── public/                  # Favicon suite, site.webmanifest & static assets
├── seeds/                   # SQL seed scripts for lookup tables and demo prompts
├── src/
│   ├── components/          # UI Components & Page Views
│   │   ├── feedback/        # Feedback modal & floating feedback widget
│   │   ├── submission/      # Submission action bar, review modal & tooltips
│   │   ├── Header.tsx       # Smart auto-hiding header navigation
│   │   ├── Footer.tsx       # Brand footer & navigation links
│   │   ├── ExploreView.tsx  # Main catalog grid & hero search section
│   │   ├── OsplLogo.tsx     # Reusable SVG brand logo component
│   │   └── ...
│   ├── hooks/               # Custom React Hooks
│   │   ├── PromptHubContext.tsx # Central application state manager
│   │   ├── useSmartScroll.ts   # Auto-hiding header & floating widget scroll hook
│   │   ├── useSearchURLSync.ts # URL search parameter synchronization hook
│   │   └── useDebounce.ts      # Debounce hook for instant search
│   ├── layouts/             # Layout wrappers (MainLayout, AuthLayout)
│   ├── lib/                 # Core Repositories & Utilities
│   │   ├── promptRepository.ts # Supabase queries, cache & dual-junction logic
│   │   ├── promptSchema.ts     # Variable parser & platform tag formatters
│   │   ├── supabaseClient.ts   # Supabase client initialization
│   │   └── clipboardService.ts # One-click copy utility
│   ├── pages/               # Route Pages (ExplorePage, SearchPage, etc.)
│   ├── routes/              # Protected & Public route handlers
│   └── types/               # TypeScript interfaces & definitions
├── supabase/                # Database migrations & RLS policy definitions
├── index.html               # Main HTML document with favicon head suite
├── package.json             # NPM dependencies & build scripts
├── tsconfig.json            # TypeScript compiler configuration
└── vite.config.ts           # Vite bundler configuration
```

---

## 🛠️ Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **NPM**: v9.0.0 or higher
- **Supabase Account**: (Optional for local testing; default anon keys provided)

---

### 1. Clone the Repository
```bash
git clone https://github.com/mindsbuild2026/ospl.dev.git
cd ospl.dev
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create `.env.local` in the root directory:
```env
VITE_SUPABASE_URL=https://your-supabase-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 4. Start Development Server
```bash
npm run dev
```
Open [https://www.ospl.dev](https://www.ospl.dev) to view OSPL in your browser.

---

## 🧪 Build & Verification

To verify TypeScript type safety and compile a production bundle:

```bash
# Type check without emitting files
npx tsc --noEmit

# Build production bundle to /dist
npm run build
```

---

## 🛡️ License

OSPL is distributed under the **Apache License 2.0**. See [`LICENSE`](LICENSE) for details.
