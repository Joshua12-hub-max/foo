import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import logo from '../../assets/meycauayan-logo.png';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const PublicHeader = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Handle scroll effect for glassmorphism
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isActive = (path: string) => location.pathname === path;

  const navLinks = [
    { name: 'Home', path: '/careers', exact: true },
    { name: 'About', path: '/careers/about' },
    { name: 'Jobs', path: '/careers/jobs' },
    { name: 'Contact', path: '/careers/contact' },
  ];

  const checkActive = (link: typeof navLinks[0]) => {
    if (link.exact) return location.pathname === link.path;
    return location.pathname.startsWith(link.path);
  };

  return (
    <>
      <nav 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b border-transparent ${
          isScrolled 
            ? 'bg-white/80 backdrop-blur-md border-slate-200/60 shadow-sm py-2' 
            : 'bg-white/0 py-4'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex justify-between items-center">
          {/* Logo */}
          <div 
              className="flex items-center gap-3 cursor-pointer group" 
              onClick={() => navigate('/careers')}
          >
              <motion.img 
                whileHover={{ rotate: 5 }}
                src={logo} 
                alt="Meycauayan Logo" 
                className="w-10 h-10 object-contain drop-shadow-sm" 
              />
              <div className="flex flex-col">
                  <span className="font-bold text-sm md:text-base text-slate-900 leading-tight">
                    City Human Resource Management Office
                  </span>
                  <span className="text-[10px] md:text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Meycauayan City, Bulacan
                  </span>
              </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2">
              <div className="flex bg-slate-100/50 p-1 rounded-full border border-slate-200/50 backdrop-blur-sm mr-4">
                {navLinks.map((link) => (
                    <button
                        key={link.path}
                        onClick={() => navigate(link.path)}
                        className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                            checkActive(link)
                            ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-100' 
                            : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'
                        }`}
                    >
                        {link.name}
                    </button>
                ))}
              </div>
              
              <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate('/login')} 
                  className="bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold px-6 py-2.5 rounded-full transition-all shadow-lg shadow-slate-900/10"
              >
                  Employee Login
              </motion.button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Dropdown */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden fixed top-[64px] left-0 right-0 bg-white border-b border-slate-200 z-40 overflow-hidden shadow-xl"
          >
            <div className="p-4 flex flex-col gap-2">
              {navLinks.map((link) => (
                <button
                  key={link.path}
                  onClick={() => {
                    navigate(link.path);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-colors ${
                     checkActive(link)
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {link.name}
                </button>
              ))}
              <div className="h-px bg-slate-100 my-2"></div>
              <button 
                onClick={() => navigate('/login')}
                className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl"
              >
                Employee Login
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Spacer to prevent content overlap with fixed header */}
      <div className="h-24"></div>
    </>
  );
};

export default PublicHeader;
