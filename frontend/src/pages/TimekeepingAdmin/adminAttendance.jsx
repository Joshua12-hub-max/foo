import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { ADMIN_ATTENDANCE_HEADERS } from '../../components/Custom/AttendanceComponents/admin/constants/attendanceConstants';
import { useAttendanceData } from '../../components/Custom/AttendanceComponents/admin/hooks/useAttendanceData';
import { useAttendanceFilters } from '../../components/Custom/AttendanceComponents/admin/hooks/useAttendanceFilters';
import { useAttendancePagination } from '../../components/Custom/AttendanceComponents/admin/hooks/useAttendancePagination';

import AttendanceHeader from '../../components/Custom/AttendanceComponents/admin/components/AttendanceHeader';
import AttendanceFilters from '../../components/Custom/AttendanceComponents/admin/components/AttendanceFilters';
import AttendanceSearch from '../../components/Custom/AttendanceComponents/admin/components/AttendanceSearch';
import AttendanceExport from '../../components/Custom/AttendanceComponents/admin/components/AttendanceExport';
import AttendanceTable from '../../components/Custom/AttendanceComponents/admin/components/AttendanceTable';

const AdminAttendance = () => {
  const outletContext = useOutletContext?.() || { sidebarOpen: true };
  const { sidebarOpen = true } = outletContext;

  // 1. Fetch Data
  const { data, isLoading, error, refetch } = useAttendanceData(true); // true = isAdmin

  // 2. Filter Data
  const { 
    searchQuery, 
    dateRange, 
    filteredData, 
    handleSearchChange, 
    handleDateRangeChange, 
    clearFilters 
  } = useAttendanceFilters(data);

  // Local state for Department and Employee filters (mock implementation for now)
  const [department, setDepartment] = useState('');
  const [employee, setEmployee] = useState('');

  // 3. Paginate Data
  const pagination = useAttendancePagination(filteredData);

  return (
    <div className={`min-h-screen flex flex-col bg-gradient-to-br from-neutral-100 to-stone-50 rounded-xl shadow-xl p-7 w-full overflow-hidden text-gray-800 transition-all duration-300 ${!sidebarOpen ? 'max-w-[1600px] xl:max-w-[88vw]' : 'max-w-[1400px] xl:max-w-[77vw]'}`}>
      
      <AttendanceHeader 
        title="Attendance Records" 
        subtitle="Employee attendance monitoring"
        onRefresh={refetch}
        isLoading={isLoading}
      />

      <hr className="mb-6 border-[1px] border-[#274b46]" />

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      <AttendanceFilters 
        dateRange={dateRange}
        onDateRangeChange={handleDateRangeChange}
        onClear={clearFilters}
        onApply={() => {}} // Placeholder for apply logic
        department={department}
        onDepartmentChange={setDepartment}
        employee={employee}
        onEmployeeChange={setEmployee}
        showDepartmentFilter={true}
        showEmployeeFilter={true}
      />

      <AttendanceSearch 
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        filteredDataLength={filteredData.length}
      />

      <AttendanceExport 
        data={filteredData}
        title="Attendance Records"
      />

      <AttendanceTable 
        data={pagination.currentData}
        headers={ADMIN_ATTENDANCE_HEADERS}
        isLoading={isLoading}
        pagination={pagination}
      />
    </div>
  );
};

export default AdminAttendance;
