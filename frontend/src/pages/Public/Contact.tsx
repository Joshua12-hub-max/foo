import PublicLayout from '@components/Public/PublicLayout';
import { Mail, Phone, MapPin, Send } from 'lucide-react';

const Contact = () => {
  return (
    <PublicLayout>
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-slate-900">Get in Touch</h1>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                Have questions about openings or the application process? We're here to help.
            </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Info Cards */}
             <div className="space-y-6 lg:col-span-1">
                <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50">
                    <Mail className="text-slate-900 mb-6" size={32} strokeWidth={1.5} />
                    <h3 className="font-bold text-xl text-slate-900 mb-2">Email Us</h3>
                    <p className="text-slate-500 mb-4 text-sm">Our friendly team is here to help.</p>
                    <a href="mailto:hr@lgu-meycauayan.gov.ph" className="text-slate-900 font-semibold hover:underline border-b border-slate-300 pb-0.5">hr@lgu-meycauayan.gov.ph</a>
                </div>

                <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50">
                    <MapPin className="text-slate-900 mb-6" size={32} strokeWidth={1.5} />
                    <h3 className="font-bold text-xl text-slate-900 mb-2">Visit Us</h3>
                    <p className="text-slate-500 mb-4 text-sm">Come say hello at our office HQ.</p>
                    <p className="text-slate-900 font-medium">City Hall Complex, Meycauayan City, Bulacan</p>
                </div>

                 <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50">
                    <Phone className="text-slate-900 mb-6" size={32} strokeWidth={1.5} />
                    <h3 className="font-bold text-xl text-slate-900 mb-2">Call Us</h3>
                    <p className="text-slate-500 mb-4 text-sm">Mon-Fri from 8am to 5pm.</p>
                    <p className="text-slate-900 font-medium">(044) 123-4567 loc. 101</p>
                </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
                <div className="bg-white p-8 md:p-12 rounded-[2.5rem] border border-slate-200 shadow-2xl shadow-slate-200/50">
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-slate-900">Send us a message</h2>
                        <p className="text-slate-500 mt-2">We'll get back to you within 24 hours.</p>
                    </div>

                    <form className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 ml-1">First Name</label>
                                <input type="text" className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all" placeholder="John" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 ml-1">Last Name</label>
                                <input type="text" className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all" placeholder="Doe" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700 ml-1">Email</label>
                             <input type="email" className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all" placeholder="john@example.com" />
                        </div>

                         <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700 ml-1">Message</label>
                            <textarea rows={6} className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all resize-none" placeholder="How can we help you?"></textarea>
                        </div>

                        <button className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 group shadow-lg shadow-slate-900/20">
                            Send Message
                            <Send size={18} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </form>
                </div>
            </div>
        </div>
      </div>
    </PublicLayout>
  );
};

export default Contact;
