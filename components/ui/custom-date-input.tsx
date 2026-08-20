import React from 'react';
import dayjs from 'dayjs';

interface CustomDateInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value'> {
  value?: string;
}

export function CustomDateInput({ value, className, ...props }: CustomDateInputProps) {
  // Use focus-within to mimic input focus styles on the wrapper
  const wrapperClassName = className?.replace(/focus:/g, 'focus-within:');

  return (
    <div className={`relative flex items-center ${wrapperClassName}`}>
      <span className="pointer-events-none w-full truncate text-inherit">
        {value ? dayjs(value).format('DD/MM/YYYY') : 'Select Date'}
      </span>
      <input 
        type="date"
        value={value || ''}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        {...props}
      />
    </div>
  );
}
