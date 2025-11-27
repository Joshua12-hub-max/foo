
import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { getEmployees, startFingerprintEnrollment, checkEnrollmentStatus } from '../../api/employeeApi';
import { CheckCircle, XCircle } from 'lucide-react';

const BiometricsEnrollment = () => {
  const { sidebarOpen } = useOutletContext?.() || { sidebarOpen: true };
  
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [isEnrolled, setIsEnrolled] = useState(null); // null = checking, true = enrolled, false = not
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  // Fetch employees on component mount
  useEffect(() => {
    const fetchEmployees = async () => {
      setIsLoading(true);
      try {
        const employeeData = await getEmployees();
        setEmployees(employeeData);
        setError('');
      } catch (err) {
        setError('Failed to load employees. Please try again.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchEmployees();
  }, []);

  // Check status when employee is selected
  useEffect(() => {
    const checkStatus = async () => {
        if (!selectedEmployee) {
            setIsEnrolled(null);
            return;
        }
        try {
            const result = await checkEnrollmentStatus(selectedEmployee);
            setIsEnrolled(result.isEnrolled);
        } catch (e) {
            console.error(e);
        }
    };
    checkStatus();
  }, [selectedEmployee]);

  const handleEnrollClick = async () => {
    if (!selectedEmployee) {
      setError('Please select an employee first.');
      return;
    }

    setIsLoading(true);
    setError('');
    setStatusMessage('');

    try {
      const result = await startFingerprintEnrollment(selectedEmployee);
      setStatusMessage(result.message + ' Please place your finger on the scanner now.');
    } catch (err) {
      setError(err.toString());
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col bg-gradient-to-br from-neutral-100 to-stone-50 rounded-xl shadow-xl p-7 w-full overflow-hidden text-gray-800 transition-all duration-300 ${!sidebarOpen ? 'max-w-[1600px] xl:max-w-[88vw]' : 'max-w-[1400px] xl:max-w-[77vw]'}`}>
      
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[#274b46]">Biometrics Enrollment</h1>
        <p className="text-gray-500">Enroll new fingerprints for employees.</p>
      </div>

      <hr className="mb-6 border-[1px] border-[#274b46]" />

      <div className="bg-white p-6 rounded-lg shadow-md max-w-lg mx-auto">
        <div className="mb-4">
          <label htmlFor="employee-select" className="block text-sm font-medium text-gray-700 mb-2">
            Select Employee
          </label>
          <select
            id="employee-select"
            value={selectedEmployee}
            onChange={(e) => setSelectedEmployee(e.target.value)}
            className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            disabled={isLoading}
          >
            <option value="">-- Please choose an employee --</option>
            {employees.map(emp => (
              <option key={emp.id} value={emp.employee_id}>
                {emp.last_name}, {emp.first_name} ({emp.employee_id})
              </option>
            ))}
          </select>
        </div>

        {selectedEmployee && (
            <div className="mb-6 flex items-center gap-2">
                <span className="text-sm font-medium text-gray-600">Enrollment Status:</span>
                {isEnrolled === true ? (
                    <span className="flex items-center gap-1 text-green-600 font-bold text-sm">
                        <CheckCircle className="w-4 h-4" /> Enrolled
                    </span>
                ) : isEnrolled === false ? (
                    <span className="flex items-center gap-1 text-gray-500 text-sm">
                        <XCircle className="w-4 h-4" /> Not Enrolled
                    </span>
                ) : (
                    <span className="text-gray-400 text-sm">Checking...</span>
                )}
            </div>
        )}

        <div className="flex items-center justify-end">
          <button
            onClick={handleEnrollClick}
            disabled={isLoading || !selectedEmployee}
            className="px-6 py-2 bg-[#274b46] text-white font-semibold rounded-lg shadow-md hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#274b46] disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Processing...' : (isEnrolled ? 'Re-Enroll Fingerprint' : 'Enroll Fingerprint')}
          </button>
        </div>

        {error && (
            <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                <p className="font-bold">Error</p>
                <p>{error}</p>
            </div>
        )}
        {statusMessage && (
            <div className="mt-4 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg">
                <p className="font-bold">Status</p>
                <p>{statusMessage}</p>
            </div>
        )}
      </div>

    </div>
  );
};

export default BiometricsEnrollment;
