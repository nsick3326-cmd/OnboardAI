import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: { label: string; value: string | number }[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, helperText, options, className = '', id, ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={selectId} className="block text-xs font-semibold text-[#17182B] mb-1.5">
            {label}
          </label>
        )}
        <select
          id={selectId}
          ref={ref}
          className={`w-full px-3.5 py-2 text-sm text-[#17182B] bg-white border rounded-xl transition-standard focus:outline-none focus:ring-2 focus:ring-[#7655F7]/20 focus:border-[#7655F7] disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed ${
            error ? 'border-rose-400 focus:ring-rose-400/20 focus:border-rose-500' : 'border-[#E7E9F2]'
          } ${className}`}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error ? (
          <p className="mt-1 text-xs text-rose-600 font-medium">{error}</p>
        ) : helperText ? (
          <p className="mt-1 text-xs text-[#727A91]">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Select.displayName = 'Select';
