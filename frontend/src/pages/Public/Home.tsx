import { useNavigate } from 'react-router-dom';
import PublicLayout from '@components/Public/PublicLayout';
import { ArrowRight, Search, UserCheck, Send } from 'lucide-react';
import cityHallImg from '../../assets/meycauayan-building.png';
import { motion } from 'framer-motion';

const Home = () => {
  const navigate = useNavigate();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <PublicLayout>
        {/* Background Decorative Elements */}
        <div className="absolute top-0 left-0 right-0 h-[600px] -z-10 overflow-hidden">
            <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-blue-100/50 rounded-full blur-3xl mix-blend-multiply opacity-70 animate-blob"></div>
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-100/50 rounded-full blur-3xl mix-blend-multiply opacity-70 animate-blob animation-delay-2000"></div>
            <div className="absolute bottom-[-20%] left-[20%] w-[400px] h-[400px] bg-pink-50/50 rounded-full blur-3xl mix-blend-multiply opacity-70 animate-blob animation-delay-4000"></div>
        </div>

      <div className="max-w-7xl mx-auto px-6 pt-8 md:pt-16 pb-24">
        <div className="grid lg:grid-cols-2 gap-16 items-center mb-24">
            {/* Text Content */}
            <div className="text-left space-y-8 relative">
                <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-xs font-bold uppercase tracking-wider mb-6">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                        </span>
                        Official Recruitment Portal
                    </div>
                
                    <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 leading-[1.1]">
                    Serve the people of <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Meycauayan</span>
                    </h1>
                    <p className="mt-6 text-xl text-slate-600 max-w-lg leading-relaxed">
                    Be part of a government that empowers its community. Join us in building a better future for our city and neighbors.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row items-center gap-4 pt-8">
                        <motion.button 
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => navigate('/careers/jobs')}
                            className="w-full sm:w-auto bg-slate-900 text-white px-8 py-4 rounded-full font-bold text-lg transition-all shadow-xl shadow-slate-900/20 flex items-center justify-center gap-2 group"
                        >
                            View Open Positions 
                            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                        </motion.button>
                        <motion.button 
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => navigate('/careers/about')}
                            className="w-full sm:w-auto px-8 py-4 rounded-full font-bold text-lg text-slate-600 hover:text-slate-900 transition-colors bg-white border border-slate-200 hover:border-slate-300 shadow-sm"
                        >
                            Learn More
                        </motion.button>
                    </div>
                </motion.div>
            </div>

            {/* Hero Image */}
            <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8 }}
                className="relative hidden lg:block"
            >
                <div className="absolute inset-0 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-[2.5rem] transform rotate-3 scale-[1.02] opacity-10"></div>
                <div className="relative rounded-[2.5rem] overflow-hidden shadow-2xl shadow-blue-900/10 border-4 border-white">
                    <img 
                        src={cityHallImg} 
                        alt="Meycauayan City Hall" 
                        className="w-full h-full object-cover aspect-[4/3] hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent"></div>
                    <div className="absolute bottom-6 left-6 right-6">
                        <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-white/50 shadow-lg">
                            <p className="font-bold text-slate-900">Meycauayan City Hall</p>
                            <p className="text-xs text-slate-500">Center of Public Service</p>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>

        {/* Features stats */}
        <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-8"
        >
            <motion.div variants={itemVariants} className="group p-8 bg-white/60 backdrop-blur-sm rounded-3xl border border-white shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-300 hover:-translate-y-1">
                <Search className="text-slate-900 mb-6" size={32} strokeWidth={1.5} />
                <h3 className="text-xl font-bold mb-3 text-slate-900">Find your fit</h3>
                <p className="text-slate-500 leading-relaxed">Explore diverse opportunities across various departments suitable for your unique skills and passion.</p>
            </motion.div>

            <motion.div variants={itemVariants} className="group p-8 bg-white/60 backdrop-blur-sm rounded-3xl border border-white shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-300 hover:-translate-y-1">
                <UserCheck className="text-slate-900 mb-6" size={32} strokeWidth={1.5} />
                <h3 className="text-xl font-bold mb-3 text-slate-900">One Application</h3>
                <p className="text-slate-500 leading-relaxed">Submit your profile once and use it to apply to multiple positions seamlessly without repetitive data entry.</p>
            </motion.div>

            <motion.div variants={itemVariants} className="group p-8 bg-white/60 backdrop-blur-sm rounded-3xl border border-white shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-300 hover:-translate-y-1">
                <Send className="text-slate-900 mb-6" size={32} strokeWidth={1.5} />
                <h3 className="text-xl font-bold mb-3 text-slate-900">Direct to HR</h3>
                <p className="text-slate-500 leading-relaxed">Your application follows a streamlined process, going directly to our selection board for immediate review.</p>
            </motion.div>
        </motion.div>
      </div>
    </PublicLayout>
  );
};

export default Home;
