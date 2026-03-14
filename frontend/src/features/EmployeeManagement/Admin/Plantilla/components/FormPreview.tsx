import React, { memo } from 'react';
import { Download, X } from 'lucide-react';
import type { Form33Data } from '@/api/complianceApi';

interface FormPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  data: Form33Data | null;
  type: 'form33';
}

const FormPreview: React.FC<FormPreviewProps> = memo(({ isOpen, onClose, data, type }) => {
  if (!isOpen || !data) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[95vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Toolbar */}
        <div className="bg-gray-900 text-white px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500 rounded-lg">
                <FileTextIcon />
            </div>
            <div>
                <h3 className="text-sm font-black uppercase tracking-tight">Official Document Preview</h3>
                <p className="text-[10px] text-white/60 font-bold tracking-widest uppercase">
                    {type === 'form33' ? 'CS FORM NO. 33-A (REVISED 2018)' : 'Compliance Report'}
                </p>
            </div>
          </div>
          <div className="flex items-center gap-2">

            <button className="p-2 hover:bg-white/10 rounded-lg transition-colors" title="Download PDF">
                <Download size={18} />
            </button>
            <div className="w-px h-6 bg-white/20 mx-2" />
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                <X size={20} />
            </button>
          </div>
        </div>

        {/* Document Content */}
        <div className="flex-1 overflow-y-auto bg-gray-100 p-8 flex justify-center">
          <div className="bg-white w-[8.5in] min-h-[11in] shadow-lg p-[1in] text-gray-900 font-serif leading-tight">
            {type === 'form33' && <CSForm33 data={data} />}
          </div>
        </div>
      </div>
    </div>
  );
});

// Mock Official Icon
const FileTextIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <line x1="10" y1="9" x2="8" y2="9" />
    </svg>
);

// High-fidelity CS Form 33 Layout
const CSForm33 = ({ data }: { data: Form33Data }) => (
    <div className="text-[12px]">
        <div className="flex justify-between items-start mb-10">
            <div className="font-bold italic">
                CS Form No. 33-A<br/>
                Revised 2018
            </div>
            <div className="text-center">
                <div className="text-[14px] font-bold">Republic of the Philippines</div>
                <div className="text-[16px] font-black uppercase tracking-tighter mt-1">{data.department}</div>
                <div className="text-[12px] font-medium text-gray-500 mt-1">LGU NEBR, Plantilla Management System</div>
            </div>
            <div className="w-24 text-right">
                {/* Space for QR/Barcode */}
            </div>
        </div>

        <h1 className="text-center text-[18px] font-black uppercase mb-12 tracking-[0.2em] border-y-2 border-black py-2">
            APPOINTMENT FORM
        </h1>

        <div className="mb-8">
            <p className="mb-4">Mr./Ms. <strong>{data.firstName} {data.middleName ? `${data.middleName[0]}.` : ''} {data.lastName}</strong></p>
            <p className="leading-relaxed">
                You are hereby appointed as <strong>{data.positionTitle}</strong> (SG {data.salaryGrade}) 
                under <strong>{data.status}</strong> status at the <strong>{data.department}</strong> 
                with a monthly compensation of <strong>{new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(data.monthlySalary)}</strong>.
            </p>
        </div>

        <div className="grid grid-cols-2 gap-12 mt-16 mb-20">
            <div>
                <div className="text-[10px] uppercase font-bold text-gray-400 mb-8 border-b border-gray-100 pb-1">Position Details</div>
                <div className="space-y-4">
                    <div>
                        <div className="text-[10px] uppercase font-black text-gray-500">Item Number</div>
                        <div className="text-[13px] font-bold">{data.itemNumber}</div>
                    </div>
                    <div>
                        <div className="text-[10px] uppercase font-black text-gray-500">Nature of Appointment</div>
                        <div className="text-[13px] font-bold">{data.natureOfAppointment}</div>
                    </div>
                    <div>
                        <div className="text-[10px] uppercase font-black text-gray-500">Page of Plantilla</div>
                        <div className="text-[13px] font-bold">2026-B-14</div>
                    </div>
                </div>
            </div>
            <div className="flex flex-col justify-end">
                <div className="border-t-2 border-black pt-2 text-center">
                    <div className="font-black uppercase text-[14px]">MAYOR JUAN DELA CRUZ</div>
                    <div className="text-[10px] uppercase font-medium">Appointing Officer / Head of Agency</div>
                    <div className="text-[10px] font-bold mt-4 italic">Date of Signing: {new Date(data.dateOfSigning).toLocaleDateString()}</div>
                </div>
            </div>
        </div>

        <div className="bg-gray-50 p-6 rounded-lg border border-dashed border-gray-300 text-[10px] italic text-gray-500">
            Note: This is a system-generated preview based on official DBM and CSC guidelines (Form 33-A Revised 2018). 
            Final printed versions must be signed and dry-sealed by the Appointing Authority.
        </div>
    </div>
);

FormPreview.displayName = 'FormPreview';

export default FormPreview;
