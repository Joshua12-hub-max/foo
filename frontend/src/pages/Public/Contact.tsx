import {
  Mail,
  Phone,
  MapPin,
  MessageCircle,
  Clock,
  Send,
  Loader2,
} from "lucide-react";
import PublicLayout from "@components/Public/PublicLayout";
import { useChatStore } from "@/stores/chatStore";
import { motion } from "framer-motion";
import { inquiryApi } from "@/api/inquiryApi";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { inquirySchema, InquiryInput } from "@/schemas/inquiry";
import { toast } from "react-hot-toast";
import mapVisual from "@/assets/meycauayan-map.png";
import SEO from "@/components/Global/SEO";
const Contact = () => {
  const openChat = useChatStore((state) => state.openChat);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<InquiryInput>({
    resolver: zodResolver(inquirySchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      message: "",
      hpField: "",
    },
  });
  const onSubmit = async (data: InquiryInput) => {
    try {
      const res = await inquiryApi.submit(data);
      if (res.data.success) {
        toast.success(res.data.message || "Inquiry sent successfully!");
        reset();
      }
    } catch (error: unknown) {
      console.error(error);
      let serverMsg = "Failed to send inquiry. Please try again.";
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as {
          response?: { data?: { message?: string } };
        };
        serverMsg = axiosError.response?.data?.message || serverMsg;
      }
      toast.error(serverMsg);
    }
  };
  const FieldError = ({ name }: { name: keyof InquiryInput }) => {
    const error = errors[name];
    if (!error) return null;
    return (
      <motion.p
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-xs text-red-500 mt-1.5 font-medium"
      >
        {" "}
        {error.message}{" "}
      </motion.p>
    );
  };
  const contactMethods = [
    {
      icon: Mail,
      label: "Email",
      value: "hr@lgu-meycauayan.gov.ph",
      description: "Send us an email anytime",
      action: "mailto:hr@lgu-meycauayan.gov.ph",
    },
    {
      icon: Phone,
      label: "Phone",
      value: "(044) 123-4567",
      description: "Mon-Fri, 8am-5pm",
      action: "tel:+63441234567",
    },
    {
      icon: MapPin,
      label: "Office",
      value: "City Hall, Meycauayan",
      description: "MacArthur Highway, Bulacan",
      image: mapVisual,
    },
  ];
  return (
    <PublicLayout>
      {" "}
      <SEO
        title="Contact Us"
        description="Get in touch with the City of Meycauayan HR team. We are here to assist with your inquiries."
      />{" "}
      {/* Hero */}{" "}
      <div className="relative bg-gradient-to-br from-gray-50 via-white to-gray-50 border-b border-gray-200 py-24 overflow-hidden">
        {" "}
        {/* Blue Smoke Grid Background - Small Squares */}{" "}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--zed-primary)_1px,transparent_1px),linear-gradient(to_bottom,var(--zed-primary)_1px,transparent_1px)] bg-[size:16px_16px] smoke-grid"></div>{" "}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--zed-primary-hover)_1px,transparent_1px),linear-gradient(to_bottom,var(--zed-primary-hover)_1px,transparent_1px)] bg-[size:24px_24px] smoke-grid-secondary"></div>{" "}
        <div className="absolute inset-0 bg-gradient-to-br from-white/85 via-white/50 to-white/85"></div>{" "}
        <div className="max-w-6xl mx-auto px-6 relative z-10">
          {" "}
          <div className="max-w-3xl mx-auto text-center">
            {" "}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-gray-200 shadow-sm text-sm font-medium text-gray-700 mb-8"
            >
              {" "}
              <MessageCircle size={16} className="text-gray-500" /> Support{" "}
            </motion.div>{" "}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-5xl sm:text-6xl md:text-7xl font-bold text-gray-900 leading-tight mb-8"
              style={{ fontFamily: "IBM Plex Sans, sans-serif" }}
            >
              {" "}
              Get in touch{" "}
            </motion.h1>{" "}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-2xl text-gray-700 leading-relaxed font-medium"
              style={{ fontFamily: "IBM Plex Sans, sans-serif" }}
            >
              {" "}
              Have questions about careers or applications? Our HR team is here
              to help.{" "}
            </motion.p>{" "}
          </div>{" "}
        </div>{" "}
      </div>{" "}
      {/* Content */}{" "}
      <div className="bg-white py-20">
        {" "}
        <div className="max-w-6xl mx-auto px-6">
          {" "}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
            {" "}
            {/* Contact Methods */}{" "}
            {contactMethods.map((method, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group"
              >
                {" "}
                {method.action ? (
                  <a
                    href={method.action}
                    className="block bg-white hover:bg-accent/5 border border-[var(--zed-border-light)] hover:border-accent rounded-[var(--radius-sm)] p-8 transition-all duration-200 hover:shadow-lg h-full"
                  >
                    {" "}
                    <div className="flex items-start gap-4 mb-6">
                      {" "}
                      <div className="p-3 bg-accent/10 border border-accent/20 rounded-[var(--radius-sm)] text-accent transition-colors">
                        {" "}
                        <method.icon size={24} />{" "}
                      </div>{" "}
                      <div className="flex-1">
                        {" "}
                        <p className="text-base font-semibold text-gray-500 mb-1">
                          {" "}
                          {method.label}{" "}
                        </p>{" "}
                        <p className="text-xl font-bold text-gray-900 mb-2 leading-snug">
                          {" "}
                          {method.value}{" "}
                        </p>{" "}
                        <p className="text-base text-gray-600 leading-relaxed">
                          {" "}
                          {method.description}{" "}
                        </p>{" "}
                      </div>{" "}
                    </div>{" "}
                    {method.image && (
                      <div className="h-32 -mx-8 -mb-8 overflow-hidden rounded-b-2xl">
                        {" "}
                        <img
                          src={method.image}
                          alt="Location"
                          className="w-full h-full object-cover opacity-50 group-hover:opacity-75 group-hover:scale-105 transition-all duration-500"
                        />{" "}
                      </div>
                    )}{" "}
                  </a>
                ) : (
                  <div className="bg-white border border-[var(--zed-border-light)] rounded-[var(--radius-sm)] p-8 h-full">
                    {" "}
                    <div className="flex items-start gap-4 mb-6">
                      {" "}
                      <div className="p-3 bg-accent/10 border border-accent/20 rounded-[var(--radius-sm)] text-accent">
                        {" "}
                        <method.icon size={24} />{" "}
                      </div>{" "}
                      <div className="flex-1">
                        {" "}
                        <p className="text-base font-semibold text-gray-500 mb-1">
                          {" "}
                          {method.label}{" "}
                        </p>{" "}
                        <p className="text-xl font-bold text-gray-900 mb-2 leading-snug">
                          {" "}
                          {method.value}{" "}
                        </p>{" "}
                        <p className="text-base text-gray-600 leading-relaxed">
                          {" "}
                          {method.description}{" "}
                        </p>{" "}
                      </div>{" "}
                    </div>{" "}
                    {method.image && (
                      <div className="h-32 -mx-8 -mb-8 overflow-hidden rounded-b-2xl">
                        {" "}
                        <img
                          src={method.image}
                          alt="Location"
                          className="w-full h-full object-cover opacity-50"
                        />{" "}
                      </div>
                    )}{" "}
                  </div>
                )}{" "}
              </motion.div>
            ))}{" "}
          </div>{" "}
          {/* Contact Form */}{" "}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-2xl mx-auto zed-card p-10"
          >
            {" "}
            <div className="mb-10 text-center">
              {" "}
              <h2 className="text-4xl font-bold text-[var(--zed-text-dark)] tracking-tight mb-4">
                {" "}
                Send us a message{" "}
              </h2>{" "}
              <p className="text-lg text-[var(--zed-text-muted)] font-medium">
                {" "}
                Fill out the form below and we'll get back to you within 24
                hours{" "}
              </p>{" "}
            </div>{" "}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {" "}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {" "}
                <div>
                  {" "}
                  <label className="block text-xs font-bold text-[var(--zed-text-dark)] tracking-wider mb-2">
                    {" "}
                    First Name{" "}
                  </label>{" "}
                  <input
                    {...register("firstName")}
                    className={`w-full px-4 py-4 bg-white border rounded-[var(--radius-sm)] text-base focus:outline-none focus:ring-4 transition-all ${errors.firstName ? "border-[var(--zed-error)] ring-[var(--zed-error)]/10" : "border-[var(--zed-border-light)] focus:border-accent focus:ring-accent/10"}`}
                    placeholder="John"
                  />{" "}
                  <FieldError name="firstName" />{" "}
                </div>{" "}
                <div>
                  {" "}
                  <label className="block text-xs font-bold text-[var(--zed-text-dark)] tracking-wider mb-2">
                    {" "}
                    Last Name{" "}
                  </label>{" "}
                  <input
                    {...register("lastName")}
                    className={`w-full px-4 py-4 bg-white border rounded-[var(--radius-sm)] text-base focus:outline-none focus:ring-4 transition-all ${errors.lastName ? "border-[var(--zed-error)] ring-[var(--zed-error)]/10" : "border-[var(--zed-border-light)] focus:border-accent focus:ring-accent/10"}`}
                    placeholder="Doe"
                  />{" "}
                  <FieldError name="lastName" />{" "}
                </div>{" "}
              </div>{" "}
              <div>
                {" "}
                <label className="block text-xs font-bold text-[var(--zed-text-dark)] tracking-wider mb-2">
                  {" "}
                  Email Address{" "}
                </label>{" "}
                <input
                  {...register("email")}
                  className={`w-full px-4 py-4 bg-white border rounded-[var(--radius-md)] text-base focus:outline-none focus:ring-4 transition-all ${errors.email ? "border-[var(--zed-error)] ring-[var(--zed-error)]/10" : "border-[var(--zed-border-light)] focus:border-[var(--zed-primary)] focus:ring-[var(--zed-primary)]/10"}`}
                  placeholder="john.doe@example.com"
                />{" "}
                <FieldError name="email" />{" "}
              </div>{" "}
              <input
                type="text"
                {...register("hpField")}
                className="hidden"
                tabIndex={-1}
              />{" "}
              <div>
                {" "}
                <label className="block text-xs font-bold text-[var(--zed-text-dark)] tracking-wider mb-2">
                  {" "}
                  Message{" "}
                </label>{" "}
                <textarea
                  {...register("message")}
                  rows={5}
                  className={`w-full px-4 py-4 bg-white border rounded-[var(--radius-sm)] text-base leading-relaxed focus:outline-none focus:ring-4 transition-all resize-none ${errors.message ? "border-[var(--zed-error)] ring-[var(--zed-error)]/10" : "border-[var(--zed-border-light)] focus:border-[var(--zed-primary)] focus:ring-[var(--zed-primary)]/10"}`}
                  placeholder="How can we help you?"
                />{" "}
                <FieldError name="message" />{" "}
              </div>{" "}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full zed-btn zed-btn-accent py-5 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
              >
                {" "}
                {isSubmitting ? (
                  <>
                    {" "}
                    <Loader2 size={20} className="animate-spin" />{" "}
                    Sending...{" "}
                  </>
                ) : (
                  <>
                    {" "}
                    <Send size={20} /> Send Message{" "}
                  </>
                )}{" "}
              </button>{" "}
            </form>{" "}
          </motion.div>{" "}
          {/* Live Chat CTA */}{" "}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-16 max-w-2xl mx-auto bg-[var(--zed-bg-dark)] text-white rounded-[var(--radius-sm)] p-12 text-center shadow-[var(--zed-shadow-xl)] border border-[var(--zed-border-dark)]"
          >
            {" "}
            <div className="mb-10">
              {" "}
              <h3 className="text-4xl font-bold mb-4 tracking-tight">
                {" "}
                Need immediate help?{" "}
              </h3>{" "}
              <p className="text-lg text-gray-400 font-medium">
                {" "}
                Chat with our team for real-time assistance{" "}
              </p>{" "}
            </div>{" "}
            <button
              onClick={openChat}
              className="px-12 py-5 bg-white hover:bg-gray-50 text-[var(--zed-bg-dark)] rounded-[var(--radius-sm)] font-bold text-lg transition-all active:scale-95 inline-flex items-center gap-3 shadow-lg"
            >
              {" "}
              <MessageCircle size={22} /> Start Live Chat{" "}
            </button>{" "}
          </motion.div>{" "}
          {/* Office Hours */}{" "}
          <div className="mt-16 text-center">
            {" "}
            <div className="inline-flex items-center gap-8 px-8 py-5 bg-[var(--zed-bg-surface)] border border-[var(--zed-border-light)] rounded-full shadow-sm">
              {" "}
              <div className="flex items-center gap-3 text-sm text-[var(--zed-text-dark)]">
                {" "}
                <Clock size={18} className="text-accent" />{" "}
                <span className="font-bold tracking-wider">
                  Mon - Fri: 8:00 AM - 5:00 PM
                </span>{" "}
              </div>{" "}
              <div className="w-1.5 h-1.5 bg-gray-300 rounded-full"></div>{" "}
              <div className="text-sm text-gray-500 font-bold">
                {" "}
                Typical response time:{" "}
                <span className="text-[var(--zed-primary)] tracking-wide">
                  &lt; 24 hours
                </span>{" "}
              </div>{" "}
            </div>{" "}
          </div>{" "}
        </div>{" "}
      </div>{" "}
    </PublicLayout>
  );
};
export default Contact;
