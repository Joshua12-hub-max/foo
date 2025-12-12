import { useNotificationHistory } from '../../components/Custom/NotificationHistoryComponents/useNotificationHistory';
import { NotificationHistoryHeader } from '../../components/Custom/NotificationHistoryComponents/NotificationHistoryHeader';
import { NotificationHistoryFilters } from '../../components/Custom/NotificationHistoryComponents/NotificationHistoryFilters';
import { NotificationHistorySearchBar } from '../../components/Custom/NotificationHistoryComponents/NotificationHistorySearchBar';
import { NotificationHistoryExportButtons } from '../../components/Custom/NotificationHistoryComponents/NotificationHistoryExportButtons';
import { NotificationHistoryTable } from '../../components/Custom/NotificationHistoryComponents/NotificationHistoryTable';
import { AdminDTRPagination } from '../../components/Custom/DailyTimeRecordComponents/Admin/Components/AdminDTRPagination';
import { AlertCircle, CheckCircle } from 'lucide-react';

const AdminNotificationHistory = () => {
  const {
    today,
    sidebarOpen,
    notifications,
    isLoading,
    error,
    successMessage,
    filters,
    departments,
    employees,
    currentPage,
    totalPages,
    totalRecords,
    itemsPerPage,
    searchQuery,
    setError,
    setSuccessMessage,
    handleFilterChange,
    handleSearchChange,
    handleApply,
    handleClear,
    handleRefresh,
    handleExportCSV,
    handleExportPDF,
    handlePrevPage,
    handleNextPage
  } = useNotificationHistory();

  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, totalRecords);

  return (
    <div className={`min-h-screen flex flex-col bg-gradient-to-br from-neutral-100 to-stone-100 rounded-xl shadow-xl p-7 w-full overflow-hidden text-gray-800 transition-all duration-300 ${sidebarOpen ? 'max-w-[1400px] xl:max-w-[77vw]' : 'max-w-[1600px] xl:max-w-[88vw]'}`}>
      
      {/* Header */}
      <NotificationHistoryHeader 
        today={today} 
        handleRefresh={handleRefresh}
        isLoading={isLoading} 
      />

      {/* Error Notification */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700 text-xl">&times;</button>
        </div>
      )}

      {/* Success Notification */}
      {successMessage && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-green-500 hover:text-green-700 text-xl">&times;</button>
        </div>
      )}

      {/* Filters */}
      <NotificationHistoryFilters 
        filters={filters}
        handleFilterChange={handleFilterChange}
        handleApply={handleApply}
        handleClear={handleClear}
        isLoading={isLoading}
        departments={departments}
        employees={employees}
        isAdmin={true}
      />

      {/* Search Bar */}
      <NotificationHistorySearchBar 
        searchQuery={searchQuery || ''}
        handleSearchChange={handleSearchChange}
        filteredDataLength={notifications.length}
        isLoading={isLoading}
      />

      {/* Export Options */}
      <NotificationHistoryExportButtons 
        handleExportCSV={handleExportCSV}
        handleExportPDF={handleExportPDF}
        isLoading={isLoading}
        filteredDataLength={notifications.length}
      />

      {/* Table */}
      <NotificationHistoryTable 
        notifications={notifications} 
        isLoading={isLoading}
        isAdmin={true}
      />

      {/* Pagination */}
      {!isLoading && totalRecords > 0 && (
        <AdminDTRPagination 
          startIndex={startIndex}
          endIndex={endIndex}
          totalRecords={totalRecords}
          currentPage={currentPage}
          totalPages={totalPages}
          handlePrevPage={handlePrevPage}
          handleNextPage={handleNextPage}
          isLoading={isLoading}
        />
      )}
    </div>
  );
};

export default AdminNotificationHistory;
