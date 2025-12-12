import React from 'react';
import { HelpCircle, Star, CheckCircle, AlertCircle, XCircle, MinusCircle } from 'lucide-react';
import { CSC_RATING_SCALE } from '../../../api/performanceApi';

/**
 * RatingLegend - CSC 5-Point Rating Scale Reference
 * Provides transparency by showing what each rating means
 */
const RatingLegend = ({ compact = false, showHeader = true }) => {
  const getIcon = (score) => {
    switch (score) {
      case 5: return <Star className="text-green-600" size={16} />;
      case 4: return <CheckCircle className="text-blue-600" size={16} />;
      case 3: return <MinusCircle className="text-yellow-600" size={16} />;
      case 2: return <AlertCircle className="text-orange-600" size={16} />;
      case 1: return <XCircle className="text-red-600" size={16} />;
      default: return null;
    }
  };

  const getColor = (score) => {
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
        {CSC_RATING_SCALE.map((item) => (
          <div
            key={item.score}
            className={`flex items-center gap-1 px-2 py-1 rounded-full border ${getColor(item.score)}`}
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
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {showHeader && (
        <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-200">
          <HelpCircle size={18} className="text-blue-600" />
          <h4 className="font-bold text-gray-700 text-sm uppercase tracking-wide">CSC Performance Rating Scale</h4>
        </div>
      )}
      <div className="divide-y divide-gray-100">
        {CSC_RATING_SCALE.map((item) => (
          <div key={item.score} className="flex items-start gap-4 px-4 py-3 hover:bg-gray-50 transition-colors">
            <div className={`flex items-center justify-center w-10 h-10 rounded-lg font-bold text-lg border ${getColor(item.score)}`}>
              {item.score}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                {getIcon(item.score)}
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
