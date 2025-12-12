import { useEmployeeNotificationHistory } from '../../components/Custom/NotificationHistoryComponents/useEmployeeNotificationHistory';
import { NotificationHistoryHeader } from '../../components/Custom/NotificationHistoryComponents/NotificationHistoryHeader';
import { NotificationHistoryFilters } from '../../components/Custom/NotificationHistoryComponents/NotificationHistoryFilters';
import { NotificationHistoryTable } from '../../components/Custom/NotificationHistoryComponents/NotificationHistoryTable';
import { AdminDTRPagination } from '../../components/Custom/DailyTimeRecordComponents/Admin/Components/AdminDTRPagination';

const EmployeeNotificationHistory = () => {
  const {
    today,
    sidebarOpen,
    notifications,
    isLoading,
    error,
    successMessage,
    filters,
    currentPage,
    totalPages,
    totalRecords,
    itemsPerPage,
    setError,
    setSuccessMessage,
    handleFilterChange,
    handleApply,
    handleClear,
    handleRefresh,
    handleExportPDF,
    handlePrevPage,
    handleNextPage
  } = useEmployeeNotificationHistory();

  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, totalRecords);

  return (
    <div className={`min-h-screen flex flex-col bg-gradient-to-br from-neutral-100 to-stone-100 rounded-xl shadow-xl p-7 w-full overflow-hidden text-gray-800 transition-all duration-300 ${sidebarOpen ? 'max-w-[1400px] xl:max-w-[77vw]' : 'max-w-[1600px] xl:max-w-[88vw]'}`}>
      
      <NotificationHistoryHeader 
        today={today} 
        handleRefresh={handleRefresh}
        handleExportPDF={handleExportPDF}
        isLoading={isLoading} 
      />

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">&times;</button>
        </div>
      )}

      {successMessage && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 flex justify-between items-center">
          <span>{successMessage}</span>
          <button onClick={() => setSuccessMessage(null)} className="text-green-500 hover:text-green-700">&times;</button>
        </div>
      )}

      <NotificationHistoryFilters 
        filters={filters}
        handleFilterChange={handleFilterChange}
        handleApply={handleApply}
        handleClear={handleClear}
        isLoading={isLoading}
        departments={[]}
        employees={[]}
        isAdmin={false}
      />

      <NotificationHistoryTable 
        notifications={notifications} 
        isLoading={isLoading}
        isAdmin={false}
      />

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

export default EmployeeNotificationHistory;
