import api from './axios';

/**
 * Department Reports API
 * Custom REST API for department attendance reports
 */

/**
 * Fetch department list for filter dropdown
 * @returns {Promise<string[]>} - Array of department names
 */
export const fetchDepartmentList = async () => {
  try {
    const response = await api.get('/department-reports/departments');
    return response.data;
  } catch (error) {
    console.error('Error fetching department list:', error);
    throw error;
  }
};

/**
 * Fetch department attendance summary
 * @param {Object} params - Query parameters
 * @param {string} params.fromDate - Start date (YYYY-MM-DD)
 * @param {string} params.toDate - End date (YYYY-MM-DD)
 * @param {string} params.department - Department filter (optional, 'all' for all departments)
 * @returns {Promise<Object>} - Summary data with meta
 */
export const fetchDepartmentSummary = async (params = {}) => {
  try {
    const response = await api.get('/department-reports/summary', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching department summary:', error);
    throw error;
  }
};

/**
 * Fetch detailed attendance records for a specific department
 * @param {string} department - Department name
 * @param {Object} params - Query parameters
 * @param {string} params.fromDate - Start date (YYYY-MM-DD)
 * @param {string} params.toDate - End date (YYYY-MM-DD)
 * @param {string} params.status - Status filter (optional)
 * @param {string} params.search - Search query (optional)
 * @param {number} params.page - Page number
 * @param {number} params.limit - Items per page
 * @returns {Promise<Object>} - Details data with meta
 */
export const fetchDepartmentDetails = async (department, params = {}) => {
  try {
    const response = await api.get(`/department-reports/details/${encodeURIComponent(department)}`, { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching department details:', error);
    throw error;
  }
};

/**
 * Fetch export data for department report
 * @param {Object} params - Query parameters
 * @param {string} params.fromDate - Start date (YYYY-MM-DD)
 * @param {string} params.toDate - End date (YYYY-MM-DD)
 * @param {string} params.department - Department filter (optional)
 * @returns {Promise<Object>} - Export data grouped by department
 */
export const fetchExportData = async (params = {}) => {
  try {
    const response = await api.get('/department-reports/export', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching export data:', error);
    throw error;
  }
};

/**
 * Fetch report history
 * @returns {Promise<Object>} - List of saved reports
 */
export const fetchReportHistory = async () => {
  try {
    const response = await api.get('/department-reports/history');
    return response.data;
  } catch (error) {
    console.error('Error fetching report history:', error);
    throw error;
  }
};

/**
 * Save a generated report
 * @param {Object} reportData - Report data to save
 * @returns {Promise<Object>} - Saved report info
 */
export const saveReport = async (reportData) => {
  try {
    const response = await api.post('/department-reports/history', reportData);
    return response.data;
  } catch (error) {
    console.error('Error saving report:', error);
    throw error;
  }
};

/**
 * Delete a saved report
 * @param {number} id - Report ID to delete
 * @returns {Promise<Object>} - Deletion confirmation
 */
export const deleteReport = async (id) => {
  try {
    const response = await api.delete(`/department-reports/history/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting report:', error);
    throw error;
  }
};
