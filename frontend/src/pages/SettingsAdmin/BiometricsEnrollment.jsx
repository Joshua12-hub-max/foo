
import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { getEmployees, startFingerprintEnrollment, checkEnrollmentStatus } from '../../api/employeeApi';
import { register } from '../../Service/Auth';
import { CheckCircle, XCircle, UserPlus, X } from 'lucide-react';

// Internal Modal Component for Adding Employees
const AddEmployeeModal = ({ isOpen, onClose, onSuccess }) => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    role: 'employee',
    department: '',
    employeeId: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await register(form);
      onSuccess();
      onClose();
      setForm({ name: '', email: '', role: 'employee', department: '', employeeId: '', password: '' });
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to create employee.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 relative animate-in fade-in zoom-in duration-200">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={20} />
        </button>
        
        <h2 className="text-xl font-bold text-[#274b46] mb-4 flex items-center gap-2">
          <UserPlus size={24} />
          Add New Employee
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input 
              type="text" name="name" required 
              value={form.name} onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#274b46] focus:border-transparent outline-none"
              placeholder="e.g. John Doe"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input 
              type="email" name="email" required 
              value={form.email} onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#274b46] focus:border-transparent outline-none"
              placeholder="john@company.com"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
              <input 
                type="text" name="department" required 
                value={form.department} onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#274b46] focus:border-transparent outline-none"
                placeholder="IT"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID</label>
              <input 
                type="text" name="employeeId" required 
                value={form.employeeId} onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#274b46] focus:border-transparent outline-none"
                placeholder="EMP-001"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Temporary Password
            </label>
            <input 
              type="password" name="password" required 
              value={form.password} onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#274b46] focus:border-transparent outline-none"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-red-600 text-sm bg-red-50 p-2 rounded">{error}</p>}

          <div className="flex justify-end gap-3 mt-6">
            <button 
              type="button" onClick={onClose}
              className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-50 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" disabled={loading}
              className="px-4 py-2 bg-[#274b46] text-white font-medium rounded-lg hover:bg-[#1e3a36] transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Employee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const BiometricsEnrollment = () => {
  const { sidebarOpen } = useOutletContext?.() || { sidebarOpen: true };
  
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [isEnrolled, setIsEnrolled] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

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

  useEffect(() => {
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
      
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-[#274b46]">Biometrics Enrollment</h1>
          <p className="text-gray-500">Enroll new fingerprints for employees.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#274b46] text-white rounded-lg hover:bg-[#1e3a36] transition-colors shadow-sm"
        >
          <UserPlus size={18} />
          Add New Employee
        </button>
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

      <AddEmployeeModal 
        isOpen={showAddModal} 
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
            fetchEmployees();
            setStatusMessage('Employee created successfully! Select them from the list to enroll.');
        }}
      />

    </div>
  );
};
