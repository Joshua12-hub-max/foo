import { Check } from "lucide-react";

const Employeeattendancesuccessbanner = ({ successMessage, setSuccessMessage }) => {
    if (!successMessage) return null;
    
    return (
        <div className="bg-green-50 border-l-4 border-[#274b46] text-green-800 px-4 py-3 rounded mb-4 flex items-start gap-3 animate-slide-down" role="alert" aria-live="polite">
            <Check className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
                <p className="font-medium">Success</p>
                <p className="text-sm">{successMessage}</p>
            </div>
            <button
                onClick={() => setSuccessMessage(null)}
                className="text-green-700 hover:text-green-900"
                aria-label="Dismiss success message"
            >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
    );
};

export default Employeeattendancesuccessbanner;