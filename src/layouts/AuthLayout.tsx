import type { ReactNode } from 'react';

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-brand-bg dark:bg-brand-bg-dark text-brand-text dark:text-brand-text-dark">
      <main className="min-h-screen flex items-center justify-center px-4 py-12">
        {children}
      </main>
    </div>
  );
}
