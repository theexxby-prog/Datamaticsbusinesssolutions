import { X, Filter, Tag, Calendar, Building2, Award } from 'lucide-react';

interface AdvancedFiltersPanelProps {
  isOpen: boolean;
  onClose: () => void;
  filters: {
    scoreRange: [number, number];
    dateRange: string;
    industry: string[];
    tags: string[];
  };
  onFilterChange: (filters: any) => void;
}

export function AdvancedFiltersPanel({ isOpen, onClose, filters, onFilterChange }: AdvancedFiltersPanelProps) {
  if (!isOpen) return null;

  const industries = ['Technology', 'Healthcare', 'Finance', 'Manufacturing', 'Retail', 'Education'];
  const availableTags = ['VIP', 'Follow-up', 'Hot', 'Decision Maker', 'Budget Confirmed'];

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 animate-fadeIn"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-md z-50 shadow-2xl animate-slideInRight bg-[var(--color-surface-raised)]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Filter className="w-5 h-5 text-[var(--color-primary)]" />
            <h2 className="text-lg font-semibold text-gray-900">Advanced Filters</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-lg transition-colors hover:bg-gray-100"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Filters */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(100vh-140px)]">
          {/* Lead Score Range */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium mb-3 text-gray-700">
              <Award className="w-4 h-4" />
              Lead Score Range
            </label>
            <div className="space-y-2">
              <input
                type="range"
                min="0"
                max="100"
                value={filters.scoreRange[1]}
                onChange={(e) => onFilterChange({ 
                  ...filters, 
                  scoreRange: [filters.scoreRange[0], parseInt(e.target.value)] 
                })}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-gray-600">
                <span>{filters.scoreRange[0]}</span>
                <span>{filters.scoreRange[1]}</span>
              </div>
            </div>
          </div>

          {/* Date Range */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium mb-3 text-gray-700">
              <Calendar className="w-4 h-4" />
              Date Range
            </label>
            <select
              value={filters.dateRange}
              onChange={(e) => onFilterChange({ ...filters, dateRange: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border transition-all bg-[var(--color-surface-raised)] border-gray-300 text-gray-900"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
            </select>
          </div>

          {/* Industry */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium mb-3 text-gray-700">
              <Building2 className="w-4 h-4" />
              Industry
            </label>
            <div className="flex flex-wrap gap-2">
              {industries.map((industry) => (
                <button
                  key={industry}
                  onClick={() => {
                    const newIndustries = filters.industry.includes(industry)
                      ? filters.industry.filter(i => i !== industry)
                      : [...filters.industry, industry];
                    onFilterChange({ ...filters, industry: newIndustries });
                  }}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    filters.industry.includes(industry)
                      ? 'bg-[var(--color-primary-solid)] text-white'
                      : 'bg-gray-100 text-gray-600 border border-gray-300'
                  }`}
                >
                  {industry}
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium mb-3 text-gray-700">
              <Tag className="w-4 h-4" />
              Tags
            </label>
            <div className="flex flex-wrap gap-2">
              {availableTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => {
                    const newTags = filters.tags.includes(tag)
                      ? filters.tags.filter(t => t !== tag)
                      : [...filters.tags, tag];
                    onFilterChange({ ...filters, tags: newTags });
                  }}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    filters.tags.includes(tag)
                      ? 'bg-[var(--color-info)] text-white'
                      : 'bg-gray-100 text-gray-600 border border-gray-300'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200">
          <div className="flex gap-3">
            <button
              onClick={() => {
                onFilterChange({
                  scoreRange: [0, 100],
                  dateRange: 'all',
                  industry: [],
                  tags: []
                });
              }}
              className="flex-1 px-4 py-2.5 rounded-lg border transition-all border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Clear All
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg text-white transition-all bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-light)]"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
