import React from 'react';
import PublicHeader from './PublicHeader';
import { motion } from 'framer-motion';
import LiveChatWidget from './LiveChatWidget';
import { Shield, Mail, Phone, MapPin } from 'lucide-react';
import logo from '@/assets/meycauayan-logo.png';

interface PublicLayoutProps {
  children: React.ReactNode;
}

const PublicLayout: React.FC<PublicLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-[#131314] font-sans text-slate-100 flex flex-col selection:bg-green-600 selection:text-white w-full overflow-x-hidden">
      <PublicHeader />
      
      {/* Main Content with Fade-in Entry */}
      <motion.main 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="flex-grow flex flex-col"
      >
        {children}
      </motion.main>

      {/* Premium Footer - Master Balance */}
      <footer className="bg-[#1e1e1f] border-t border-[#444746] pt-16 pb-12 mt-auto overflow-hidden relative">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-start gap-12 mb-16">
            {/* Brand Section */}
            <div className="space-y-6 max-w-md">
              <div className="flex items-center gap-3">
                <img 
                  src={logo} 
                  alt="Meycauayan Logo" 
                  className="w-10 h-10 object-contain" 
                />
                <div>
                  <h3 className="font-black text-white tracking-tighter text-[15px] sm:text-lg leading-none">City Human Resource Management Office</h3>
                  <p className="text-[10px] font-bold text-slate-500 tracking-tight mt-1">City Government of Meycauayan</p>
                </div>
              </div>
              <p className="text-slate-500 text-[13px] font-semibold leading-relaxed">
                Empowering the City of Meycauayan through professional human resource management and innovative public service protocols.
              </p>
            </div>

            {/* Digital Terminal - Essential Contact */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 md:gap-16">
              <div className="space-y-4">
                <p className="text-[10px] font-black text-slate-400 tracking-tight leading-none mb-1">Communication</p>
                <div className="flex items-center gap-2">
                  <Mail className="text-slate-600" size={14} />
                  <p className="text-white text-xs font-bold font-mono">hr@meycauayan.gov.ph</p>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="text-slate-600" size={14} />
                  <p className="text-white text-xs font-bold">(044) 123-4567</p>
                </div>
              </div>
              <div className="space-y-4">
                <p className="text-[10px] font-black text-slate-400 tracking-tight leading-none mb-1">Location</p>
                <div className="flex items-center gap-2">
                  <MapPin className="text-slate-600" size={14} />
                  <p className="text-white text-xs font-bold">City Hall, Meycauayan</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Copyright */}
          <div className="pt-8 border-t border-[#444746] flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex flex-col gap-1">
              <p className="text-slate-400 text-[10px] font-black tracking-tight">
                © {new Date().getFullYear()} City Government of Meycauayan.
              </p>
              <p className="text-slate-300 text-[9px] font-bold tracking-tight">Official job portal</p>
            </div>
            
            <div className="flex items-center gap-4 px-4 py-2 bg-white/5 rounded-full border border-white/5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="text-slate-500 text-[10px] font-black tracking-tight">Live Support Active</span>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-green-500/5 blur-[100px] -mb-32 -mr-32 rounded-full"></div>
      </footer>

      <LiveChatWidget />
    </div>
  );
};

export default PublicLayout;
