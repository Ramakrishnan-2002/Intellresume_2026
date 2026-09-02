import React from 'react';

export interface SectionProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  variant?: 'flat' | 'panel' | 'bordered';
}

export const Section: React.FC<SectionProps> = ({
  title,
  subtitle,
  action,
  variant = 'flat',
  className = '',
  children,
  ...props
}) => {
  const variantStyles = {
    flat: 'py-5 border-b border-white/[0.07]',
    panel: 'p-5 bg-[#111724] border border-white/[0.08] rounded-lg',
    bordered: 'p-5 border border-white/[0.08] rounded-lg',
  };

  return (
    <section className={`${variantStyles[variant]} ${className}`} {...props}>
      {(title || subtitle || action) && (
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            {title && (
              <h2 className="text-sm font-semibold text-slate-100 tracking-tight font-['Plus_Jakarta_Sans']">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      {children}
    </section>
  );
};
