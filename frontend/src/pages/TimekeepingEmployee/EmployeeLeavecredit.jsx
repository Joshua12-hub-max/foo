import { useState } from 'react';
import { useEmployeeLeaveCredit } from '../../components/Custom/LeaveCreditComponents/Employee/Hooks/useEmployeeLeaveCredit';
import { EmployeeLeaveCreditHeader } from '../../components/Custom/LeaveCreditComponents/Employee/Components/EmployeeLeaveCreditHeader';
import { EmployeeLeaveCreditNotification } from '../../components/Custom/LeaveCreditComponents/Employee/Components/EmployeeLeaveCreditNotification';
import { EmployeeLeaveCreditBalances } from '../../components/Custom/LeaveCreditComponents/Employee/Components/EmployeeLeaveCreditBalances';
import { EmployeeLeaveCreditRequests } from '../../components/Custom/LeaveCreditComponents/Employee/Components/EmployeeLeaveCreditRequests';
import { EmployeeLeaveCreditLoadingSpinner } from '../../components/Custom/LeaveCreditComponents/Employee/Components/EmployeeLeaveCreditLoadingSpinner';
import { RequestCreditModal } from '../../components/Custom/LeaveCreditComponents/Employee/Modals/RequestCreditModal';

const EmployeeLeavecredit = () => {
  const { credits, requests, isLoading, error, success, isModalOpen, formData, isSubmitting, 
          fetchData, handleSubmit, handleFormChange, openModal, closeModal, formatDate } = useEmployeeLeaveCredit();
  
  const [activeTab, setActiveTab] = useState('balances');

  // Count pending requests
  const pendingCount = requests.filter(r => r.status === 'Pending').length;

  if (isLoading) {
    return <EmployeeLeaveCreditLoadingSpinner />;
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <EmployeeLeaveCreditHeader onRefresh={fetchData} onOpenModal={openModal} />

      <EmployeeLeaveCreditNotification error={error} success={success} />

      {/* Toggle Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('balances')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            activeTab === 'balances'
              ? 'bg-gray-200 text-gray-700 shadow-md'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          My Balances
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${
            activeTab === 'requests'
              ? 'bg-gray-200 text-gray-700 shadow-md'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          My Credit Requests
          {pendingCount > 0 && (
            <span className="px-2 py-0.5 text-xs bg-amber-400 text-amber-900 rounded-full font-semibold">
              {pendingCount}
            </span>
          )}
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'balances' && <EmployeeLeaveCreditBalances credits={credits} />}
      {activeTab === 'requests' && <EmployeeLeaveCreditRequests requests={requests} formatDate={formatDate} />}

      <RequestCreditModal isOpen={isModalOpen} onClose={closeModal}
        formData={formData}
        onFormChange={handleFormChange}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

export default EmployeeLeavecredit;
