import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import logo from '@/assets/meycauayan-logo.png';
import { Menu, X, LogIn } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from "@hooks/useAuth";

const PublicHeader = () => {
  const { user, logout } = useAuth();
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
    { name: 'Contact Us', path: '/careers/contact' },
  ];

  const checkActive = (link: typeof navLinks[0]) => {
    if (link.exact) return location.pathname === link.path;
    return location.pathname.startsWith(link.path);
  };

  return (
    <>
      <nav 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isScrolled 
            ? 'bg-slate-950/98 backdrop-blur-md border-b border-white/5 py-2' 
            : 'bg-white border-b border-slate-50 py-3.5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 h-12 flex justify-between items-center">
          {/* Logo Section */}
          <div 
              className="flex items-center gap-3.5 cursor-pointer group" 
              onClick={() => navigate('/careers')}
          >
              <div className="relative">
                <img 
                    src={logo} 
                    alt="Meycauayan Logo" 
                    className="w-11 h-11 object-contain transition-transform duration-500 group-hover:scale-105 relative z-10" 
                />
                <div className={`absolute inset-0 blur-xl rounded-full transition-opacity duration-500 opacity-0 group-hover:opacity-100 ${isScrolled ? 'bg-indigo-500/20' : 'bg-slate-400/10'}`}></div>
              </div>
              <div className="flex flex-col">
                  <span className={`font-black text-lg leading-none tracking-tight transition-colors ${isScrolled ? 'text-white' : 'text-slate-950'}`}>
                    HR Portal
                  </span>
                  <span className={`text-[9px] font-bold tracking-[0.2em] transition-colors mt-0.5 ${isScrolled ? 'text-indigo-400/80' : 'text-slate-500'}`}>
                    CITY OF MEYCAUAYAN
                  </span>
              </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-10">
              <div className="flex items-center gap-8">
                {navLinks.map((link) => (
                    <button
                        key={link.path}
                        onClick={() => navigate(link.path)}
                        className={`relative py-1 text-[15px] font-semibold tracking-tight transition-all duration-300 ${
                            checkActive(link)
                            ? (isScrolled ? 'text-white' : 'text-slate-950')
                            : (isScrolled ? 'text-white/40 hover:text-white' : 'text-slate-400 hover:text-slate-950')
                        }`}
                    >
                        {link.name}
                        {checkActive(link) && (
                            <motion.div 
                                layoutId="nav-underline-master"
                                className={`absolute -bottom-1 left-0 right-0 h-0.5 rounded-full ${isScrolled ? 'bg-indigo-400' : 'bg-slate-950'}`}
                            />
                        )}
                    </button>
                ))}
              </div>
              
              <button 
                  onClick={() => user ? logout() : navigate('/login')} 
                  className={`group px-7 py-2.5 rounded-xl font-bold text-[14px] tracking-tight transition-all active:scale-95 flex items-center gap-2.5 relative overflow-hidden ${
                    isScrolled 
                      ? 'bg-white text-slate-950 shadow-lg' 
                      : 'bg-slate-950 text-white shadow-xl shadow-slate-950/10'
                  }`}
              >
                  <LogIn size={16} className="transition-transform group-hover:translate-x-0.5" />
                  <span>{user ? 'Sign Out' : 'Employee Access'}</span>
                  <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity bg-gradient-to-r from-transparent via-white to-transparent -translate-x-full group-hover:translate-x-full duration-700`}></div>
              </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`p-2.5 rounded-xl transition-all ${isScrolled ? 'bg-white/10 text-white' : 'bg-slate-50 text-slate-900 border border-slate-100'}`}
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
                className="md:hidden fixed inset-x-4 top-20 bg-slate-950/98 backdrop-blur-2xl rounded-2xl border border-white/10 z-50 p-6 shadow-2xl overflow-hidden"
            >
                <div className="flex flex-col gap-1.5 relative z-10">
                  {navLinks.map((link) => (
                      <button
                      key={link.path}
                      onClick={() => {
                          navigate(link.path);
                          setMobileMenuOpen(false);
                      }}
                      className={`w-full text-left px-5 py-3.5 rounded-xl font-semibold text-[15px] tracking-tight transition-all ${
                          checkActive(link)
                          ? 'bg-white/10 text-white'
                          : 'text-white/60 hover:text-white hover:bg-white/5'
                      }`}
                      >
                      {link.name}
                      </button>
                  ))}
                  <div className="h-px bg-white/5 my-3"></div>
                  <button 
                      onClick={() => {
                        user ? logout() : navigate('/login');
                        setMobileMenuOpen(false);
                      }}
                      className="w-full bg-white text-slate-950 font-bold py-4 rounded-xl tracking-tight text-[15px] flex items-center justify-center gap-2.5 active:scale-95 transition-all"
                  >
                      <LogIn size={18} />
                      {user ? 'Sign Out' : 'Employee Access'}
                  </button>
                </div>
                <div className="absolute top-[-50%] right-[-20%] w-[200px] h-[200px] bg-indigo-500/5 rounded-full blur-[80px]"></div>
            </motion.div>
        )}
      </AnimatePresence>
      
      {/* Dynamic Spacer */}
      <div className="h-24 md:h-28"></div>
    </>
  );
};

export default PublicHeader;
