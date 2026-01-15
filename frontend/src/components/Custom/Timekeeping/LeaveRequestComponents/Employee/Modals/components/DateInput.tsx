import React, { forwardRef } from 'react';
import { Calendar } from 'lucide-react';

interface DateInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label: string;
}

export const DateInput = forwardRef<HTMLInputElement, DateInputProps>(({ error, label, className, ...props }, ref) => {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-700 mb-1.5">
        {label} {props.required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        <Calendar className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          type="date"
          ref={ref}
          className={`w-full pl-9 pr-2.5 py-1.5 text-sm border ${
            error ? 'border-red-500' : 'border-gray-300'
          } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${className || ''}`}
          {...props}
        />
      </div>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
});

DateInput.displayName = 'DateInput';

export default DateInput;
