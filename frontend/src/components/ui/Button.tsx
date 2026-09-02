import React from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'ai';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      loading = false,
      icon,
      iconPosition = 'left',
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium rounded-md transition-all duration-150 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-40 disabled:pointer-events-none select-none cursor-pointer text-xs font-sans tracking-tight';

    const sizeStyles = {
      sm: 'h-7 px-2.5 gap-1.5 text-[11px]',
      md: 'h-8.5 px-3.5 gap-2 text-xs',
      lg: 'h-10 px-4.5 gap-2.5 text-sm font-semibold',
    };

    const variantStyles: Record<ButtonVariant, string> = {
      primary:
        'bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-sm focus:ring-blue-500',
      secondary:
        'bg-[#131d33] hover:bg-[#1a2744] text-slate-100 border border-slate-700/60 hover:border-slate-600',
      outline:
        'bg-transparent hover:bg-white/5 text-slate-200 border border-white/15 hover:border-white/25',
      ghost:
        'bg-transparent hover:bg-white/5 text-slate-400 hover:text-slate-100',
      destructive:
        'bg-rose-950/40 hover:bg-rose-950/70 text-rose-300 border border-rose-800/40 hover:border-rose-700/60',
      ai:
        'bg-indigo-950/50 hover:bg-indigo-900/60 text-indigo-300 border border-indigo-500/40 font-semibold shadow-sm',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
        {...props}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
        ) : (
          icon && iconPosition === 'left' && <span className="shrink-0">{icon}</span>
        )}
        <span>{children}</span>
        {!loading && icon && iconPosition === 'right' && (
          <span className="shrink-0">{icon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
