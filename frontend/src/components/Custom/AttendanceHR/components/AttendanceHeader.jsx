import { RefreshCw } from "lucide-react"; //Icons lang to! dont worry Remember always

const AttendanceHeader = ({ today, handleRefresh, isLoading }) => {
  return (
    <div className="flex justify-between items-center mb-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Attendance</h2>
        <p className="text-sm text-gray-800 mt-1">Employee attendance management</p>
      </div>
      {/* Refresh button to!*/}
      <div className="flex items-center gap-3">
        <button onClick={handleRefresh} disabled={isLoading} 
                className="text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50" 
                title="Refresh data"> <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
        </button>

        <span className="text-sm text-gray-800 bg-white px-4 py-2 rounded-lg shadow-sm">
          Date today: <span className="text-gray-800 font-semibold">{today}</span>
        </span>
      </div>
    </div>
  );
};

export default AttendanceHeader;