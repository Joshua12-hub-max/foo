import { useBiometricsLogs } from "../../components/Custom/BiometricsLogsComponents/useBiometricsLogs";
import { BiometricsHeader } from "../../components/Custom/BiometricsLogsComponents/BiometricsHeader";
import { BiometricsNotification } from "../../components/Custom/BiometricsLogsComponents/BiometricsNotification";
import { BiometricsFilters } from "../../components/Custom/BiometricsLogsComponents/BiometricsFilters";
import { BiometricsTable } from "../../components/Custom/BiometricsLogsComponents/BiometricsTable";
import { AdminDTRPagination } from "../../components/Custom/DailyTimeRecordComponents/Admin/Components/AdminDTRPagination"; // Reusing pagination

const BiometricsLogsUI = () => {
  const {today,sidebarOpen,filters,searchQuery,currentPage,isLoading,error,
    successMessage,filteredData,paginationData,uniqueDepartments,uniqueEmployees,
    setError,setSuccessMessage,handleFilterChange,handleApply,handleClear,
    handleRefresh,handlePrevPage,handleNextPage} = useBiometricsLogs();

  const { totalPages, startIndex, endIndex, currentItems } = paginationData;
      
  return (
    <div className={`min-h-screen flex flex-col bg-gradient-to-br from-neutral-100 to-stone-100 rounded-xl shadow-xl p-7 w-full overflow-hidden text-gray-800 transition-all duration-300 ${sidebarOpen ? 'max-w-[1400px] xl:max-w-[77vw]' : 'max-w-[1600px] xl:max-w-[88vw]'}`}>
      
      <BiometricsHeader 
        today={today} 
        handleRefresh={handleRefresh} 
        isLoading={isLoading} 
      />

      {error && (
        <BiometricsNotification 
          type="error" 
          message={error} 
          onClose={() => setError(null)} 
        />
      )}

      {successMessage && (
        <BiometricsNotification 
          type="success" 
          message={successMessage} 
          onClose={() => setSuccessMessage(null)} 
        />
      )}

      <BiometricsFilters 
        filters={filters}
        handleFilterChange={handleFilterChange}
        handleApply={handleApply}
        handleClear={handleClear}
        isLoading={isLoading}
        uniqueDepartments={uniqueDepartments}
        uniqueEmployees={uniqueEmployees}
      />

      <BiometricsTable 
        currentItems={currentItems} 
        isLoading={isLoading} 
      />

      {!isLoading && filteredData.length > 0 && (
        <AdminDTRPagination 
          startIndex={startIndex}
          endIndex={endIndex}
          totalRecords={filteredData.length}
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

export default BiometricsLogsUI;