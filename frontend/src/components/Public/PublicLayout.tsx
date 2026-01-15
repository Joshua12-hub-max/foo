import React from 'react';
import PublicHeader from './PublicHeader';
import { motion } from 'framer-motion';

interface PublicLayoutProps {
  children: React.ReactNode;
}

const PublicLayout: React.FC<PublicLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col selection:bg-blue-100 selection:text-blue-900">
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

      {/* Optional: Simple Footer */}
      <footer className="bg-white border-t border-slate-200 py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-6 text-center text-slate-500 text-sm">
          <p>© {new Date().getFullYear()} City Government of Meycauayan. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;
