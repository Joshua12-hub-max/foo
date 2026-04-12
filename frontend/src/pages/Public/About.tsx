import PublicLayout from "@components/Public/PublicLayout";
import { Target, Eye, Users, Shield, TrendingUp, Award } from "lucide-react";
import { motion } from "framer-motion";
import missionImg from "@/assets/about-mission.png";
import visionImg from "@/assets/about-vision.png";
import SEO from "@/components/Global/SEO";

const About = () => {
  const values = [
    {
      icon: Users,
      title: "Community Impact",
      description:
        "Make a tangible difference in the lives of your neighbors and build a stronger community together.",
    },
    {
      icon: Shield,
      title: "Secure Benefits",
      description:
        "Government-standard compensation packages and comprehensive tenure safety for all employees.",
    },
    {
      icon: TrendingUp,
      title: "Career Growth",
      description:
        "Continuous opportunities for professional development, training programs, and career advancement.",
    },
    {
      icon: Award,
      title: "Civic Honor",
      description:
        "Take pride in serving the people of Meycauayan City and contribute to public service excellence.",
    },
  ];

  return (
    <PublicLayout>
      <SEO
        title="About Us"
        description="Learn about our mission, vision, and core values at the City Government of Meycauayan HR office."
      />

      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-gray-50 via-white to-gray-50 border-b border-gray-200 py-24 overflow-hidden">
        {/* Blue Smoke Grid Background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--zed-primary)_1px,transparent_1px),linear-gradient(to_bottom,var(--zed-primary)_1px,transparent_1px)] bg-[size:16px_16px] smoke-grid"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--zed-primary-hover)_1px,transparent_1px),linear-gradient(to_bottom,var(--zed-primary-hover)_1px,transparent_1px)] bg-[size:24px_24px] smoke-grid-secondary"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-white/85 via-white/50 to-white/85"></div>

        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-gray-200 shadow-sm text-sm font-medium text-gray-700 mb-8"
            >
              <Target size={16} className="text-accent" />
              Our Mission
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-5xl sm:text-6xl md:text-7xl font-bold text-[var(--zed-text-dark)] leading-tight mb-8"
              style={{ fontFamily: "IBM Plex Sans, sans-serif" }}
            >
              Excellence in public service
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-2xl text-gray-700 leading-relaxed font-medium"
              style={{ fontFamily: "IBM Plex Sans, sans-serif" }}
            >
              To uphold the highest standards of human resource management in
              the City Government of Meycauayan, fostering a workforce that is
              professional, integrity-driven, and dedicated to public service.
            </motion.p>
          </div>
        </div>
      </div>

      {/* Mission & Vision */}
      <div className="bg-white py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-8 mb-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="group bg-[var(--zed-bg-light)] border border-[var(--zed-border-light)] rounded-[var(--radius-sm)] overflow-hidden shadow-[var(--zed-shadow-sm)] hover:shadow-[var(--zed-shadow-lg)] hover:border-accent transition-all duration-300"
            >
              <div className="p-8">
                <div className="mb-6 p-4 bg-accent/10 text-accent rounded-[var(--radius-sm)] w-fit group-hover:bg-accent group-hover:text-white transition-all">
                  <Target size={28} />
                </div>
                <h2
                  className="text-3xl font-bold text-[var(--zed-text-dark)] mb-6"
                  style={{ fontFamily: "IBM Plex Sans, sans-serif" }}
                >
                  Our Mission
                </h2>
                <p
                  className="text-lg text-[var(--zed-text-muted)] leading-relaxed font-medium mb-6"
                  style={{ fontFamily: "IBM Plex Sans, sans-serif" }}
                >
                  To provide efficient, transparent, and accessible public
                  service. We value integrity and excellence in all our
                  administrative standards and employee relations.
                </p>
              </div>
              <div className="h-48 -mx-0 -mb-0 overflow-hidden bg-[var(--zed-bg-surface)]">
                <img
                  src={missionImg}
                  alt="Mission"
                  className="w-full h-full object-cover opacity-40 group-hover:opacity-60 group-hover:scale-110 transition-all duration-500"
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="group bg-[var(--zed-bg-light)] border border-[var(--zed-border-light)] rounded-[var(--radius-sm)] overflow-hidden shadow-[var(--zed-shadow-sm)] hover:shadow-[var(--zed-shadow-lg)] hover:border-accent transition-all duration-300"
            >
              <div className="p-8">
                <div className="mb-6 p-4 bg-accent/10 text-accent rounded-[var(--radius-sm)] w-fit group-hover:bg-accent group-hover:text-white transition-all">
                  <Eye size={28} />
                </div>
                <h2
                  className="text-3xl font-bold text-[var(--zed-text-dark)] mb-6"
                  style={{ fontFamily: "IBM Plex Sans, sans-serif" }}
                >
                  Our Vision
                </h2>
                <p
                  className="text-lg text-[var(--zed-text-muted)] leading-relaxed font-medium mb-6"
                  style={{ fontFamily: "IBM Plex Sans, sans-serif" }}
                >
                  To be a model Local Government Unit that empowers its citizens
                  through innovative and sustainable public service programs and
                  high-performance workforce.
                </p>
              </div>
              <div className="h-48 -mx-0 -mb-0 overflow-hidden bg-[var(--zed-bg-surface)]">
                <img
                  src={visionImg}
                  alt="Vision"
                  className="w-full h-full object-cover opacity-40 group-hover:opacity-60 group-hover:scale-110 transition-all duration-500"
                />
              </div>
            </motion.div>
          </div>

          {/* Values Grid */}
          <div className="space-y-12">
            <div className="text-center">
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-4xl sm:text-5xl font-bold text-[var(--zed-text-dark)] mb-6"
                style={{ fontFamily: "IBM Plex Sans, sans-serif" }}
              >
                Why work with us
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="text-xl text-[var(--zed-text-muted)] font-medium max-w-2xl mx-auto"
                style={{ fontFamily: "IBM Plex Sans, sans-serif" }}
              >
                Join a team dedicated to making a meaningful difference in our
                community
              </motion.p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {values.map((value, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="group bg-[var(--zed-bg-light)] border border-[var(--zed-border-light)] rounded-[var(--radius-sm)] p-8 shadow-[var(--zed-shadow-sm)] hover:shadow-[var(--zed-shadow-lg)] hover:border-accent transition-all duration-300"
                >
                  <div className="mb-6 p-3 bg-accent/10 text-accent rounded-[var(--radius-sm)] w-fit group-hover:bg-accent group-hover:text-white transition-all">
                    <value.icon size={24} />
                  </div>
                  <h3
                    className="text-xl font-bold text-[var(--zed-text-dark)] mb-4"
                    style={{ fontFamily: "IBM Plex Sans, sans-serif" }}
                  >
                    {value.title}
                  </h3>
                  <p
                    className="text-base text-[var(--zed-text-muted)] leading-relaxed font-medium"
                    style={{ fontFamily: "IBM Plex Sans, sans-serif" }}
                  >
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
