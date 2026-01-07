export const filterData = (data, searchQuery, filters) => {
  const query = searchQuery.toLowerCase().trim();
  
  return data.filter((item) => {
    const matchesSearch = !query || (
      item.employeeName?.toLowerCase().includes(query) ||
      item.employeeid?.toLowerCase().includes(query) ||
      item.department?.toLowerCase().includes(query)
    );

    const matchesDepartment = !filters.department || item.department === filters.department;
    const matchesEmployee = !filters.employee || item.employeeName === filters.employee;

    const itemDate = new Date(item.date);
    let matchesDateRange = true;

    if (filters.fromDate) {
      const fromDate = new Date(filters.fromDate);
      if (itemDate < fromDate) matchesDateRange = false;
    }

    if (filters.toDate && matchesDateRange) {
      const toDate = new Date(filters.toDate);
      if (itemDate > toDate) matchesDateRange = false;
    }

    return matchesSearch && matchesDepartment && matchesEmployee && matchesDateRange;
  });
};

export const getUniqueValues = (data, key) => {
  return [...new Set(data.map(item => item[key]))].sort();
};

export const calculatePagination = (filteredData, currentPage, itemsPerPage) => {
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  
  return {
    totalPages,
    startIndex,
    endIndex,
    currentItems: filteredData.slice(startIndex, endIndex)
  };
};

export const adjustPageAfterDelete = (dataLength, currentPage, itemsPerPage) => {
  const newTotalPages = Math.ceil(dataLength / itemsPerPage);
  if (currentPage > newTotalPages && newTotalPages > 0) {
    return newTotalPages;
  }
  return currentPage;
};