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
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mt-8">
      <h3 className="text-sm font-bold text-gray-400 uppercase mb-8 text-center tracking-widest">
        Signatories
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
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
