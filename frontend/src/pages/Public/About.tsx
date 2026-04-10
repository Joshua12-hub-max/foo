import PublicLayout from '@components/Public/PublicLayout';
import { Target, Eye, Users, Shield, TrendingUp, Award } from 'lucide-react';
import { motion } from 'framer-motion';
import missionImg from '@/assets/about-mission.png';
import visionImg from '@/assets/about-vision.png';
import SEO from '@/components/Global/SEO';

const About = () => {
  const values = [
    {
      icon: Users,
      title: 'Community Impact',
      description: 'Make a tangible difference in the lives of your neighbors.'
    },
    {
      icon: Shield,
      title: 'Secure Benefits',
      description: 'Government-standard compensation and tenure safety.'
    },
    {
      icon: TrendingUp,
      title: 'Career Growth',
      description: 'Continuous opportunities for training and promotion.'
    },
    {
      icon: Award,
      title: 'Civic Honor',
      description: 'Pride in serving the people of Meycauayan City.'
    }
  ];

  return (
    <PublicLayout>
      <SEO
        title="About Us"
        description="Learn about our mission, vision, and core values at the City Government of Meycauayan HR office."
      />

      {/* Hero Section */}
      <div className="bg-white border-b border-slate-200 py-20">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 text-accent text-xs font-medium mb-6"
          >
            Our Mission
          </motion.div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-slate-900 mb-6">
            Excellence in public service
          </h1>

          <p className="text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed">
            To uphold the highest standards of human resource management in the
            City Government of Meycauayan, fostering a workforce that is
            professional, integrity-driven, and dedicated to public service.
          </p>
        </div>
      </div>

      {/* Mission & Vision */}
      <div className="bg-slate-50 py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-8 mb-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="zed-card group"
            >
              <div className="mb-6 p-3 bg-accent/10 text-accent rounded-lg w-fit group-hover:bg-accent group-hover:text-white transition-colors">
                <Target size={24} />
              </div>
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">
                Our Mission
              </h2>
              <p className="text-slate-600 leading-relaxed mb-6">
                To provide efficient, transparent, and accessible public service.
                We value integrity and excellence in all our administrative
                standards and employee relations.
              </p>
              <div className="h-40 -mx-6 -mb-6 rounded-b-lg overflow-hidden">
                <img
                  src={missionImg}
                  alt="Mission"
                  className="w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500"
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="zed-card group"
            >
              <div className="mb-6 p-3 bg-accent/10 text-accent rounded-lg w-fit group-hover:bg-accent group-hover:text-white transition-colors">
                <Eye size={24} />
              </div>
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">
                Our Vision
              </h2>
              <p className="text-slate-600 leading-relaxed mb-6">
                To be a model Local Government Unit that empowers its citizens
                through innovative and sustainable public service programs and
                high-performance workforce.
              </p>
              <div className="h-40 -mx-6 -mb-6 rounded-b-lg overflow-hidden">
                <img
                  src={visionImg}
                  alt="Vision"
                  className="w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500"
                />
              </div>
            </motion.div>
          </div>

          {/* Values Grid */}
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-slate-900 mb-4">
                Why work with us
              </h2>
              <p className="text-lg text-slate-600">
                Join a team dedicated to making a difference
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {values.map((value, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="zed-card group"
                >
                  <div className="mb-4 p-3 bg-accent/10 text-accent rounded-lg w-fit group-hover:bg-accent group-hover:text-white transition-colors">
                    <value.icon size={20} />
                  </div>
                  <h3 className="text-base font-semibold text-slate-900 mb-2">
                    {value.title}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {value.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
};

export default About;
