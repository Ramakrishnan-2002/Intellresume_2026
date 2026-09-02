import React from 'react';

export type CardVariant = 'default' | 'elevated' | 'glass' | 'interactive';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  children: React.ReactNode;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ variant = 'default', className = '', children, ...props }, ref) => {
    const variantStyles: Record<CardVariant, string> = {
      default:
        'bg-[#111625] border border-slate-800/80 rounded-xl shadow-lg',
      elevated:
        'bg-[#151c2e] border border-slate-700/60 rounded-xl shadow-xl shadow-black/40',
      glass:
        'glass-card rounded-xl',
      interactive:
        'glass-card glass-card-interactive rounded-xl cursor-pointer',
    };

    return (
      <div
        ref={ref}
        className={`${variantStyles[variant]} p-5 sm:p-6 overflow-hidden ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Card.displayName = 'Card';

export const CardHeader = ({
  className = '',
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`flex flex-col space-y-1.5 mb-4 ${className}`} {...props}>
    {children}
  </div>
);

export const CardTitle = ({
  className = '',
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h3
    className={`text-base sm:text-lg font-bold text-slate-100 font-['Plus_Jakarta_Sans'] leading-none tracking-tight ${className}`}
    {...props}
  >
    {children}
  </h3>
);

export const CardDescription = ({
  className = '',
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p className={`text-xs text-slate-400 leading-relaxed ${className}`} {...props}>
    {children}
  </p>
);

export const CardContent = ({
  className = '',
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`${className}`} {...props}>
    {children}
  </div>
);

export const CardFooter = ({
  className = '',
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`flex items-center pt-4 border-t border-slate-800/60 mt-4 ${className}`} {...props}>
    {children}
  </div>
);
