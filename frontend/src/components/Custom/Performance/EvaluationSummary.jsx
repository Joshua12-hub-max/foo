import { Users, Clock, AlertCircle } from 'lucide-react';

const EvaluationSummary = ({ stats }) => {
  const cards = [
    {
      title: 'Total Employees',
      value: stats.total_employees || 0,
      icon: Users
    },
    {
      title: 'Pending Evaluations',
      value: stats.pending_evaluations || 0,
      icon: Clock
    },
    {
      title: 'Overdue',
      value: stats.overdue_evaluations || 0,
      icon: AlertCircle
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {cards.map((card, index) => (
        <div 
          key={index} 
          className="bg-white p-6 rounded-xl border border-gray-200 hover:border-gray-300 transition-all group border-l-4 border-gray-300"
        >
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider">{card.title}</h3>
            {card.icon && <card.icon size={20} className="text-gray-400" />}
          </div>
          <p className="text-3xl font-bold text-gray-800">{card.value}</p>
        </div>
      ))}
    </div>
  );
};

export default EvaluationSummary;
