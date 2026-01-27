import React from 'react';
import { ChevronDown } from 'lucide-react';

const Select = ({
  label,
  name,
  value,
  onChange,
  options,
  placeholder = 'Select an option',
  error,
  required = false,
  disabled = false,
  className = '',
}) => {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <select
          name={name}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={`
            w-full px-4 py-2.5 rounded-xl border border-gray-200
            text-gray-900 appearance-none cursor-pointer
            transition-all duration-200
            input-focus
            ${error ? 'border-red-500' : ''}
            ${disabled ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'}
          `}
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
      </div>
      {error && (
        <p className="mt-1.5 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
};

export default Select;