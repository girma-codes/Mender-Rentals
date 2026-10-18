import type { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  className?: string;
}

/**
 * Small pill-shaped label for categories, tags, and status indicators.
 */
export function Badge({ children, className = '' }: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center gap-1
        rounded-full px-2.5 py-0.5
        text-xs font-medium
        bg-emerald-500/15 text-emerald-400
        border border-emerald-500/30
        ${className}
      `}
    >
      {children}
    </span>
  );
}
