import { X, Mail, Video, Globe } from 'lucide-react';

const ScheduleInterviewModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  selectedApplicant,
  scheduleData,
  setScheduleData
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/40 transition-opacity" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Clean Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white z-10">
          <h3 className="text-lg font-bold text-gray-800">Schedule Interview</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto">
          <p className="text-sm text-gray-500 mb-6 bg-blue-50 text-blue-700 px-4 py-3 rounded-lg border border-blue-100 flex items-center gap-2">
            <Mail size={16} />
            <span>This will send an invitation email to <strong>{selectedApplicant?.first_name}</strong>.</span>
          </p>
          
          <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                  <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Date</label>
                      <input 
                        type="date" 
                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-gray-200 outline-none transition-all" 
                        value={scheduleData.date}
                        onChange={e => setScheduleData({...scheduleData, date: e.target.value})} 
                      />
                  </div>
                  <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Time</label>
                      <input 
                        type="time" 
                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-gray-200 outline-none transition-all" 
                        value={scheduleData.time}
                        onChange={e => setScheduleData({...scheduleData, time: e.target.value})} 
                      />
                  </div>
              </div>

              <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">Platform</label>
                  <div className="flex gap-3">
                      <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${scheduleData.platform === 'Google Meet' ? 'bg-blue-50 border-blue-200 text-blue-700 font-medium' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
                          <input type="radio" name="platform" value="Google Meet" className="hidden" checked={scheduleData.platform === 'Google Meet'} onChange={e => setScheduleData({...scheduleData, platform: e.target.value})} />
                          <Video size={16} /> Google Meet
                      </label>
                      <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${scheduleData.platform === 'Zoom' ? 'bg-blue-50 border-blue-200 text-blue-700 font-medium' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
                          <input type="radio" name="platform" value="Zoom" className="hidden" checked={scheduleData.platform === 'Zoom'} onChange={e => setScheduleData({...scheduleData, platform: e.target.value})} />
                          <Video size={16} /> Zoom
                      </label>
                  </div>
              </div>

              <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Meeting Link</label>
                  <div className="relative">
                    <Globe size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                        type="url" 
                        placeholder="e.g., https://meet.google.com/abc-defg-hij" 
                        className="w-full pl-9 p-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-gray-200 outline-none transition-all"
                        value={scheduleData.link}
                        onChange={e => setScheduleData({...scheduleData, link: e.target.value})}
                    />
                  </div>
              </div>

              <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Message / Notes</label>
                  <textarea 
                      className="w-full p-3 border border-gray-200 rounded-lg h-24 text-sm focus:ring-2 focus:ring-gray-200 outline-none transition-all resize-none"
                      placeholder="Additional instructions for the applicant..."
                      value={scheduleData.notes}
                      onChange={e => setScheduleData({...scheduleData, notes: e.target.value})}
                  ></textarea>
              </div>
          </div>
        </div>

        <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
            <button 
              onClick={onClose} 
              className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-all shadow-sm"
            >
              Cancel
            </button>
            <button 
              onClick={onConfirm} 
              className="px-4 py-2 text-sm font-bold text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-all shadow-md flex items-center gap-2"
            >
              <Mail size={16} /> Send Invitation
            </button>
        </div>
      </div>
    </div>
  );
};

export default ScheduleInterviewModal;
