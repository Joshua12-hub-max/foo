import React, { useState } from 'react';
import { register } from '@/Service/Auth';
import { X } from 'lucide-react';

interface AddEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface RegisterFormState {
  name: string;
  email: string;
  role: string;
  department: string;
  employeeId: string;
  password: string;
}

const AddEmployeeModal: React.FC<AddEmployeeModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [form, setForm] = useState<RegisterFormState>({
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await register(form);
      onSuccess();
      onClose();
      setForm({ name: '', email: '', role: 'employee', department: '', employeeId: '', password: '' });
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to create employee.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border-2 border-gray-200 animate-in fade-in zoom-in duration-200">
        <div className="bg-gray-100 px-6 py-4 flex justify-between items-center border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-800">
            Add New Employee
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-red-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Full Name</label>
            <input 
              type="text" name="name" required 
              value={form.name} onChange={handleChange}
              className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl text-gray-800 text-sm focus:outline-none focus:border-gray-300 transition-all shadow-sm"
              placeholder="e.g. John Doe"
            />
          </div>
          
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Email</label>
            <input 
              type="email" name="email" required 
              value={form.email} onChange={handleChange}
              className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl text-gray-800 text-sm focus:outline-none focus:border-gray-300 transition-all shadow-sm"
              placeholder="john@company.com"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Department</label>
              <input 
                type="text" name="department" required 
                value={form.department} onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl text-gray-800 text-sm focus:outline-none focus:border-gray-300 transition-all shadow-sm"
                placeholder="IT"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Employee ID</label>
              <input 
                type="text" name="employeeId" required 
                value={form.employeeId} onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl text-gray-800 text-sm focus:outline-none focus:border-gray-300 transition-all shadow-sm"
                placeholder="EMP-001"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
              Temporary Password
            </label>
            <input 
              type="password" name="password" required 
              value={form.password} onChange={handleChange}
              className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl text-gray-800 text-sm focus:outline-none focus:border-gray-300 transition-all shadow-sm"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-red-600 text-[11px] font-bold bg-red-50 p-3 rounded-lg border border-red-100 animate-in fade-in slide-in-from-top-1">{error}</p>}

          <div className="flex justify-end gap-3 pt-4">
            <button 
              type="button" onClick={onClose}
              className="flex-1 px-4 py-3 bg-white border border-gray-200 text-gray-700 font-bold text-sm rounded-xl hover:bg-gray-50 transition-all shadow-sm"
            >
              Cancel
            </button>
            <button 
              type="submit" disabled={loading}
              className="flex-1 px-4 py-3 bg-gray-900 text-white font-bold text-sm rounded-xl hover:bg-gray-800 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 shadow-lg"
            >
              {loading ? 'Creating...' : 'Create Employee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEmployeeModal;
