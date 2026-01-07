/**
 * SignatoriesSection Component
 * Displays the three signatory boxes for performance reviews
 */

const SignatoriesSection = ({
  employeeName,
  reviewerName,
  approvingAuthority = 'Head of Office'
}) => {
  return (
    <div className="bg-white rounded-sm shadow-sm border border-gray-200 overflow-hidden mt-8">
      <div className="bg-[#F8F9FA] px-6 py-4 border-b border-gray-200 text-center">
        <h3 className="font-bold text-gray-800 uppercase tracking-widest text-[10px]">
          SIGNATORIES
        </h3>
      </div>
      <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-12">
        {/* Ratee */}
        <div className="text-center space-y-2">
          <div className="h-12 border-b border-gray-300"></div>
          <p className="font-bold text-gray-800">{employeeName || 'Employee Name'}</p>
          <p className="text-xs text-gray-500 uppercase">Ratee</p>
        </div>

        {/* HR Admin */}
        <div className="text-center space-y-2">
          <div className="h-12 border-b border-gray-300"></div>
          <p className="font-bold text-gray-800">{reviewerName || 'HR Admin'}</p>
          <p className="text-xs text-gray-500 uppercase">HR Admin</p>
        </div>

        {/* Approving Authority */}
        <div className="text-center space-y-2">
          <div className="h-12 border-b border-gray-300"></div>
          <p className="font-bold text-gray-800">{approvingAuthority}</p>
          <p className="text-xs text-gray-500 uppercase">Approving Authority</p>
        </div>
      </div>
    </div>
  );
};

export default SignatoriesSection;
