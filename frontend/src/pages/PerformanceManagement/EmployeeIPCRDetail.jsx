import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  fetchIPCR, 
  addIPCRItem, 
  updateIPCRItem, 
  deleteIPCRItem, 
  commitIPCR,
  submitIPCRForRating, // Note: Employee usually "Commits", then submits accomplishments.
  acknowledgeIPCR,
  disagreeWithRating,
  fetchKRAs
} from '../../api/spmsApi';
import { 
  ArrowLeft, Plus, Trash2, Edit2, Save, X, 
  CheckCircle, AlertCircle, MessageSquare, Send
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const EmployeeIPCRDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ipcr, setIpcr] = useState(null);
  const [loading, setLoading] = useState(true);
  const [availableKRAs, setAvailableKRAs] = useState([]);
  
  // Modal/Form States
  const [showAddItem, setShowAddItem] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [showAcknowledge, setShowAcknowledge] = useState(false);
  const [acknowledgeRemarks, setAcknowledgeRemarks] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadData();
    loadKRAs();
  }, [id]);

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

  const loadKRAs = async () => {
      try {
          // Ideally fetch based on department, but fetchKRAs might return all or filterable
          const result = await fetchKRAs(); 
          if(result.success) setAvailableKRAs(result.kras);
      } catch(e) {
          console.error(e);
      }
  }

  // --- Actions ---

  const handleAddItem = async (data) => {
      try {
          setIsProcessing(true);
          const res = await addIPCRItem(id, data);
          if(res.success) {
              setShowAddItem(false);
              loadData();
          } else {
              alert(res.message);
          }
      } catch(e) {
          alert("Failed to add target");
      } finally {
          setIsProcessing(false);
      }
  };

  const handleUpdateItem = async (itemId, data) => {
      try {
          setIsProcessing(true);
          const res = await updateIPCRItem(itemId, data);
          if(res.success) {
              setEditingItem(null);
              loadData();
          } else {
              alert(res.message);
          }
      } catch(e) {
          alert("Failed to update target");
      } finally {
          setIsProcessing(false);
      }
  };

  const handleDeleteItem = async (itemId) => {
      if(!confirm("Are you sure you want to delete this target?")) return;
      try {
          await deleteIPCRItem(itemId);
          loadData();
      } catch(e) {
          alert("Failed to delete item");
      }
  };

  const handleCommit = async () => {
      if(!confirm("Are you sure you want to COMMIT this IPCR? You will not be able to add/remove targets after this.")) return;
      try {
          setIsProcessing(true);
          const res = await commitIPCR(id);
          if(res.success) loadData();
          else alert(res.message);
      } catch(e) {
          alert("Commit failed");
      } finally {
          setIsProcessing(false);
      }
  };

  const handleSubmitAccomplishment = async () => {
      // This is usually done later in the cycle.
      if(!confirm("Submit accomplishments for rating? Ensure all 'Actual Accomplishments' are filled.")) return;
      try {
          setIsProcessing(true);
          const res = await submitIPCRForRating(id); // Using the endpoint that moves it to 'For Rating'
          if(res.success) loadData();
          else alert(res.message);
      } catch(e) {
          alert("Submission failed");
      } finally {
          setIsProcessing(false);
      }
  };

  const handleAcknowledgeRating = async (agree) => {
      if(!agree) {
          // Handle disagreement logic (maybe open another modal)
          const remarks = prompt("Please state your reason for disagreement:");
          if(!remarks) return;
          try {
              setIsProcessing(true);
              await disagreeWithRating(id, remarks); // Need to ensure this API exists or use acknowledge with flag
              // Actually acknowledgeIPCR endpoint usually handles both via 'agree' flag or similar, 
              // but standard flow might separate them. Let's use acknowledgeIPCR for agreement.
              alert("Disagreement recorded.");
              loadData();
          } catch(e) { alert("Error"); } finally { setIsProcessing(false); }
          return;
      }

      try {
          setIsProcessing(true);
          const res = await acknowledgeIPCR(id, { employee_remarks: acknowledgeRemarks, agree: true });
          if(res.success) {
              setShowAcknowledge(false);
              loadData();
          } else alert(res.message);
      } catch(e) {
          alert("Acknowledge failed");
      } finally {
          setIsProcessing(false);
      }
  }

  // --- Rendering ---

  if (loading) return <div className="p-8 text-center">Loading IPCR...</div>;
  if (!ipcr) return <div className="p-8 text-center">IPCR not found</div>;

  const isDraft = ipcr.status === 'Draft';
  const isCommitted = ipcr.status === 'Committed';
  const isRated = ipcr.status === 'Rated';

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
         <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-2 bg-white rounded-full shadow hover:bg-gray-100 transition-colors">
                <ArrowLeft size={20}/>
            </button>
            <div>
                <h1 className="text-2xl font-bold text-gray-800">My IPCR: {ipcr.cycle_title}</h1>
                <p className="text-sm text-gray-500">Status: <span className="font-semibold text-indigo-600">{ipcr.status}</span></p>
            </div>
         </div>

         <div className="flex gap-2">
             {isDraft && (
                 <button 
                    onClick={handleCommit}
                    disabled={isProcessing}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm"
                 >
                    <CheckCircle size={18} /> Commit IPCR
                 </button>
             )}
             {isCommitted && (
                 <button 
                    onClick={handleSubmitAccomplishment}
                    disabled={isProcessing}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm"
                 >
                    <Send size={18} /> Submit for Rating
                 </button>
             )}
             {isRated && (
                 <button 
                    onClick={() => setShowAcknowledge(true)}
                    disabled={isProcessing}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 shadow-sm"
                 >
                    <CheckCircle size={18} /> Review & Acknowledge
                 </button>
             )}
         </div>
      </div>

      {/* Info Card */}
      <div className="bg-white p-6 rounded-xl shadow-sm mb-6 border border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                  <label className="text-xs text-gray-500 uppercase font-semibold">Immediate Supervisor</label>
                  <p className="font-medium text-gray-800">{ipcr.rater_first_name} {ipcr.rater_last_name}</p>
                  <p className="text-xs text-gray-500">{ipcr.rater_job_title}</p>
              </div>
              <div>
                  <label className="text-xs text-gray-500 uppercase font-semibold">Head of Office</label>
                  <p className="font-medium text-gray-800">{ipcr.approver_first_name} {ipcr.approver_last_name}</p>
              </div>
               <div>
                  <label className="text-xs text-gray-500 uppercase font-semibold">Final Rating</label>
                  {ipcr.final_average_rating ? (
                       <div>
                           <span className="text-xl font-bold text-emerald-600">{ipcr.final_average_rating}</span>
                           <span className="ml-2 text-sm text-gray-600">({ipcr.adjectival_rating})</span>
                       </div>
                  ) : <p className="text-gray-400 italic">Not yet rated</p>}
              </div>
          </div>
      </div>

      {/* Targets List */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h2 className="font-bold text-gray-800 flex items-center gap-2">
                  <AlertCircle size={18} className="text-indigo-600"/>
                  Performance Targets (MFOs/KRAs)
              </h2>
              {isDraft && (
                  <button 
                    onClick={() => setShowAddItem(true)}
                    className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-medium hover:bg-indigo-100 flex items-center gap-1"
                  >
                      <Plus size={16}/> Add Target
                  </button>
              )}
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-600">
                    <tr>
                        <th className="px-6 py-3 min-w-[200px]">MFO / KRA</th>
                        <th className="px-6 py-3 min-w-[200px]">Success Indicator</th>
                        <th className="px-6 py-3">Target</th>
                        <th className="px-6 py-3 text-center">Weight</th>
                        {/* Show accomplishments column if not draft */}
                        {!isDraft && <th className="px-6 py-3">Actual Accomplishment</th>}
                        {!isDraft && <th className="px-6 py-3 text-center">Rating</th>}
                        <th className="px-6 py-3 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {ipcr.items && ipcr.items.map(item => (
                        <tr key={item.id} className="hover:bg-gray-50">
                            {/* Display Logic or Edit Form Logic could go here, but using Modal for Edit is cleaner */}
                            <td className="px-6 py-4 align-top">
                                <p className="font-medium text-gray-800">{item.kra_title || 'Custom KRA'}</p>
                                <p className="text-xs text-gray-500 mt-1">{item.output_description}</p>
                            </td>
                            <td className="px-6 py-4 align-top text-gray-600">{item.success_indicator}</td>
                            <td className="px-6 py-4 align-top text-gray-600">{item.target}</td>
                            <td className="px-6 py-4 align-top text-center font-medium">{item.weight}%</td>
                            
                            {!isDraft && (
                                <td className="px-6 py-4 align-top">
                                    {isCommitted ? (
                                        <button 
                                            onClick={() => setEditingItem(item)} // Reuse edit modal for accomplishment
                                            className="text-blue-600 text-xs hover:underline"
                                        >
                                            {item.accomplishment ? 'Update Accomplishment' : '+ Add Accomplishment'}
                                        </button>
                                    ) : (
                                        <span className="text-gray-700">{item.accomplishment || '-'}</span>
                                    )}
                                    {isCommitted && item.accomplishment && (
                                        <p className="mt-1 text-gray-700 text-sm">{item.accomplishment}</p>
                                    )}
                                </td>
                            )}
                            
                            {!isDraft && (
                                <td className="px-6 py-4 align-top text-center">
                                    {item.average_rating ? (
                                        <span className="font-bold text-gray-800">{item.average_rating}</span>
                                    ) : '-'}
                                </td>
                            )}

                            <td className="px-6 py-4 align-top text-right">
                                {isDraft && (
                                    <div className="flex justify-end gap-2">
                                        <button onClick={() => setEditingItem(item)} className="p-1 text-blue-500 hover:bg-blue-50 rounded">
                                            <Edit2 size={16}/>
                                        </button>
                                        <button onClick={() => handleDeleteItem(item.id)} className="p-1 text-red-500 hover:bg-red-50 rounded">
                                            <Trash2 size={16}/>
                                        </button>
                                    </div>
                                )}
                            </td>
                        </tr>
                    ))}
                    {(!ipcr.items || ipcr.items.length === 0) && (
                        <tr><td colSpan="7" className="px-6 py-8 text-center text-gray-400">No targets added yet. Click "+ Add Target" to begin.</td></tr>
                    )}
                </tbody>
            </table>
          </div>
      </div>

      {/* Add/Edit Modal */}
      {(showAddItem || editingItem) && (
          <ItemModal 
            isOpen={true}
            isEdit={!!editingItem}
            initialData={editingItem}
            kras={availableKRAs}
            isAccomplishmentMode={!isDraft && isCommitted}
            onClose={() => { setShowAddItem(false); setEditingItem(null); }}
            onSubmit={(data) => editingItem ? handleUpdateItem(editingItem.id, data) : handleAddItem(data)}
            isProcessing={isProcessing}
          />
      )}

      {/* Acknowledge Modal */}
      {showAcknowledge && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl w-full max-w-md shadow-xl p-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Review & Acknowledge</h3>
                  <p className="text-sm text-gray-600 mb-4">
                      By acknowledging, you confirm that you have discussed this performance rating with your supervisor.
                  </p>
                  <textarea
                      className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none mb-4"
                      rows="3"
                      placeholder="Add your remarks/comments here (optional)..."
                      value={acknowledgeRemarks}
                      onChange={(e) => setAcknowledgeRemarks(e.target.value)}
                  ></textarea>
                  <div className="flex gap-3">
                      <button 
                        onClick={() => handleAcknowledgeRating(false)}
                        className="flex-1 px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50"
                      >
                          Disagree
                      </button>
                      <button 
                        onClick={() => handleAcknowledgeRating(true)}
                        className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                      >
                          Acknowledge
                      </button>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};

// Item Modal (Add/Edit Target OR Update Accomplishment)
const ItemModal = ({ isOpen, isEdit, initialData, kras, isAccomplishmentMode, onClose, onSubmit, isProcessing }) => {
    const [formData, setFormData] = useState({
        kra_id: '',
        output_description: '',
        success_indicator: '',
        target: '',
        weight: '10',
        accomplishment: ''
    });

    useEffect(() => {
        if(initialData) {
            setFormData({
                kra_id: initialData.kra_id || '',
                output_description: initialData.output_description || '',
                success_indicator: initialData.success_indicator || '',
                target: initialData.target || '',
                weight: initialData.weight || '10',
                accomplishment: initialData.accomplishment || ''
            });
        }
    }, [initialData]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    if(!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-lg shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="font-bold text-gray-800">
                        {isAccomplishmentMode ? 'Update Accomplishment' : (isEdit ? 'Edit Target' : 'Add New Target')}
                    </h3>
                    <button onClick={onClose}><X size={20} className="text-gray-400"/></button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
                    {/* If just updating accomplishment, hide other fields or make read-only */}
                    {!isAccomplishmentMode && (
                        <>
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Select KRA (Optional)</label>
                                <select 
                                    value={formData.kra_id}
                                    onChange={(e) => setFormData({...formData, kra_id: e.target.value})}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500"
                                >
                                    <option value="">-- Custom / Other --</option>
                                    {kras.map(k => (
                                        <option key={k.id} value={k.id}>{k.title}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Output Description *</label>
                                <textarea
                                    required
                                    rows="2"
                                    value={formData.output_description}
                                    onChange={(e) => setFormData({...formData, output_description: e.target.value})}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500"
                                    placeholder="e.g., Processed applications"
                                ></textarea>
                            </div>
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Success Indicator *</label>
                                <textarea
                                    required
                                    rows="2"
                                    value={formData.success_indicator}
                                    onChange={(e) => setFormData({...formData, success_indicator: e.target.value})}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500"
                                    placeholder="e.g., 100% of applications processed within 24 hours"
                                ></textarea>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">Target Quantity/Quality *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.target}
                                        onChange={(e) => setFormData({...formData, target: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500"
                                        placeholder="e.g., 500 applications"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">Weight (%) *</label>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        max="100"
                                        value={formData.weight}
                                        onChange={(e) => setFormData({...formData, weight: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500"
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    {isAccomplishmentMode && (
                        <div>
                             <div className="bg-gray-50 p-3 rounded mb-4 text-sm">
                                 <p><span className="font-semibold">Target:</span> {formData.target}</p>
                                 <p><span className="font-semibold">Indicator:</span> {formData.success_indicator}</p>
                             </div>
                             <label className="block text-sm text-gray-600 mb-1">Actual Accomplishment *</label>
                             <textarea
                                required
                                rows="4"
                                value={formData.accomplishment}
                                onChange={(e) => setFormData({...formData, accomplishment: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500"
                                placeholder="Describe what you actually achieved..."
                            ></textarea>
                        </div>
                    )}

                    <div className="pt-4 flex gap-3">
                        <button type="button" onClick={onClose} className="flex-1 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200">Cancel</button>
                        <button type="submit" disabled={isProcessing} className="flex-1 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                            {isProcessing ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default EmployeeIPCRDetail;
