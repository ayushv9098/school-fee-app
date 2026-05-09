'use client';

import { useState, ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

interface CollapsibleSectionProps {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  icon?: ReactNode;
  badge?: string;
}

export default function CollapsibleSection({
  title,
  children,
  defaultOpen = true,
  icon,
  badge,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors duration-200"
      >
        <div className="flex items-center gap-3">
          {icon && <span className="text-violet-600">{icon}</span>}
          <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
          {badge && (
            <span className="px-2 py-1 text-xs font-medium bg-violet-100 text-violet-700 rounded-full">
              {badge}
            </span>
          )}
        </div>

        {/* Toggle Icon with Animation */}
        <div
          className={`
            p-1 rounded-full transition-all duration-300 ease-in-out
            ${isOpen ? 'bg-violet-100 rotate-180' : 'bg-gray-100 rotate-0'}
          `}
        >
          <ChevronDown className="w-5 h-5 text-violet-600" />
        </div>
      </button>

      {/* Collapsible Content */}
      <div
        className={`
          transition-all duration-300 ease-in-out
          ${isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}
          overflow-hidden
        `}
      >
        <div className="px-6 pb-6 pt-2 border-t border-gray-100">
          {children}
        </div>
      </div>
    </div>
  );
}