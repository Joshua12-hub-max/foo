import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Users, Mail, Briefcase, Calendar, Hash, ArrowRight } from 'lucide-react';
import { useEmployeeDepartment, type Colleague } from '@features/EmployeeManagement/Employee/Portal/Department/useEmployeeDepartment';
import { useAuth } from '@/hooks/useAuth';

interface MyDepartmentPageProps {
  hideHeader?: boolean;
}

interface DepartmentData {
  id: number;
  name: string;
  description?: string;
  headOfDepartment?: string;
}

interface EmployeeRecord {
  id: number;
  firstName?: string;
  lastName?: string;
  email?: string;
  employeeId?: string;
  jobTitle?: string;
  employmentStatus?: string;
  dateHired?: string;
  avatarUrl?: string;
}

const MyDepartmentPage: React.FC<MyDepartmentPageProps> = ({ hideHeader = false }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    departmentData,
    colleagues,
    totalMembers,
    loading,
    error,
    refresh
  } = useEmployeeDepartment();

  // Find current user's record
  const myRecord = colleagues.find((emp: Colleague) => String(emp.id) === String(user?.id) || emp.email === user?.email);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800"></div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Department Overview Card */}
      <div className="bg-gray-50 rounded-xl border border-gray-200 p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div>
              <h2 className="text-lg font-bold text-gray-800">{departmentData?.name || 'Department'}</h2>
              <p className="text-sm text-gray-500">{departmentData?.description || 'Your assigned department'}</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-xs text-gray-500 font-medium">Department Head</p>
              <p className="text-sm font-semibold text-gray-800">{departmentData?.headOfDepartment || 'Not assigned'}</p>
            </div>
            <div className="h-8 w-px bg-gray-200"></div>
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-gray-200">
              <Users size={16} className="text-gray-500" />
              <span className="text-sm font-bold text-gray-800">{totalMembers}</span>
              <span className="text-xs text-gray-500">members</span>
            </div>
          </div>
        </div>
      </div>

      {/* My Employment Record */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="text-base font-bold text-gray-800">Employment Record</h3>
          <button 
            onClick={() => navigate('/employee-dashboard/my-profile')}
            className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 px-5 py-2.5 rounded-lg shadow-sm transition-all active:scale-95 text-sm font-bold"
          >
            View Full Profile
            <ArrowRight size={14} />
          </button>
        </div>

        {myRecord ? (
          <div className="p-5">
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Employee Avatar & Name */}
              <div className="flex items-center gap-4 lg:w-64 lg:border-r lg:border-gray-100 lg:pr-6">
                <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600 font-bold text-xl border border-gray-200 overflow-hidden flex-shrink-0">
                  {myRecord.avatarUrl ? (
                    <img src={myRecord.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    `${myRecord.firstName?.[0] || 'U'}${myRecord.lastName?.[0] || ''}`
                  )}
                </div>
                <div>
                  <p className="font-bold text-gray-800">{myRecord.firstName} {myRecord.lastName}</p>
                  <p className="text-sm text-gray-500">{myRecord.jobTitle || 'Employee'}</p>
                  <span className={`inline-block mt-1 px-2 py-0.5 text-xs font-semibold rounded ${
                    myRecord.employmentStatus === 'Active' || !myRecord.employmentStatus
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {myRecord.employmentStatus || 'Active'}
                  </span>
                </div>
              </div>

              {/* Employment Details Grid */}
              <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-5">
                <div>
                  <div className="flex items-center gap-1.5 text-gray-400 mb-1">
                    <Hash size={12} />
                    <span className="text-xs font-medium">Employee ID</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-800">{myRecord.employeeId || '---'}</p>
                </div>
                
                <div>
                  <div className="flex items-center gap-1.5 text-gray-400 mb-1">
                    <Mail size={12} />
                    <span className="text-xs font-medium">Email</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-800 truncate">{myRecord.email}</p>
                </div>
                
                <div>
                  <div className="flex items-center gap-1.5 text-gray-400 mb-1">
                    <Building2 size={12} />
                    <span className="text-xs font-medium">Department</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-800">{departmentData?.name}</p>
                </div>
                
                <div>
                  <div className="flex items-center gap-1.5 text-gray-400 mb-1">
                    <Calendar size={12} />
                    <span className="text-xs font-medium">Date Hired</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-800">
                    {myRecord.dateHired 
                      ? new Date(myRecord.dateHired).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        }) 
                      : '---'
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Briefcase size={20} className="text-gray-400" />
            </div>
            <p className="text-sm text-gray-500">Employment record is being processed...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyDepartmentPage;
