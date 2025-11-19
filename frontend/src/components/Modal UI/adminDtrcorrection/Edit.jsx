import { useState, useEffect } from "react";
import { Edit, Check } from "lucide-react";

export function EditModal({ isOpen, onClose, record, onSave }) {
  const [form, setForm] = useState(record || {});

  // Fix: Sync form state when record changes
  useEffect(() => {
    setForm(record || {});
  }, [record]);

  if (!isOpen || !record) return null;

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-[#F8F9FA] rounded-lg shadow-2xl w-full max-w-md overflow-hidden">
        
        {/* Header */}
        <div className="bg-[#274b46] px-4 py-4 text-[#F8F9FA]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 flex items-center justify-center">
              <Edit className="w-4 h-4 text-[#F8F9FA]" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Edit Correction</h3>
              <p className="text-xs text-white">Update Employee Record</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          <div className="bg-[#F8F9FA] p-4 rounded-lg shadow-md border border-gray-400 space-y-3">

            {/* Name */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">Name</label>
              <input
                type="text"
                name="name"
                value={form.name || ""}
                onChange={handleChange}
                placeholder="Enter name"
                className="w-full border-2 border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all"
              />
            </div>

            {/* Department */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">Department</label>
              <input
                type="text"
                name="department"
                value={form.department || ""}
                onChange={handleChange}
                placeholder="Enter department"
                className="w-full border-2 border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all"
              />
            </div>

            {/* Time In/Out */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">Time In</label>
                <input
                  type="text"
                  name="timeIn"
                  value={form.timeIn || ""}
                  onChange={handleChange}
                  placeholder="08:00 AM"
                  className="w-full border-2 border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">Time Out</label>
                <input
                  type="text"
                  name="timeOut"
                  value={form.timeOut || ""}
                  onChange={handleChange}
                  placeholder="05:00 PM"
                  className="w-full border-2 border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">Corrected Time</label>
              <input
                type="text"
                name="correctedTime"
                value={form.correctedTime || ""}
                onChange={handleChange}
                placeholder="05:00 PM"
                className="w-full border-2 border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all"
              />
            </div>

            {/* Reason */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">Reason</label>
              <textarea
                name="reason"
                value={form.reason || ""}
                onChange={handleChange}
                placeholder="Enter reason for correction"
                className="w-full border-2 border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all resize-none h-20"
              />
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-4 py-4 border-t border-gray-200 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-[#F2F2F2] hover:bg-[#F8F9FA] text-gray-800 font-semibold py-2 text-sm rounded-lg shadow-md border border-gray-300 transition-colors duration-200"
          >
            Cancel
          </button>

          <button
            onClick={() => {
              onSave(form);
              onClose();
            }}
            className="flex-1 px-3 py-2 text-sm border-2 border-green-600 text-green-700 rounded-lg font-semibold hover:bg-green-50 active:scale-95 transition-all shadow-sm flex items-center justify-center gap-2"
          >
            <Check size={16} />
            Save Changes
          </button>
        </div>

      </div>
    </div>
  );
}
