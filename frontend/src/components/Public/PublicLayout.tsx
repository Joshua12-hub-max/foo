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
    <div className="min-h-screen bg-white font-sans text-gray-900 flex flex-col selection:bg-accent selection:text-white w-full overflow-x-hidden">
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

      {/* ZED Footer */}
      <footer className="bg-white border-t border-gray-200 pt-16 pb-12 mt-auto overflow-hidden relative">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-start gap-12 mb-16">
            {/* Brand Section */}
            <div className="space-y-6 max-w-md">
                <div className="flex items-center gap-4">
                  <img
                    src={logo}
                    alt="Meycauayan Logo"
                    className="w-12 h-12 object-contain"
                  />
                  <div>
                    <h3 className="font-bold text-gray-900 text-base sm:text-lg leading-tight">City Human Resource Management Office</h3>
                    <p className="text-sm text-gray-500 mt-1">City Government of Meycauayan</p>
                  </div>
                </div>
                <p className="text-gray-600 text-base leading-relaxed font-medium">
                  Empowering the City of Meycauayan through professional human resource management and innovative public service protocols.
                </p>
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 md:gap-16">
              <div className="space-y-4">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Communication</p>
                <div className="flex items-center gap-3">
                  <Mail className="text-accent" size={18} />
                  <p className="text-gray-700 text-sm font-medium">hr@meycauayan.gov.ph</p>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="text-accent" size={18} />
                  <p className="text-gray-700 text-sm font-medium">(044) 123-4567</p>
                </div>
              </div>
              <div className="space-y-4">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Location</p>
                <div className="flex items-center gap-3">
                  <MapPin className="text-accent" size={18} />
                  <p className="text-gray-700 text-sm font-medium">City Hall, Meycauayan</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Copyright */}
          <div className="pt-8 border-t border-gray-200 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex flex-col gap-2">
              <p className="text-gray-600 text-sm font-medium">
                © {new Date().getFullYear()} City Government of Meycauayan.
              </p>
              <p className="text-gray-500 text-xs font-medium">Official job portal</p>
            </div>

            <div className="flex items-center gap-3 px-4 py-2 bg-accent/5 rounded-full border border-accent/20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
              </span>
              <span className="text-gray-700 text-sm font-medium">Live Support Active</span>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-accent/5 blur-[100px] -mb-32 -mr-32 rounded-full"></div>
      </footer>

      <LiveChatWidget />
    </div>
  );
};

export default PublicLayout;
