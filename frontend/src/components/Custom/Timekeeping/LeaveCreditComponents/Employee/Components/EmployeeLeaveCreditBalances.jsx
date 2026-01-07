export const EmployeeLeaveCreditBalances = ({ credits }) => {
  return (
    <div className="flex-1 overflow-hidden rounded-xl bg-[#F8F9FA] p-1">
      <div className="overflow-x-auto bg-[#F8F9FA] rounded-lg">
        <table className="w-full">
          <thead className="bg-gray-200 shadow-md text-gray-700">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-bold tracking-wide">Leave Type</th>
              <th className="px-6 py-4 text-right text-sm font-bold tracking-wide">Balance (days)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {credits.length ? credits.map((c, i) => (
              <tr key={i} className="hover:bg-[#F8F9FA] hover:shadow-xl transition-colors">
                <td className="px-6 py-4 text-sm text-gray-800">{c.credit_type}</td>
                <td className="px-6 py-4 text-sm text-gray-800 text-right font-semibold">{c.balance}</td>
              </tr>
            )) : (
              <tr>
                <td colSpan="2" className="px-6 py-12 text-center text-gray-500">No credits found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
