import { useState, useMemo, useCallback } from "react";

export const usePagination = (data, pageSize = 10) => {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(data.length / pageSize);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return data.slice(start, start + pageSize);
  }, [data, currentPage, pageSize]);

  const handlePageChange = useCallback(
    (direction) => {
      setCurrentPage((prev) => {
        if (direction === "next" && prev < totalPages) return prev + 1;
        if (direction === "prev" && prev > 1) return prev - 1;
        return prev;
      });
    },
    [totalPages]
  );

  const resetPage = useCallback(() => {
    setCurrentPage(1);
  }, []);

  return {
    currentPage,
    totalPages,
    paginatedData,
    handlePageChange,
    resetPage,
  };
};
