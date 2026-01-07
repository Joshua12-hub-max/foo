import { useState, useEffect } from "react";
import { X, Check, Edit } from "lucide-react";

const EditDailyTimeRecordsModal = ({ isOpen, onClose, correctionData, onUpdate }) => {
const [formValues, setFormValues] = useState({ date: "", timeIn: "", timeOut: "", correctedTime: "", reason: "", });

  useEffect(() => {
    const convertTo24Hour = (time12h) => {
      if (!time12h || !time12h.includes(' ')) return "";
      const [time, modifier] = time12h.split(' ');
      let [hours, minutes] = time.split(':');
  
      if (modifier === 'PM' && hours !== '12') {
          hours = parseInt(hours, 10) + 12;
      }
      if (modifier === 'AM' && hours === '12') {
          hours = '00';
      }
  
      return `${String(hours).padStart(2, '0')}:${minutes}`;
    }

    if (correctionData) {
      setFormValues({
        date: correctionData.date,
        timeIn: convertTo24Hour(correctionData.timeIn),
        timeOut: convertTo24Hour(correctionData.timeOut),
        correctedTime: convertTo24Hour(correctionData.correctedTime),
        reason: correctionData.reason,
      });
    }
  }, [correctionData]);

  const handleChange = (field, value) => {
    setFormValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleUpdate = () => {
    const formatTime = (time24) => {
      if (!time24) return "";
      let [hours, minutes] = time24.split(":");
      hours = parseInt(hours, 10);
      const period = hours >= 12 ? "PM" : "AM";
      hours = hours % 12 || 12;
      return `${String(hours)}:${minutes.padStart(2, "0")} ${period}`;
    };

    const updatedData = {
      ...correctionData,
      date: formValues.date,
      timeIn: formatTime(formValues.timeIn),
      timeOut: formatTime(formValues.timeOut),
      correctedTime: formatTime(formValues.correctedTime),
      reason: formValues.reason,
    };

    onUpdate(updatedData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden flex flex-col" style={{ height: 'auto', maxHeight: '90vh' }}>
        
        {/* HEADER */}
        <div className="bg-[#274b46] flex items-center justify-between p-4 border-b relative">
            <div className="flex items-center gap-2 z-10">
              <div className="w-8 h-8 flex items-center justify-center">
                 <Edit className="w-4 h-4 text-[#F8F9FA]"/>
              </div>
              <div>
                <h2 className="text-sm font-semibold text-white">Edit Daily Time Records</h2>
                <p className="text-xs text-white mt-1">Edit your request</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors absolute top-5 right-5 z-20"
              aria-label="Close modal"
            >
              <X size={20} />
            </button>
        </div>

        {/* FORM */}
        <div className="p-4">
          <div className="bg-[#F8F9FA] border-2 border-gray-200 rounded-xl p-4 shadow-md hover:shadow-lg transition-shadow">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Date
                </label>
                <input
                  type="date"
                  value={formValues.date}
                  onChange={(e) => handleChange("date", e.target.value)}
                  className="w-full px-4 py-2 text-sm border-2 rounded-lg bg-white focus:outline-none transition-all border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-100"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Time In
                </label>
                <input
                  type="time"
                  value={formValues.timeIn}
                  onChange={(e) => handleChange("timeIn", e.target.value)}
                  className="w-full px-4 py-2 text-sm border-2 rounded-lg bg-white focus:outline-none transition-all border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-100"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Time Out
                </label>
                <input
                  type="time"
                  value={formValues.timeOut}
                  onChange={(e) => handleChange("timeOut", e.target.value)}
                  className="w-full px-4 py-2 text-sm border-2 rounded-lg bg-white focus:outline-none transition-all border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-100"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Corrected Time
                </label>
                <input
                  type="time"
                  value={formValues.correctedTime}
                  onChange={(e) => handleChange("correctedTime", e.target.value)}
                  className="w-full px-4 py-2 text-sm border-2 rounded-lg bg-white focus:outline-none transition-all border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-100"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Reason
                </label>
                <textarea
                  value={formValues.reason}
                  onChange={(e) => handleChange("reason", e.target.value)}
                  className="w-full px-4 py-2 text-sm border-2 rounded-lg bg-white resize-none focus:outline-none transition-all border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-100"
                  placeholder="Explain the correction..."
                  rows="4"
                />
              </div>
            </div>

            {/* FOOTER BUTTONS */}
            <div className="flex gap-2 mt-4">
              <button
                onClick={onClose}
                className="flex-1 px-3 py-2 text-sm border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 active:scale-95 transition-all shadow-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                className="flex-1 px-3 py-2 text-sm border-2 border-green-600 text-green-700 rounded-lg font-semibold hover:bg-green-50 active:scale-95 transition-all shadow-sm flex items-center justify-center gap-2"
              >
                <Check size={16} />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditDailyTimeRecordsModal;
