
import axios from './axios';

export const getEmployees = async () => {
  try {
    const response = await axios.get('/auth/users');
    return response.data.data;
  } catch (error) {
    console.error('Failed to fetch employees:', error);
    throw error.response?.data?.message || 'An error occurred while fetching employees.';
  }
};

export const startFingerprintEnrollment = async (employeeId) => {
  try {
    const response = await axios.post('/biometrics/enroll/start', { employeeId });
    return response.data;
  } catch (error) {
    console.error('Failed to start fingerprint enrollment:', error);
    throw error.response?.data?.message || 'An error occurred during enrollment.';
  }
};

export const checkEnrollmentStatus = async (employeeId) => {
    try {
      // This is a simplified check. We query the users and see if a fingerprint is now associated.
      // A more direct endpoint `/biometrics/enroll/status/{employeeId}` would be better in a real app.
      const response = await axios.get(`/auth/users`); // Re-fetching all users
      const employees = response.data.data;
      const targetEmployee = employees.find(e => e.employee_id === employeeId);
      
      // We don't have a direct "has_fingerprint" flag. We'll need to add another endpoint to check this.
      // For now, this part of the logic cannot be fully implemented without another backend change.
      // I will proceed with creating the UI and we can add the polling logic later.
      return { isEnrolled: false }; // Placeholder
    } catch (error) {
        console.error('Failed to check enrollment status:', error);
        throw error.response?.data?.message || 'An error occurred while checking status.';
    }
}
