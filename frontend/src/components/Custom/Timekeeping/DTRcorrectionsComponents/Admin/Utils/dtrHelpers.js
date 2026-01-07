export const getUniqueValues = (data, field) => {
  return [...new Set(data.map(item => item[field]))].sort();
};

export const filterData = (data, searchQuery, filters) => {
  const query = searchQuery.toLowerCase().trim();
  
  return data.filter((item) => {
    // Search query filter
    const matchesSearch = !query || (
      item.name.toLowerCase().includes(query) ||
      item.id.toLowerCase().includes(query) ||
      item.department.toLowerCase().includes(query)
    );

    // Department filter
    const matchesDepartment = !filters.department || item.department === filters.department;

    // Employee filter
    const matchesEmployee = !filters.employee || item.name === filters.employee;

    // Date range filter
    const itemDate = new Date(item.date);
    let matchesDateRange = true;

    if (filters.fromDate) {
      const fromDate = new Date(filters.fromDate);
      if (itemDate < fromDate) {
        matchesDateRange = false;
      }
    }

    if (filters.toDate && matchesDateRange) {
      const toDate = new Date(filters.toDate);
      if (itemDate > toDate) {
        matchesDateRange = false;
      }
    }

    return matchesSearch && matchesDepartment && matchesEmployee && matchesDateRange;
  });
};

export const calculatePagination = (data, currentPage, itemsPerPage) => {
  const totalPages = Math.ceil(data.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  
  return {
    totalPages,
    startIndex,
    endIndex,
    currentItems: data.slice(startIndex, endIndex),
  };
};

export const adjustPageAfterDelete = (currentPage, totalItems, itemsPerPage) => {
  const newTotalPages = Math.ceil(totalItems / itemsPerPage);
  if (currentPage > newTotalPages && newTotalPages > 0) {
    return newTotalPages;
  }
  return currentPage;
};