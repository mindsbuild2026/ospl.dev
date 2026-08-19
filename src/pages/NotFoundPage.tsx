import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="max-w-3xl mx-auto py-24 px-6 text-center">
      <h2 className="font-display text-4xl font-bold text-brand-text dark:text-white">404 — Page not found</h2>
      <p className="text-sm text-neutral-500 mt-4">The link you followed may be broken or the page may have been removed.</p>
      <Link
        to="/explore"
        className="inline-flex mt-8 items-center justify-center rounded-full bg-brand-accent px-6 py-3 text-sm font-bold text-white transition hover:bg-brand-hover"
      >
        Back to Explore
      </Link>
    </div>
  );
}
