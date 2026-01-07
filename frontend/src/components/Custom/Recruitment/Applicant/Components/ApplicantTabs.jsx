const ApplicantTabs = ({ activeTab, setActiveTab }) => {
  const tabs = ['All', 'Pending', 'Reviewed', 'Interview', 'Hired'];

  return (
    <div className="flex gap-4 mb-6 border-b border-gray-200">
      {tabs.map(tab => (
        <button
          key={tab}
          onClick={() => setActiveTab(tab)}
          className={`pb-2 px-1 text-sm font-medium transition-colors ${activeTab === tab ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
};

export default ApplicantTabs;
