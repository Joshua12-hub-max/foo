
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
      const response = await axios.get(`/biometrics/enroll/status/${employeeId}`);
      return response.data; // Returns { success: true, isEnrolled: boolean }
    } catch (error) {
        console.error('Failed to check enrollment status:', error);
        // Return a default safe value on error to prevent UI crash
        return { isEnrolled: false };
    }
}
