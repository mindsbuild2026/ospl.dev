import React from 'react';

interface OsplLogoProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
}

export default function OsplLogo({ className = 'w-6 h-6', ...props }: OsplLogoProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <path
        d="M 50 16 C 72 16, 84 28, 84 50 C 84 72, 72 84, 50 84 C 28 84, 16 72, 16 50 C 16 32, 28 24, 42 24 C 58 24, 66 34, 66 48 C 66 60, 56 64, 48 64"
        stroke="currentColor"
        strokeWidth="8.5"
        strokeLinecap="round"
      />
      <circle cx="34" cy="48" r="4.5" fill="currentColor" />
    </svg>
  );
}
