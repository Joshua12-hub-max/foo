import { useState, useEffect } from 'react';
import { Search, FileText, CalendarRange, BarChart2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { fetchEvaluationSummary } from '../../api/performanceApi';
import EvaluationSummary from '../../components/Custom/Performance/EvaluationSummary';
import EvaluationTable from '../../components/Custom/Performance/EvaluationTable';

const PerformanceEvaluationDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [summaryData, setSummaryData] = useState({ employees: [], stats: {} });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('All Departments');
  const [filterStatus, setFilterStatus] = useState('All Status');

  useEffect(() => {
    
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await fetchEvaluationSummary();
        if (data.success) {
          setSummaryData(data);
        }
      } catch (err) {
        console.error("Failed to load evaluation summary", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Get unique departments for filter
  const departments = ['All Departments', ...new Set(summaryData.employees.map(e => e.department).filter(Boolean))];

  // Filter logic
  const filteredEmployees = summaryData.employees.filter(emp => {
    const matchesSearch = (emp.name?.toLowerCase().includes(searchTerm.toLowerCase())) || 
                          (emp.employee_id?.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesDept = filterDepartment === 'All Departments' || emp.department === filterDepartment;
    const matchesStatus = filterStatus === 'All Status' || (emp.status || 'Not Started') === filterStatus;
    
    return matchesSearch && matchesDept && matchesStatus;
  });

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-neutral-100 to-stone-50 rounded-xl shadow-xl p-7 w-full overflow-hidden text-gray-800">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                <BarChart2 size={25} className="text-gray-800" />
                Performance Management
            </h1>
            <p className="text-sm text-gray-800 mt-1">Monitor employee performance evaluations and status</p>
        </div>
        <div className="flex gap-3">
             <button 
                onClick={() => navigate('/admin-dashboard/performance/cycles')}
                className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-800 border border-gray-200 font-medium rounded-lg shadow-md hover:bg-gray-300 transition-colors"
             >
                <CalendarRange size={18} />
                <span>Manage Cycles</span>
             </button>
             <button 
                onClick={() => navigate('/admin-dashboard/performance-criteria')}
                className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-800 border border-gray-200 font-medium rounded-lg shadow-md hover:bg-gray-300 transition-colors"
             >
                <FileText size={18} />
                <span>Criteria</span>
             </button>
        </div>
      </div>

      <hr className="mb-6 border-[1px] border-[#274b46]" />

      <div className="space-y-8">
          
          {/* Summary Statistics */}
          <EvaluationSummary stats={summaryData.stats} />

          {/* Main Content */}
          <div className="space-y-6">
            
            {/* Filters */}
            <div className="bg-[#F8F9FA] p-4 rounded-lg shadow-md flex flex-col md:flex-row justify-between gap-4 items-center">
                <h2 className="text-lg font-bold text-gray-800">Employee Evaluations</h2>
                
                <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:flex-none">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search employee..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-gray-200 shadow-sm w-full md:w-64 transition-all"
                        />
                    </div>
                    
                    <select
                        value={filterDepartment}
                        onChange={(e) => setFilterDepartment(e.target.value)}
                        className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 outline-none focus:ring-2 focus:ring-gray-200 shadow-sm cursor-pointer transition-all"
                    >
                        {departments.map(dept => (
                            <option key={dept} value={dept}>{dept}</option>
                        ))}
                    </select>
                    
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 outline-none focus:ring-2 focus:ring-gray-200 shadow-sm cursor-pointer transition-all"
                    >
                        <option value="All Status">All Status</option>
                        <option value="Not Started">Not Started</option>
                        <option value="Draft">Draft</option>
                        <option value="Submitted">Submitted</option>
                        <option value="Acknowledged">Acknowledged</option>
                        <option value="Finalized">Finalized</option>
                        <option value="Overdue">Overdue</option>
                    </select>
                </div>
            </div>

            {/* Evaluations Table */}
            <EvaluationTable employees={filteredEmployees} loading={loading} />
          </div>
      </div>
    </div>
  );
};

export default PerformanceEvaluationDashboard;
