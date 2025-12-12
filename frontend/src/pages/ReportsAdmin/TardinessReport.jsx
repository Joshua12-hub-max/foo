import React, { useState, useEffect } from 'react';
import { attendanceApi } from '../../api/attendanceApi';
import { fetchEmployeeOptions } from '../../api/employeeApi';
import { FileSpreadsheet, Printer, Calendar } from 'lucide-react';

const TardinessReport = () => {
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Filters
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(1); // First day of current month
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [department, setDepartment] = useState('All Departments');
  const [departmentOptions, setDepartmentOptions] = useState([]);

  useEffect(() => {
    loadDepartments();
    generateReport();
  }, []); // Initial load

  const loadDepartments = async () => {
    try {
      const options = await fetchEmployeeOptions();
      if (options.success) {
        setDepartmentOptions(['All Departments', ...options.departments]);
      }
    } catch (err) {
      console.error("Failed to load departments", err);
    }
  };

  const generateReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await attendanceApi.getTardinessReport({
        startDate,
        endDate,
        department
      });
      
      if (response.data.success) {
        setReportData(response.data.data);
      } else {
        setError("Failed to fetch report data.");
      }
    } catch (err) {
      setError("An error occurred while generating the report.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (reportData.length === 0) return;

    const headers = ['Employee ID', 'Name', 'Department', 'Total Late Minutes', 'Occurrences', 'Days Present'];
    const csvRows = [headers.join(',')];

    reportData.forEach(row => {
      const values = [
        `"${row.employee_id}"`, 
        `"${row.first_name} ${row.last_name}"`, 
        `"${row.department || ''}"`, 
        row.total_late_minutes,
        row.total_late_occurrences,
        row.days_present
      ];
      csvRows.push(values.join(','));
    });

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `tardiness_report_${startDate}_to_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-neutral-100 to-stone-50 rounded-xl shadow-xl p-7 w-full overflow-hidden text-gray-800 print:bg-white print:p-0 print:shadow-none">
      <div className="flex justify-between items-center mb-6 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Tardiness Report</h1>
          <p className="text-sm text-gray-800 mt-1">Generate reports on employee lateness</p>
        </div>
        <div className="flex gap-2">
           <button 
            onClick={handleExportCSV}
            disabled={reportData.length === 0}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md text-sm font-medium"
          >
            <FileSpreadsheet size={18} /> Export CSV
          </button>
          <button 
            onClick={handlePrint}
            disabled={reportData.length === 0}
            className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md text-sm font-medium"
          >
            <Printer size={18} /> Print
          </button>
        </div>
      </div>

      <hr className="mb-6 border-[1px] border-[#274b46] print:hidden" />

      {/* Filters */}
      <div className="bg-[#F8F9FA] p-4 rounded-lg shadow-md mb-6 flex flex-wrap gap-4 items-end print:hidden">
        <div className="relative">
          <label className="block text-xs font-semibold text-gray-600 mb-1 ml-1">Start Date</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="date" 
              className="pl-10 bg-white border border-gray-200 rounded-lg shadow-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-200 hover:border-gray-200 transition-all cursor-pointer"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
        </div>
        <div className="relative">
          <label className="block text-xs font-semibold text-gray-600 mb-1 ml-1">End Date</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="date" 
              className="pl-10 bg-white border border-gray-200 rounded-lg shadow-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-200 hover:border-gray-200 transition-all cursor-pointer"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>
        <div className="min-w-[200px]">
          <label className="block text-xs font-semibold text-gray-600 mb-1 ml-1">Department</label>
          <select 
            className="w-full bg-white border border-gray-200 rounded-lg shadow-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-200 hover:border-gray-200 transition-all cursor-pointer"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
          >
            {departmentOptions.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>
        <button 
          onClick={generateReport}
          className="bg-gray-200 text-gray-800 border border-gray-200 font-medium px-6 py-2.5 rounded-lg text-sm shadow-sm hover:bg-gray-300 transition-all"
        >
          Generate Report
        </button>
      </div>

      {/* Report Content */}
      <div className="bg-gray-50 rounded-lg scrollbar-bg-white shadow-sm border border-gray-100 overflow-hidden print:shadow-none print:bg-white print:border-none">
        <div className="p-6 border-b border-gray-200 print:block hidden">
          <h2 className="text-xl font-bold text-center mb-2 text-gray-800">Employee Tardiness Report</h2>
          <p className="text-center text-sm text-gray-600">Period: {startDate} to {endDate}</p>
          {department !== 'All Departments' && <p className="text-center text-sm text-gray-600">Department: {department}</p>}
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-500 flex flex-col items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin mb-3"></div>
            Generating report...
          </div>
        ) : error ? (
          <div className="p-12 text-center text-red-500">{error}</div>
        ) : reportData.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            No tardiness records found for this period.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-200 shadow-md text-gray-700 print:bg-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold tracking-wide whitespace-nowrap border-b border-gray-200">Employee</th>
                  <th className="px-6 py-4 text-left text-sm font-bold tracking-wide whitespace-nowrap border-b border-gray-200">Department</th>
                  <th className="px-6 py-4 text-center text-sm font-bold tracking-wide whitespace-nowrap border-b border-gray-200">Total Late (Min)</th>
                  <th className="px-6 py-4 text-center text-sm font-bold tracking-wide whitespace-nowrap border-b border-gray-200">Occurrences</th>
                  <th className="px-6 py-4 text-center text-sm font-bold tracking-wide whitespace-nowrap border-b border-gray-200">Avg Late (Min)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reportData.map((row, index) => (
                  <tr key={row.employee_id} className="hover:bg-[#F8F9FA] hover:shadow-xl transition-colors print:hover:bg-transparent print:hover:shadow-none">
                    <td className="px-6 py-4 border-b border-gray-100">
                      <div className="font-medium text-gray-800">{row.first_name} {row.last_name}</div>
                      <div className="text-xs text-gray-500">{row.employee_id}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-800 border-b border-gray-100">{row.department || '-'}</td>
                    <td className="px-6 py-4 text-center font-bold text-red-600 border-b border-gray-100">{row.total_late_minutes}</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-800 border-b border-gray-100">{row.total_late_occurrences}</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600 border-b border-gray-100">
                      {Math.round(row.total_late_minutes / row.total_late_occurrences)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default TardinessReport;
