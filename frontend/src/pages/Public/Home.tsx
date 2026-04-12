import { useNavigate } from "react-router-dom";
import PublicLayout from "@components/Public/PublicLayout";
import {
  ArrowRight,
  Search,
  Building2,
  Users,
  FileCheck,
  BellRing,
} from "lucide-react";
import { motion } from "framer-motion";
import cityHallImg from "../../assets/meycauayan-building.png";
import deptImg from "../../assets/home-dept.png";
import registryImg from "../../assets/home-registry.png";
import submissionImg from "../../assets/home-submission.png";
import SEO from "@/components/Global/SEO";

const Home = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Building2,
      title: "Department Filter",
      description:
        "Easily find job openings across different city departments that match your skills.",
      image: deptImg,
    },
    {
      icon: Users,
      title: "Career Registry",
      description:
        "A digital registry used by HR to track and coordinate future opportunities for all applicants.",
      image: registryImg,
    },
    {
      icon: FileCheck,
      title: "Online Submission",
      description:
        "Submit your application directly to the Human Resource office instantly and skip the paperwork.",
      image: submissionImg,
    },
    {
      icon: BellRing,
      title: "Real-time Updates",
      description:
        "Get instant notifications about your application status and new job postings that match your profile.",
      image: deptImg,
    },
  ];

  return (
    <PublicLayout>
      <SEO
        title="Official Portal"
        description="Welcome to the CHRMO Mey Portal - City Government of Meycauayan. Empowering our citizens through innovative public service."
      />

      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-gray-50 via-white to-gray-50 border-b border-gray-200 py-32 overflow-hidden">
        {/* Blue Smoke Grid Background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--zed-primary)_1px,transparent_1px),linear-gradient(to_bottom,var(--zed-primary)_1px,transparent_1px)] bg-[size:16px_16px] smoke-grid"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--zed-primary-hover)_1px,transparent_1px),linear-gradient(to_bottom,var(--zed-primary-hover)_1px,transparent_1px)] bg-[size:24px_24px] smoke-grid-secondary"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-white/85 via-white/50 to-white/85"></div>

        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Text Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-gray-200 shadow-sm text-sm font-medium text-gray-700 mb-8"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
                </span>
                Careers and Jobs
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-5xl sm:text-6xl md:text-7xl font-bold text-[var(--zed-text-dark)] leading-tight mb-8"
                style={{ fontFamily: "IBM Plex Sans, sans-serif" }}
              >
                Public Service <span className="text-accent">Excellence</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-2xl text-gray-700 leading-relaxed mb-12 font-medium"
                style={{ fontFamily: "IBM Plex Sans, sans-serif" }}
              >
                CHRMO Mey is the official recruitment portal of the City
                Government of Meycauayan. Start your journey in public service
                with us today.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex flex-col sm:flex-row gap-4"
              >
                <button
                  onClick={() => navigate("/careers/jobs")}
                  className="px-10 py-5 bg-accent hover:bg-accent-hover text-white rounded-[var(--radius-sm)] font-bold text-lg transition-all shadow-lg active:scale-95 inline-flex items-center gap-3"
                  style={{ fontFamily: "IBM Plex Sans, sans-serif" }}
                >
                  <Search size={22} />
                  Browse Jobs
                </button>
                <button
                  onClick={() => navigate("/careers/about")}
                  className="px-10 py-5 bg-white hover:bg-gray-50 text-[var(--zed-text-dark)] border-2 border-[var(--zed-border-light)] rounded-[var(--radius-sm)] font-bold text-lg transition-all active:scale-95 inline-flex items-center gap-3"
                  style={{ fontFamily: "IBM Plex Sans, sans-serif" }}
                >
                  Learn More
                  <ArrowRight size={22} />
                </button>
              </motion.div>
            </motion.div>

            {/* Hero Image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="relative hidden lg:block"
            >
              <div className="relative rounded-[var(--radius-md)] overflow-hidden border-2 border-[var(--zed-border-light)] shadow-[var(--zed-shadow-xl)]">
                <img
                  src={cityHallImg}
                  alt="Meycauayan City Hall"
                  className="w-full h-full object-cover aspect-[4/3]"
                />
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 to-transparent"></div>
                <div className="absolute bottom-8 left-8 text-white">
                  <p className="font-bold text-2xl mb-2">
                    Meycauayan City Hall
                  </p>
                  <p className="text-sm text-white/90 font-medium">
                    Center of administration
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-white py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl sm:text-5xl font-bold text-[var(--zed-text-dark)] mb-6"
              style={{ fontFamily: "IBM Plex Sans, sans-serif" }}
            >
              Why choose our portal
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-xl text-[var(--zed-text-muted)] font-medium max-w-2xl mx-auto"
              style={{ fontFamily: "IBM Plex Sans, sans-serif" }}
            >
              Modern tools designed to make your job application process
              seamless and efficient
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group bg-[var(--zed-bg-light)] border border-[var(--zed-border-light)] rounded-[var(--radius-sm)] overflow-hidden shadow-[var(--zed-shadow-sm)] hover:shadow-[var(--zed-shadow-lg)] hover:border-accent transition-all duration-300"
              >
                <div className="p-8">
                  <div className="mb-6 p-4 bg-accent/10 rounded-[var(--radius-sm)] w-fit group-hover:bg-accent transition-colors">
                    <feature.icon
                      size={28}
                      className="text-accent group-hover:text-white transition-colors"
                    />
                  </div>
                  <h3
                    className="text-2xl font-bold text-[var(--zed-text-dark)] mb-4"
                    style={{ fontFamily: "IBM Plex Sans, sans-serif" }}
                  >
                    {feature.title}
                  </h3>
                  <p
                    className="text-base text-[var(--zed-text-muted)] leading-relaxed font-medium"
                    style={{ fontFamily: "IBM Plex Sans, sans-serif" }}
                  >
                    {feature.description}
                  </p>
                </div>
                <div className="h-40 -mx-0 -mb-0 overflow-hidden bg-[var(--zed-bg-surface)]">
                  <img
                    src={feature.image}
                    alt={feature.title}
                    className="w-full h-full object-cover opacity-40 group-hover:opacity-60 group-hover:scale-110 transition-all duration-500"
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-[var(--zed-bg-dark)] py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2
              className="text-4xl sm:text-5xl font-bold text-white mb-8"
              style={{ fontFamily: "IBM Plex Sans, sans-serif" }}
            >
              Ready to serve your community?
            </h2>
            <p
              className="text-xl text-white/80 mb-12 font-medium max-w-2xl mx-auto leading-relaxed"
              style={{ fontFamily: "IBM Plex Sans, sans-serif" }}
            >
              Join the City Government of Meycauayan and make a real difference
              in the lives of our citizens.
            </p>
            <button
              onClick={() => navigate("/careers/jobs")}
              className="px-12 py-5 bg-white hover:bg-gray-50 text-[var(--zed-bg-dark)] rounded-[var(--radius-sm)] font-bold text-lg transition-all active:scale-95 shadow-lg inline-flex items-center gap-3"
              style={{ fontFamily: "IBM Plex Sans, sans-serif" }}
            >
              View Open Positions
              <ArrowRight size={22} />
            </button>
          </motion.div>
        </div>
      </div>
    </PublicLayout>
  );
};

export default Home;
