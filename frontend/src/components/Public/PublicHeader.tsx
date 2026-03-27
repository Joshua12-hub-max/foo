import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import logo from '@/assets/meycauayan-logo.png';
import { Menu, X, LogIn } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const PublicHeader = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', path: '/careers', exact: true },
    { name: 'About', path: '/careers/about' },
    { name: 'Jobs', path: '/careers/jobs' },
    { name: 'Contact us', path: '/careers/contact' },
  ];

  const checkActive = (link: typeof navLinks[0]) => {
    if (link.exact) return location.pathname === link.path;
    return location.pathname.startsWith(link.path);
  };

  return (
    <header>
      <nav 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isScrolled 
            ? 'bg-white/95 backdrop-blur-md border-b border-slate-200 py-2 shadow-sm' 
            : 'bg-slate-50/50 backdrop-blur-sm border-b border-transparent py-3.5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-12 flex justify-between items-center relative">
          {/* Logo Section */}
          <div 
              id="header-logo"
              className="flex items-center gap-3.5 cursor-pointer group" 
              onClick={() => navigate('/careers')}
          >
              <div className="relative">
                <img 
                    src={logo} 
                    alt="Meycauayan Logo" 
                    className="w-11 h-11 object-contain transition-transform duration-500 group-hover:scale-105 relative z-10" 
                />
                <div className={`absolute inset-0 blur-xl rounded-full transition-opacity duration-500 opacity-0 group-hover:opacity-100 ${isScrolled ? 'bg-green-500/20' : 'bg-slate-400/10'}`}></div>
              </div>
              <div className="flex flex-col">
                    <span className={`font-black text-xs sm:text-[13px] md:text-sm leading-none tracking-tight transition-colors ${isScrolled ? 'text-slate-900' : 'text-slate-800'}`}>
                    City Human Resource Management Office Job Portal
                  </span>
                  <span className={`text-[9px] font-bold tracking-tight transition-colors mt-0.5 ${isScrolled ? 'text-green-600/80' : 'text-slate-500'}`}>
                    City Government of Meycauayan
                  </span>
              </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-10">
              <div className="flex items-center gap-8">
                {navLinks.map((link) => (
                    <button
                        id={`nav-link-${link.name.toLowerCase().replace(/\s+/g, '-')}`}
                        key={link.path}
                        onClick={() => navigate(link.path)}
                        className={`relative py-1 text-[15px] font-semibold tracking-tight transition-all duration-300 ${
                            checkActive(link)
                            ? 'text-green-600'
                            : 'text-slate-500 hover:text-slate-900'
                        }`}
                    >
                        {link.name}
                        {checkActive(link) && (
                            <motion.div 
                                layoutId="nav-underline-master"
                                className="absolute -bottom-1 left-0 right-0 h-0.5 rounded-full bg-green-500"
                            />
                        )}
                    </button>
                ))}
              </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button 
              id="mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 rounded-xl transition-all bg-slate-100 text-slate-900 border border-slate-200"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Dropdown */}
      <AnimatePresence>
        {mobileMenuOpen && (
            <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="md:hidden fixed inset-x-4 top-20 bg-white/98 backdrop-blur-2xl rounded-2xl border border-slate-200 z-50 p-6 shadow-2xl overflow-hidden"
            >
                <div className="flex flex-col gap-1.5 relative z-10">
                  {navLinks.map((link) => (
                      <button
                      id={`mobile-nav-link-${link.name.toLowerCase().replace(/\s+/g, '-')}`}
                      key={link.path}
                      onClick={() => {
                          navigate(link.path);
                          setMobileMenuOpen(false);
                      }}
                      className={`w-full text-left px-5 py-3.5 rounded-xl font-semibold text-[15px] tracking-tight transition-all ${
                          checkActive(link)
                          ? 'bg-green-50 text-green-600'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                      >
                      {link.name}
                      </button>
                  ))}

                </div>
                <div className="absolute top-[-50%] right-[-20%] w-[200px] h-[200px] bg-green-500/5 rounded-full blur-[80px]"></div>
            </motion.div>
        )}
      </AnimatePresence>
      
      {/* Dynamic Spacer */}
      <div className="h-24 md:h-28"></div>
    </header>
  );
};

export default PublicHeader;
