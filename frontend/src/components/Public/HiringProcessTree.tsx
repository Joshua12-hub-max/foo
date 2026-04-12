import React from 'react';
import { motion } from 'framer-motion';
import { 
  Search, FileText, ClipboardCheck, Users, 
  Handshake, BadgeCheck, PartyPopper, ChevronRight 
} from 'lucide-react';

const steps = [
  {
    id: 1,
    title: "Job Posting",
    description: "Explore available positions that match your skills and career goals.",
    icon: Search,
  },
  {
    id: 2,
    title: "Application",
    description: "Submit your PDS, resume, and required documents through our portal.",
    icon: FileText,
  },
  {
    id: 3,
    title: "Screening",
    description: "Our HR team reviews your qualifications against the job requirements.",
    icon: ClipboardCheck,
  },
  {
    id: 4,
    title: "Interview Phase",
    description: "Engage in initial and technical interviews with our department heads.",
    icon: Users,
  },
  {
    id: 5,
    title: "Selection & Offer",
    description: "Top candidates receive a formal offer and list of pre-employment requirements.",
    icon: Handshake,
  },
  {
    id: 6,
    title: "Final Confirmation",
    description: "Submission of physical documents and final verification of credentials.",
    icon: BadgeCheck,
  },
  {
    id: 7,
    title: "First Day",
    description: "Welcome to the team! Onboarding, orientation, and start of duties.",
    icon: PartyPopper,
  }
];

const HiringProcessTree: React.FC = () => {
  return (
    <section className="py-24 bg-white overflow-hidden border-y border-[var(--zed-border-light)]" style={{ fontFamily: 'IBM Plex Sans, sans-serif' }}>
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-20">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-6xl font-bold text-[var(--zed-text-dark)] tracking-tight mb-6"
          >
            Hiring Process
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-[var(--zed-text-muted)] font-medium text-lg max-w-2xl mx-auto"
          >
            A transparent, merit-based journey from your first application to your first day of duty.
          </motion.p>
        </div>

        {/* Desktop View (Horizontal Tree) */}
        <div className="hidden lg:block relative pt-10 pb-20">
          {/* Connector Line */}
          <div className="absolute top-[62px] left-0 w-full h-[2px] bg-[var(--zed-border-light)] z-0"></div>
          
          <div className="grid grid-cols-7 gap-6 relative z-10">
            {steps.map((step, index) => (
              <motion.div 
                key={step.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="flex flex-col items-center text-center group"
              >
                <div className="w-16 h-16 rounded-[var(--radius-sm)] bg-white border-2 border-[var(--zed-border-light)] text-[var(--zed-text-dark)] flex items-center justify-center shadow-sm group-hover:border-[var(--zed-accent)] group-hover:text-[var(--zed-accent)] transition-all duration-300 mb-8 relative">
                  <step.icon size={24} />
                  {index < steps.length - 1 && (
                    <div className="absolute -right-5 top-1/2 -translate-y-1/2 text-[var(--zed-border-light)]">
                      <ChevronRight size={18} />
                    </div>
                  )}
                </div>
                <h3 className="inline-block px-4 py-1.5 bg-[var(--zed-accent)] text-white rounded-[var(--radius-sm)] text-xs font-bold mb-4 tracking-wide shadow-sm">
                  {step.title}
                </h3>
                <p className="text-sm text-[var(--zed-text-muted)] font-medium leading-relaxed px-2">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Mobile View (Vertical Tree) */}
        <div className="lg:hidden space-y-12 relative">
          {/* Vertical Connector Line */}
          <div className="absolute left-[23px] top-0 w-[2px] h-full bg-[var(--zed-border-light)] z-0"></div>

          {steps.map((step, index) => (
            <motion.div 
              key={step.id}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="flex gap-8 relative z-10"
            >
              <div className="w-12 h-12 shrink-0 rounded-[var(--radius-sm)] bg-white border-2 border-[var(--zed-border-light)] text-[var(--zed-text-dark)] flex items-center justify-center shadow-sm">
                <step.icon size={20} />
              </div>
              <div className="pt-1">
                <h3 className="inline-block px-3 py-1 bg-[var(--zed-accent)] text-white rounded-[var(--radius-sm)] text-sm font-bold mb-3 tracking-wide shadow-sm">
                  {step.title}
                </h3>
                <p className="text-base text-[var(--zed-text-muted)] font-medium leading-relaxed">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Branding Footer - Refined Design */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-24 p-8 bg-[var(--zed-bg-surface)] border border-[var(--zed-border-light)] rounded-[var(--radius-sm)] flex flex-col md:flex-row items-center justify-between gap-10"
        >
          <div className="flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
            <div className="w-16 h-16 bg-white border border-[var(--zed-border-light)] rounded-[var(--radius-sm)] shadow-sm flex items-center justify-center shrink-0">
              <BadgeCheck size={32} className="text-[var(--zed-accent)]" />
            </div>
            <div>
              <h4 className="text-2xl font-bold text-[var(--zed-text-dark)] mb-2">Merit-Based Selection</h4>
              <p className="text-[var(--zed-text-muted)] font-medium text-lg leading-relaxed max-w-xl">
                Our recruitment process is strictly governed by merit and fitness, ensuring equal opportunity for every qualified applicant.
              </p>
            </div>
          </div>
          
          <div className="flex flex-col items-center md:items-end gap-4 shrink-0">
            <div className="flex -space-x-4 mb-2">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="w-12 h-12 rounded-full border-2 border-white bg-slate-100 overflow-hidden shadow-sm">
                  <img 
                    src={`https://i.pravatar.cc/100?u=servant${i}`} 
                    alt="Process Participant" 
                    className="w-full h-full object-cover grayscale opacity-80" 
                  />
                </div>
              ))}
            </div>
            <p className="text-xs font-bold text-[var(--zed-text-muted)] uppercase tracking-[0.2em]">Verified Process</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HiringProcessTree;
