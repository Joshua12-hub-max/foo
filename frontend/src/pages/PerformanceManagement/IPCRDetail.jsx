import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchIPCR, deleteIPCRItem } from '../../api/spmsApi';
import { Trash2, ArrowLeft } from 'lucide-react';

const IPCRDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ipcr, setIpcr] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const result = await fetchIPCR(id);
      if (result.success) setIpcr(result.ipcr);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleDeleteItem = async (itemId) => {
      if(!confirm("Delete this target?")) return;
      try {
          await deleteIPCRItem(itemId);
          loadData();
      } catch(e) {
          alert("Failed to delete item");
      }
  }

  if (loading) return <div className="p-8">Loading...</div>;
  if (!ipcr) return <div className="p-8">IPCR not found</div>;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6 flex items-center gap-4">
         <button onClick={() => navigate(-1)} className="p-2 bg-white rounded-full shadow hover:bg-gray-100">
             <ArrowLeft size={20}/>
         </button>
         <div>
            <h1 className="text-2xl font-bold text-gray-800">IPCR: {ipcr.employee_first_name} {ipcr.employee_last_name}</h1>
            <p className="text-gray-500">{ipcr.cycle_title} - {ipcr.status}</p>
         </div>
      </div>

      {/* Info Card */}
      <div className="bg-white p-6 rounded-xl shadow-sm mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
              <label className="text-xs text-gray-500 uppercase">Department</label>
              <p className="font-semibold">{ipcr.employee_department}</p>
          </div>
          <div>
              <label className="text-xs text-gray-500 uppercase">Position</label>
              <p className="font-semibold">{ipcr.employee_job_title}</p>
          </div>
          <div>
              <label className="text-xs text-gray-500 uppercase">Rater</label>
              <p className="font-semibold">{ipcr.rater_first_name} {ipcr.rater_last_name}</p>
          </div>
          <div>
              <label className="text-xs text-gray-500 uppercase">Approver</label>
              <p className="font-semibold">{ipcr.approver_first_name} {ipcr.approver_last_name}</p>
          </div>
      </div>

      {/* Targets / Items */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h2 className="font-bold text-gray-800">Performance Targets (MFOs/KRAs)</h2>
              <button className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded text-sm font-medium hover:bg-indigo-100">
                  + Add Target
              </button>
          </div>
          <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600">
                  <tr>
                      <th className="px-6 py-3">MFO / KRA</th>
                      <th className="px-6 py-3">Success Indicator</th>
                      <th className="px-6 py-3">Target</th>
                      <th className="px-6 py-3 text-center">Weight</th>
                      <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                  {ipcr.items && ipcr.items.map(item => (
                      <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                              <p className="font-medium">{item.kra_title || 'N/A'}</p>
                              <p className="text-xs text-gray-500">{item.output_description}</p>
                          </td>
                          <td className="px-6 py-4 max-w-xs truncate">{item.success_indicator}</td>
                          <td className="px-6 py-4">{item.target}</td>
                          <td className="px-6 py-4 text-center">{item.weight}%</td>
                          <td className="px-6 py-4 text-right">
                              <button onClick={() => handleDeleteItem(item.id)} className="text-red-500 hover:text-red-700">
                                  <Trash2 size={16}/>
                              </button>
                          </td>
                      </tr>
                  ))}
                  {(!ipcr.items || ipcr.items.length === 0) && (
                      <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-400">No targets defined yet.</td></tr>
                  )}
              </tbody>
          </table>
      </div>

    </div>
  );
};

export default IPCRDetail;