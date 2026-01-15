import React from 'react';
import PublicLayout from '@components/Public/PublicLayout';
import { Target, Eye, Users, Shield, TrendingUp, Award } from 'lucide-react';
import { motion } from 'framer-motion';

const About = () => {
    const cardVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

  return (
    <PublicLayout>
      <div className="flex-1 w-full bg-slate-50 relative overflow-hidden">
        {/* Header Background */}
        <div className="absolute top-0 inset-x-0 h-64 bg-slate-900 overflow-hidden">
             <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#4b5563_1px,transparent_1px)] [background-size:16px_16px]"></div>
             <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-slate-50 to-transparent"></div>
        </div>

        <main className="max-w-5xl mx-auto px-6 py-20 relative z-10">
            <div className="text-center mb-16">
                 <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">About Us</h1>
                 <p className="text-xl text-slate-200 max-w-2xl mx-auto">
                    We are dedicated to building a competent, professional, and diverse workforce to serve the community of Meycauayan.
                 </p>
            </div>
         
            {/* Bento Grid layout for Mission/Vision */}
            <div className="grid md:grid-cols-2 gap-6 mb-16">
                <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl"
                >
                    <div className="relative z-10 h-full flex flex-col justify-end">
                        <Target className="text-white mb-6" size={32} strokeWidth={1.5} />
                        <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
                        <p className="text-slate-300 leading-relaxed text-lg">
                            To provide efficient, transparent, and accessible public service. We value integrity, accountability, and excellence in all our employees.
                        </p>
                    </div>
                </motion.div>

                <motion.div 
                     initial={{ opacity: 0, x: 20 }}
                     whileInView={{ opacity: 1, x: 0 }}
                     viewport={{ once: true }}
                     className="bg-white rounded-3xl p-8 text-slate-900 relative overflow-hidden border border-slate-200 shadow-xl"
                >
                     <div className="relative z-10 h-full flex flex-col justify-end">
                        <Eye className="text-slate-900 mb-6" size={32} strokeWidth={1.5} />
                        <h2 className="text-2xl font-bold mb-4">Our Vision</h2>
                        <p className="text-slate-600 leading-relaxed text-lg">
                           A model Local Government Unit that empowers its citizens through innovative, inclusive, and sustainable public service programs.
                        </p>
                    </div>
                </motion.div>
            </div>

            {/* Why Work With Us */}
            <div>
                 <h2 className="text-3xl font-bold text-slate-900 text-center mb-10">Why Work With Us?</h2>
                 <div className="grid sm:grid-cols-2 gap-6">
                    {[
                        { icon: Users, title: "Community Impact", desc: "Make a tangible difference in the lives of your neighbors." },
                        { icon: Award, title: "Competitive Salary", desc: "Government-standard compensation and secure benefits." },
                        { icon: TrendingUp, title: "Growth", desc: "Continuous opportunities for training and promotion." },
                        { icon: Shield, title: "Job Security", desc: "Stable employment environment with long-term tenure." }
                    ].map((item, i) => (
                        <motion.div 
                            key={i}
                            variants={cardVariants}
                            initial="hidden"
                            whileInView="visible"
                            transition={{ delay: i * 0.1 }}
                            viewport={{ once: true }}
                            className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-start gap-4 hover:shadow-md transition-shadow"
                        >
                            <div className="shrink-0 pt-1">
                                <item.icon size={24} className="text-slate-900" strokeWidth={1.5} />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg text-slate-900 mb-1">{item.title}</h3>
                                <p className="text-slate-500 leading-snug">{item.desc}</p>
                            </div>
                        </motion.div>
                    ))}
                 </div>
            </div>
        </main>
      </div>
    </PublicLayout>
  );
};

export default About;
