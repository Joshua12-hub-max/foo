import React, { forwardRef } from 'react';
import { Calendar } from 'lucide-react';

interface DateInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label: string;
}

export const DateInput = forwardRef<HTMLInputElement, DateInputProps>(({ error, label, className, ...props }, ref) => {
  return (
    <div>
      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">
        {label} {props.required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        <Calendar className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          type="date"
          ref={ref}
          className={`w-full px-4 py-2.5 text-sm border ${
            error ? 'border-red-500 ring-2 ring-red-200' : 'border-gray-200'
          } rounded-lg focus:ring-2 focus:ring-gray-200 focus:border-gray-400 focus:outline-none transition-all bg-gray-50 ${className || ''}`}
          {...props}
        />
      </div>
      {error && <p className="text-red-500 text-xs mt-1 ml-1">{error}</p>}
    </div>
  );
});

DateInput.displayName = 'DateInput';

export default DateInput;
