import React from 'react';
import { CSC_RATING_SCALE } from '@/api/performanceApi';

interface RatingScaleItem {
  score: number;
  label: string;
  description: string;
}

// Assuming CSC_RATING_SCALE is an array of objects matching the structure used.
// If performanceApi is JS, this interface just helps local type checking.

interface RatingLegendProps {
  compact?: boolean;
  showHeader?: boolean;
}

/**
 * RatingLegend - CSC 5-Point Rating Scale Reference
 * Provides transparency by showing what each rating means
 */
const RatingLegend: React.FC<RatingLegendProps> = ({ compact = false, showHeader = true }) => {
  const getColor = (score: number) => {
    switch (score) {
      case 5: return 'bg-green-50 border-green-200 text-green-800';
      case 4: return 'bg-blue-50 border-blue-200 text-blue-800';
      case 3: return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 2: return 'bg-orange-50 border-orange-200 text-orange-800';
      case 1: return 'bg-red-50 border-red-200 text-red-800';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  if (compact) {
    return (
      <div className="flex flex-wrap gap-2 text-xs">
        {CSC_RATING_SCALE.map((item: RatingScaleItem) => (
          <div
            key={item.score}
            className={`flex items-center gap-1 px-2 py-1 rounded-sm border ${getColor(item.score)}`}
            title={item.description}
          >
            <span className="font-bold">{item.score}</span>
            <span className="hidden sm:inline">- {item.label}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-sm border border-gray-200 overflow-hidden">
      {showHeader && (
        <div className="flex items-center gap-2 px-4 py-3 bg-[#F8F9FA] border-b border-gray-200">
          <h4 className="font-bold text-gray-800 text-[10px] uppercase tracking-widest">CSC PERFORMANCE RATING SCALE</h4>
        </div>
      )}
      <div className="divide-y divide-gray-100">
        {CSC_RATING_SCALE.map((item: RatingScaleItem) => (
          <div key={item.score} className="flex items-start gap-4 px-4 py-3 hover:bg-gray-50 transition-colors">
            <div className={`flex items-center justify-center w-8 h-8 rounded-sm font-bold text-sm border ${getColor(item.score)}`}>
              {item.score}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-gray-800">{item.label}</span>
              </div>
              <p className="text-sm text-gray-500 mt-1">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RatingLegend;
