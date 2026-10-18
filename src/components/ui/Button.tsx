import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: ReactNode;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'bg-emerald-500 hover:bg-emerald-400 text-white font-semibold ' +
    'shadow-glow-emerald-sm hover:shadow-glow-emerald',
  secondary:
    'border border-emerald-500 text-emerald-400 hover:bg-emerald-500/10 ' +
    'font-semibold',
  ghost:
    'text-neutral-400 hover:text-white',
};

/**
 * Reusable button with primary (emerald filled), secondary (outlined), 
 * and ghost variants.
 */
export function Button({
  variant = 'primary',
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`
        inline-flex items-center justify-center gap-2
        rounded-xl px-5 py-2.5
        transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-neutral-900
        disabled:opacity-50 disabled:cursor-not-allowed
        ${VARIANT_CLASSES[variant]}
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
}
