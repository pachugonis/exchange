import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: Array<{ value: string; label: string }>;
}

export const Select: React.FC<SelectProps> = ({
  label,
  error,
  options,
  className = '',
  ...props
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium mb-1.5 text-dark-700 dark:text-dark-200">
          {label}
        </label>
      )}
      <select
        className={`w-full px-4 py-2.5 bg-white dark:bg-dark-800 border ${
          error
            ? 'border-red-500 focus:ring-red-500'
            : 'border-dark-300 dark:border-dark-600 focus:ring-primary-500'
        } rounded-lg focus:outline-none focus:ring-2 transition-all ${className}`}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
};
