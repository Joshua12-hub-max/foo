import { useState, useMemo, useEffect } from 'react';
import { PAGE_SIZE } from '../constants/attendanceConstants';

export const useAttendancePagination = (data) => {
  const [currentPage, setCurrentPage] = useState(1);

  // Reset to page 1 if data changes (e.g. filtering)
  useEffect(() => {
    setCurrentPage(1);
  }, [data.length]);

  const totalPages = Math.ceil(data.length / PAGE_SIZE);
  const currentData = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return data.slice(start, start + PAGE_SIZE);
  }, [data, currentPage]);

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const nextPage = () => goToPage(currentPage + 1);
  const prevPage = () => goToPage(currentPage - 1);

  return {currentPage, totalPages, currentData, goToPage, nextPage, prevPage, pageSize: PAGE_SIZE, totalItems: data.length, startIndex: (currentPage - 1) * PAGE_SIZE + 1, endIndex: Math.min(currentPage * PAGE_SIZE, data.length)};
};
