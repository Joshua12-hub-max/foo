import { useState, useMemo } from 'react';
import { PAGE_SIZE } from '../../components/Admin/constants/attendanceConstants';
import { AttendanceRecord } from '@/types';

export const useAttendancePagination = (data: AttendanceRecord[]) => {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = PAGE_SIZE || 10;

  const totalPages = Math.ceil((data?.length || 0) / pageSize);

  const currentData = useMemo(() => {
    if (!data) return [];
    const startIndex = (currentPage - 1) * pageSize;
    return data.slice(startIndex, startIndex + pageSize);
  }, [data, currentPage, pageSize]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return {
    currentPage,
    totalPages,
    pageSize,
    currentData,
    handlePageChange,
    setCurrentPage
  };
};
