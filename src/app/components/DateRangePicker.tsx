import { useState } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';

interface DateRangePickerProps {
  value: string;
  onChange: (value: string) => void;
}

const DATE_RANGES = [
  { label: 'Today', value: 'today' },
  { label: 'Yesterday', value: 'yesterday' },
  { label: 'Last 7 Days', value: '7days' },
  { label: 'Last 30 Days', value: '30days' },
  { label: 'This Month', value: 'month' },
  { label: 'Last Month', value: 'lastmonth' },
  { label: 'This Quarter', value: 'quarter' },
  { label: 'This Year', value: 'year' },
  { label: 'All Time', value: 'all' }
];

export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedRange = DATE_RANGES.find(r => r.value === value) || DATE_RANGES[3];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-2.5 rounded-lg border transition-all flex items-center gap-2 text-sm font-medium bg-[var(--color-surface-raised)] border-gray-300 text-gray-700 hover:bg-gray-50"
      >
        <Calendar className="w-4 h-4" />
        <span>{selectedRange.label}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full right-0 mt-2 w-56 rounded-xl shadow-2xl border z-50 overflow-hidden animate-slideInUp bg-[var(--color-surface-raised)] border-gray-200">
            <div className="p-2">
              {DATE_RANGES.map((range) => (
                <button
                  key={range.value}
                  onClick={() => {
                    onChange(range.value);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 rounded-lg text-sm transition-all ${
                    value === range.value
                      ? 'bg-[var(--color-primary-solid)] text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
