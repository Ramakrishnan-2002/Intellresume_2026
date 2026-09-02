import React from 'react';

export type BadgeVariant = 'emerald' | 'indigo' | 'blue' | 'amber' | 'rose' | 'neutral' | 'ai';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  dot = false,
  className = '',
  children,
  ...props
}) => {
  const variantStyles: Record<BadgeVariant, string> = {
    blue: 'bg-blue-950/60 text-blue-300 border-blue-500/30',
    indigo: 'bg-indigo-950/60 text-indigo-300 border-indigo-500/30',
    emerald: 'bg-emerald-950/50 text-emerald-300 border-emerald-500/30',
    amber: 'bg-amber-950/60 text-amber-300 border-amber-500/30',
    rose: 'bg-rose-950/60 text-rose-300 border-rose-500/30',
    neutral: 'bg-slate-900/60 text-slate-300 border-white/10',
    ai: 'bg-indigo-950/60 text-indigo-300 border-indigo-500/40',
  };

  const dotColors: Record<BadgeVariant, string> = {
    blue: 'bg-[#3b82f6]',
    indigo: 'bg-[#6366f1]',
    emerald: 'bg-[#10b981]',
    amber: 'bg-[#f59e0b]',
    rose: 'bg-[#f43f5e]',
    neutral: 'bg-slate-400',
    ai: 'bg-[#6366f1]',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-medium border ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColors[variant]}`} />}
      <span>{children}</span>
    </span>
  );
};
