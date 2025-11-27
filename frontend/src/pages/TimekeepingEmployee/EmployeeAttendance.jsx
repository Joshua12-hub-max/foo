import { useCallback, useMemo } from "react";
import { useOutletContext } from 'react-router-dom';

// Hooks
import useEmployeedata from "../../components/Custom/employeeAttendance/hooks/useEmployeedata";
import useEmployeeloadingstate from "../../components/Custom/employeeAttendance/hooks/useEmployeeloadingstate";
import useEmployeeactions from "../../components/Custom/employeeAttendance/hooks/useEmployeeactions";

// Components
import Employeeattendanceerrorbanner from "../../components/Custom/employeeAttendance/components/employeeattendanceerrorbanner";
import Employeeattendancesuccessbanner from "../../components/Custom/employeeAttendance/components/employeeattendacesuccesbanner";
import EmployeeAttendanceFilter from "../../components/Custom/employeeAttendance/components/employeettendanceFilter";
import EmployeeAttendanceTable from "../../components/Custom/employeeAttendance/components/employeeattendancetable";
import EmployeeAttendancePagination from "../../components/Custom/employeeAttendance/components/employeeattendancepagination";
import EmployeeAttendanceLoadingSpinner from "../../components/Custom/employeeAttendance/components/employeeattendanceloadingspinner";
import EmployeeAttendanceExportButtons from "../../components/Custom/employeeAttendance/components/employeeattendanceexportbuttons";
import EmployeeAttendanceSearchBar from "../../components/Custom/employeeAttendance/components/employeeattendancesearchbar";
import EmployeeAttendanceHeader from "../../components/Custom/employeeAttendance/components/employeeattendanceheader";

const AttendanceEM = () => {
    const outletContext = useOutletContext?.() || { sidebarOpen: true };
    const { sidebarOpen = true } = outletContext;
    const today = useMemo(() => new Date().toLocaleDateString("en-US"), []);

    const { filters, setFilters, attendanceData, setAttendanceData, 
        searchQuery,  setSearchQuery,  debouncedSearchQuery, currentPage, setCurrentPage,  searchTimeoutRef, 
        handleFilterChange,  handleSearchChange,  statusOptions,  filteredData,  paginationData,  attendanceStats
    } = useEmployeedata();

    const { isLoading, setIsLoading, loadingType, setLoadingType, error, setError, successMessage,  setSuccessMessage} = useEmployeeloadingstate();

    const { handleApply, handleClear, handleExportCSV, handleExportPDF, handleRefresh} = useEmployeeactions
    ({filteredData, setFilters, setSearchQuery, setSuccessMessage, setError, setIsLoading, setLoadingType, today,attendanceStats});

    const handlePrevPage = useCallback(() => {
        setCurrentPage((prev) => Math.max(prev - 1, 1));
    }, [setCurrentPage]);
    
    const handleNextPage = useCallback(() => {
        setCurrentPage((prev) => Math.min(prev + 1, paginationData.totalPages));
    }, [paginationData.totalPages, setCurrentPage]);

    const { totalPages, startIndex, endIndex, currentItems } = paginationData;
    
    if (isLoading && loadingType === 'data') {
        return <EmployeeAttendanceLoadingSpinner loadingType={loadingType} />;
    }

    return (
        <div className={`min-h-screen flex flex-col bg-gradient-to-br from-neutral-100 to-stone-50 rounded-xl shadow-xl p-7 w-full overflow-hidden text-gray-800 transition-all duration-300 ${sidebarOpen ? 'max-w-[1400px] xl:max-w-[77vw]' : 'max-w-[1600px] xl:max-w-[88vw]'}`}>
            <EmployeeAttendanceHeader
                today={today}
                handleRefresh={handleRefresh}
                isLoading={isLoading}
            />

            <hr className="mb-6 border-[1px] border-[#274b46]" />

            {error && (
                <Employeeattendanceerrorbanner 
                    error={error} 
                    setError={setError} 
                />
            )}

            {successMessage && (
                <Employeeattendancesuccessbanner 
                    successMessage={successMessage} 
                    setSuccessMessage={setSuccessMessage} 
                />
            )}

            <EmployeeAttendanceFilter
                filters={filters}
                setFilters={setFilters}
                statusOptions={statusOptions}
                handleFilterChange={handleFilterChange}
                handleApply={handleApply}
                handleClear={handleClear}
                isLoading={isLoading}
            />
        
            <EmployeeAttendanceSearchBar
                searchQuery={searchQuery}
                handleSearchChange={handleSearchChange}
                filteredData={filteredData}
                isLoading={isLoading}
            />
           
            <EmployeeAttendanceExportButtons
                handleExportCSV={handleExportCSV}
                handleExportPDF={handleExportPDF}
                isLoading={isLoading}
                filteredData={filteredData}
            />

            <EmployeeAttendanceTable
                currentItems={currentItems}
                debouncedSearchQuery={debouncedSearchQuery}
                filters={filters}
            />

            {filteredData.length > 0 && (
                <EmployeeAttendancePagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    startIndex={startIndex}  
                    endIndex={endIndex}
                    filteredData={filteredData}
                    handlePrevPage={handlePrevPage}
                    handleNextPage={handleNextPage}
                    isLoading={isLoading}
                />
            )}
        </div>
    ); 
};

export default AttendanceEM;