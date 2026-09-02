import React from 'react';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, id, className = '', ...props }, ref) => {
    const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={textareaId}
            className="block font-mono text-xs font-medium text-slate-300 tracking-wide"
          >
            {label}
          </label>
        )}
        <textarea
          id={textareaId}
          ref={ref}
          className={`w-full input-glass rounded-lg p-3 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 transition-all resize-y ${
            error
              ? 'border-rose-500/80 focus:border-rose-500 focus:ring-rose-500/30'
              : 'focus:border-[#4edea3]'
          } ${className}`}
          {...props}
        />
        {error && <p className="text-[11px] text-rose-400 font-mono mt-1">{error}</p>}
        {!error && helperText && (
          <p className="text-[11px] text-slate-400 font-mono mt-1">{helperText}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
