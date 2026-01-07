import { RefreshCw } from 'lucide-react';

 const DTRHeader = ({today, handleRefresh, isLoading}) => { 
    return (
    <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">DTR Correction</h2>
          <p className="text-sm text-gray-800 mt-1">Manage employee time record corrections</p>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={handleRefresh} disabled={isLoading}
                  className="text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50" title="Refresh data">
                  <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <span className="text-sm text-gray-800 bg-white px-4 py-2 rounded-lg shadow-sm">
            Date today: 
            <span className="text-gray-800 font-semibold">{today}</span>
          </span>
        </div>
    </div>
)};

export default DTRHeader;