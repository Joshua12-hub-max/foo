import { Users, Clock, AlertCircle } from 'lucide-react';

const EvaluationSummary = ({ stats }) => {
  const cards = [
    {
      title: 'Total Employees',
      value: stats.total_employees || 0,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-100'
    },
    {
      title: 'Pending Evaluations',
      value: stats.pending_evaluations || 0,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-100'
    },
    {
      title: 'Overdue',
      value: stats.overdue_evaluations || 0,
      icon: AlertCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-100'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {cards.map((card, index) => (
        <div 
          key={index} 
          className={`bg-white p-6 rounded-xl shadow-sm border ${card.borderColor} flex flex-col items-center justify-center text-center`}
        >
          <h3 className="text-gray-500 text-sm font-medium mb-2">{card.title}</h3>
          <p className={`text-4xl font-bold ${card.color}`}>{card.value}</p>
        </div>
      ))}
    </div>
  );
};

export default EvaluationSummary;
