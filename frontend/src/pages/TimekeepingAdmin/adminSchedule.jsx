import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';

// Import Utils
import { getTodayDate } from '@components/Custom/Timekeeping/ScheduleAdminComponents/admin/utils/dateTimeUtils';

// Import Hooks
import { useScheduleData } from '@components/Custom/Timekeeping/ScheduleAdminComponents/admin/hooks/useScheduleData';
import { useFilters } from '@components/Custom/Timekeeping/ScheduleAdminComponents/admin/hooks/useFilters';
import { usePagination } from '@components/Custom/Timekeeping/ScheduleAdminComponents/admin/hooks/usePagination';
import { useExport } from '@components/Custom/Timekeeping/ScheduleAdminComponents/admin/hooks/useExport';

// Import Constants
import { PAGE_SIZE } from '@components/Custom/Timekeeping/ScheduleAdminComponents/admin/constants/scheduleConstants';

// Import Components
import LoadingSpinner from '@components/Custom/Timekeeping/ScheduleAdminComponents/admin/components/LoadingSpinner';
import ErrorAlert from '@components/Custom/Timekeeping/ScheduleAdminComponents/admin/components/ErrorAlert';
import SuccessAlert from '@components/Custom/Timekeeping/ScheduleAdminComponents/admin/components/SuccessAlert';
import Header from '@components/Custom/Timekeeping/ScheduleAdminComponents/admin/components/Header';
import Filters from '@components/Custom/Timekeeping/ScheduleAdminComponents/admin/components/Filters';
import ExportOptions from '@components/Custom/Timekeeping/ScheduleAdminComponents/admin/components/ExportOptions';
import Table from '@components/Custom/Timekeeping/ScheduleAdminComponents/admin/components/Table';
import Pagination from '@components/Custom/Timekeeping/ScheduleAdminComponents/admin/components/Pagination';

// Import API
import { scheduleApi } from '@api';

// Import Icons
import { X, Clock, Calendar, User } from 'lucide-react';

const Schedule = () => {
  const outletContext = useOutletContext?.() || { sidebarOpen: true };
  const { sidebarOpen = true } = outletContext;
  const today = getTodayDate();

  // State management
  const [successMessage, setSuccessMessage] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [editForm, setEditForm] = useState({
    title: '',
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: '',
    repeat: 'none'
  });
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Custom hooks
  const { data, isLoading: dataLoading, error, setError, handleRefresh } = useScheduleData();
  const { filters, searchQuery, uniqueDepartments, uniqueEmployees, filteredData, handleFilterChange, handleSearchChange, handleClear: clearFilters } = useFilters(data);
  const { currentPage, totalPages, paginatedData, handlePageChange, resetPage } = usePagination(filteredData, PAGE_SIZE);
  const { isLoading: exportLoading, loadingType, error: exportError, setError: setExportError, handleExportCSV, handleExportPDF } = useExport(filteredData, today);

  const isLoading = dataLoading || exportLoading;

  // Auto-dismiss messages
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error, setError]);

  useEffect(() => {
    if (exportError) {
      const timer = setTimeout(() => setExportError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [exportError, setExportError]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Handle apply filters
  const handleApply = useCallback(() => {
    // Check if at least one filter is selected
    const hasFilters = filters.department || filters.employee || filters.fromDateTime || filters.toDateTime;
    if (!hasFilters) {
      setError("Please select at least one filter before applying.");
      return;
    }
    resetPage();
    setSuccessMessage("Filters applied successfully!");
  }, [resetPage, filters, setError]);

  // Handle clear filters
  const handleClearFilters = useCallback(() => {
    clearFilters();
    resetPage();
    setSuccessMessage("Filters cleared successfully!");
  }, [clearFilters, resetPage]);

  // Handle export CSV
  const handleCSVExport = useCallback(async () => {
    if (filteredData.length === 0) {
      setExportError("No data available to export.");
      return;
    }
    const success = await handleExportCSV();
    if (success) {
      setSuccessMessage("CSV exported successfully!");
    }
  }, [filteredData.length, handleExportCSV, setExportError]);

  // Handle export PDF
  const handlePDFExport = useCallback(async () => {
    if (filteredData.length === 0) {
      setExportError("No data available to export.");
      return;
    }
    const success = await handleExportPDF();
    if (success) {
      setSuccessMessage("PDF print dialog opened!");
    }
  }, [filteredData.length, handleExportPDF, setExportError]);

  // Handle Edit click
  const handleEdit = useCallback((item) => {
    setSelectedSchedule(item);
    setEditForm({
      title: item.scheduleName || item.schedule_title || '',
      startDate: item.start_date || item.startDate || '',
      endDate: item.end_date || item.endDate || '',
      startTime: item.start_time || item.startTime || '',
      endTime: item.end_time || item.endTime || '',
      repeat: item.repeat_pattern || item.repeat || 'none'
    });
    setShowEditModal(true);
  }, []);

  // Handle Delete click
  const handleDelete = useCallback((item) => {
    setSelectedSchedule(item);
    setShowDeleteModal(true);
  }, []);

  // Confirm Edit
  const handleConfirmEdit = useCallback(async () => {
    if (!selectedSchedule) return;
    setIsProcessing(true);
    try {
      await scheduleApi.updateSchedule(selectedSchedule.id, {
        schedule_title: editForm.title,
        start_date: editForm.startDate,
        end_date: editForm.endDate,
        start_time: editForm.startTime,
        end_time: editForm.endTime,
        repeat_pattern: editForm.repeat
      });
      setSuccessMessage("Schedule updated successfully!");
      setShowEditModal(false);
      setSelectedSchedule(null);
      handleRefresh();
    } catch (err) {
      console.error("Failed to update schedule:", err);
      setError("Failed to update schedule. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  }, [selectedSchedule, editForm, handleRefresh, setError]);

  // Confirm Delete
  const handleConfirmDelete = useCallback(async () => {
    if (!selectedSchedule) return;
    setIsProcessing(true);
    try {
      await scheduleApi.deleteSchedule(selectedSchedule.id);
      setSuccessMessage("Schedule deleted successfully!");
      setShowDeleteModal(false);
      setSelectedSchedule(null);
      handleRefresh();
    } catch (err) {
      console.error("Failed to delete schedule:", err);
      setError("Failed to delete schedule. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  }, [selectedSchedule, handleRefresh, setError]);

  // Show loading spinner during export
  if (isLoading && loadingType) {
    return <LoadingSpinner loadingType={loadingType === 'data' ? 'data' : loadingType} />;
  }

  return (
    <div className={`min-h-screen flex flex-col bg-gradient-to-br from-neutral-100 to-stone-50 rounded-xl shadow-xl p-7 w-full overflow-hidden text-gray-800 transition-all duration-300 ${sidebarOpen ? 'max-w-[1400px] xl:max-w-[77vw]' : 'max-w-[1600px] xl:max-w-[88vw]'}`}>
      
      {/* Header Section */}
      <Header today={today} isLoading={isLoading} onRefresh={handleRefresh} />

      <hr className="mb-6 border-[1px] border-gray-200" />

      {/* Alert Messages */}
      <ErrorAlert error={error || exportError} onDismiss={() => {
        setError(null);
        setExportError(null);
      }} />
      
      <SuccessAlert message={successMessage} onDismiss={() => setSuccessMessage(null)} />

      {/* Filters Section */}
      <Filters
        filters={filters}
        searchQuery={searchQuery}
        uniqueDepartments={uniqueDepartments}
        uniqueEmployees={uniqueEmployees}
        filteredDataCount={filteredData.length}
        isLoading={isLoading}
        onFilterChange={handleFilterChange}
        onSearchChange={handleSearchChange}
        onApply={handleApply}
        onClear={handleClearFilters}
      />

      {/* Export Options */}
      <ExportOptions
        isLoading={isLoading}
        dataCount={filteredData.length}
        onExportCSV={handleCSVExport}
        onExportPDF={handlePDFExport}
      />

      {/* Table Section */}
      <Table 
        isLoading={dataLoading} 
        paginatedData={paginatedData} 
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* Pagination Section */}
      {!dataLoading && filteredData.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalRecords={filteredData.length}
          pageSize={PAGE_SIZE}
          isLoading={isLoading}
          onPageChange={handlePageChange}
        />
      )}

      {/* Edit Modal */}
      {showEditModal && selectedSchedule && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border-2 border-gray-200 w-full max-w-md shadow-xl">
            <div className="bg-gray-200 p-3 flex justify-between items-center rounded-t-xl border-b border-gray-300">
              <h2 className="text-lg font-bold text-gray-800">Edit Schedule</h2>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5 text-red-800" />
              </button>
            </div>
            
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Schedule Title</label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                  className="w-full px-3 py-2 bg-[#F8F9FA] border-2 border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-200"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={editForm.startDate?.split('T')[0] || ''}
                    onChange={(e) => setEditForm({...editForm, startDate: e.target.value})}
                    className="w-full px-3 py-2 bg-[#F8F9FA] border-2 border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={editForm.endDate?.split('T')[0] || ''}
                    onChange={(e) => setEditForm({...editForm, endDate: e.target.value})}
                    className="w-full px-3 py-2 bg-[#F8F9FA] border-2 border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-200"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Start Time</label>
                  <input
                    type="time"
                    value={editForm.startTime}
                    onChange={(e) => setEditForm({...editForm, startTime: e.target.value})}
                    className="w-full px-3 py-2 bg-[#F8F9FA] border-2 border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">End Time</label>
                  <input
                    type="time"
                    value={editForm.endTime}
                    onChange={(e) => setEditForm({...editForm, endTime: e.target.value})}
                    className="w-full px-3 py-2 bg-[#F8F9FA] border-2 border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-200"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Repeat</label>
                <select
                  value={editForm.repeat}
                  onChange={(e) => setEditForm({...editForm, repeat: e.target.value})}
                  className="w-full px-3 py-2 bg-[#F8F9FA] border-2 border-gray-200 rounded-md text-sm focus:outline-none focus:border-gray-200"
                >
                  <option value="none">Does not repeat</option>
                  <option value="daily">Daily (Mon-Fri)</option>
                  <option value="weekly">Weekly (Same day each week)</option>
                </select>
              </div>
            </div>
            
            <div className="flex gap-3 p-5 pt-0">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-sm font-semibold text-gray-700 border-2 border-gray-200 rounded-lg shadow-md hover:text-red-800 disabled:opacity-50"
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmEdit}
                disabled={isProcessing}
                className="flex-1 px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-200 rounded-lg shadow-md hover:text-green-800 disabled:opacity-50"
              >
                {isProcessing ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedSchedule && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border-2 border-gray-200 w-full max-w-sm shadow-xl">
            <div className="bg-red-50 p-3 flex justify-between items-center rounded-t-xl border-b border-red-100">
              <h2 className="text-lg font-bold text-red-800">Delete Schedule</h2>
              <button onClick={() => setShowDeleteModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5 text-red-800" />
              </button>
            </div>
            
            <div className="p-5">
              <p className="text-gray-700 text-sm">
                Are you sure you want to delete the schedule <strong>"{selectedSchedule.scheduleName || selectedSchedule.schedule_title}"</strong> for <strong>{selectedSchedule.employeeName}</strong>?
              </p>
              <p className="text-gray-500 text-xs mt-2">This action cannot be undone.</p>
            </div>
            
            <div className="flex p-5 pt-0">
              <button
                onClick={handleConfirmDelete}
                disabled={isProcessing}
                className="w-full px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-200 rounded-lg shadow-md hover:text-red-800 disabled:opacity-50"
              >
                {isProcessing ? 'Deleting...' : 'Delete'} 
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Schedule;
