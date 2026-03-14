import { PublicInquiries } from '@applicant/Components';
import { useUIStore } from '@/stores';

const InquiriesPage = () => {
  const sidebarOpen = useUIStore((state) => state.sidebarOpen);
  
  return (
    <div className={`min-h-screen flex flex-col bg-gradient-to-br from-neutral-100 to-stone-50 rounded-xl shadow-xl p-7 w-full overflow-hidden text-gray-800 transition-all duration-300 ${sidebarOpen ? 'max-w-[1400px] xl:max-w-[77vw]' : 'max-w-[1600px] xl:max-w-[88vw]'}`}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">Public Inquiries</h2>
          <p className="text-sm text-gray-600 mt-1">Manage and respond to public inquiries from the website</p>
        </div>
      </div>
      <hr className="mb-6 border-gray-200" />
      <PublicInquiries />
    </div>
  );
};

export default InquiriesPage;
