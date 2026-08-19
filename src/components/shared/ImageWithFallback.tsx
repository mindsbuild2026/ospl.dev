/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * ImageWithFallback - shared image loader that avoids broken image icons.
 */

import React, { useState } from 'react';
import { Image as ImageIcon } from 'lucide-react';

interface ImageWithFallbackProps {
  src?: string | null;
  alt: string;
  className?: string;
  fallbackClassName?: string;
}

export const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({
  src,
  alt,
  className = 'w-full h-full object-cover',
  fallbackClassName = 'flex items-center justify-center bg-neutral-100 dark:bg-neutral-900 text-neutral-400',
}) => {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div className={`rounded-[28px] overflow-hidden ${fallbackClassName}`}>
        <div className="flex flex-col items-center justify-center gap-2 p-6">
          <ImageIcon className="w-10 h-10" />
          <span className="text-xs font-semibold uppercase tracking-[0.3em] text-neutral-500 dark:text-neutral-500">
            No image available
          </span>
        </div>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setHasError(true)}
      loading="lazy"
    />
  );
};
