import React from 'react';

interface EvaluationStats {
  averageScore?: number | string;
  totalReviews?: number;
  pendingActions?: number;
}

interface EmployeeEvaluationSummaryProps {
  stats: EvaluationStats;
}

const EmployeeEvaluationSummary: React.FC<EmployeeEvaluationSummaryProps> = ({ stats }) => {
  const getAdjectivalRating = (score: number | string | undefined | null) => {
    const numScore = typeof score === 'string' ? parseFloat(score) : score;
    if (!numScore || numScore === 0) return { label: 'N/A', color: 'text-gray-400' };
    if (numScore >= 4.5) return { label: 'Outstanding', color: 'text-green-600' };
    if (numScore >= 3.5) return { label: 'Very Satisfactory', color: 'text-blue-600' };
    if (numScore >= 2.5) return { label: 'Satisfactory', color: 'text-yellow-600' };
    if (numScore >= 1.5) return { label: 'Unsatisfactory', color: 'text-orange-600' };
    return { label: 'Poor', color: 'text-red-600' };
  };

  const rating = getAdjectivalRating(stats.averageScore);

  const cards = [
    {
      title: 'Total Reviews',
      value: stats.totalReviews || 0,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-100'
    },
    {
      title: 'Average Score',
      value: stats.averageScore ? parseFloat(stats.averageScore.toString()).toFixed(2) : '—',
      suffix: stats.averageScore ? ' / 5.0' : '',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-100'
    },
    {
      title: 'Latest Rating',
      value: rating.label,
      color: rating.color,
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-100',
      isText: true
    },
    {
      title: 'Pending Actions',
      value: stats.pendingActions || 0,
      color: (stats.pendingActions || 0) > 0 ? 'text-orange-600' : 'text-green-600',
      bgColor: (stats.pendingActions || 0) > 0 ? 'bg-orange-50' : 'bg-green-50',
      borderColor: (stats.pendingActions || 0) > 0 ? 'border-orange-100' : 'border-green-100'
    }
  ];


  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card, index) => {
        return (
          <div 
            key={index} 
            className={`bg-white p-5 rounded-xl shadow-sm border ${card.borderColor} flex items-center gap-4`}
          >
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{card.title}</p>
              <p className={`text-2xl font-bold ${card.color}`}>
                {card.value}
                {card.suffix && <span className="text-sm text-gray-400 font-normal">{card.suffix}</span>}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default EmployeeEvaluationSummary;
