import React, { useState } from 'react';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import { Mail, Phone, MapPin, Send, CheckCircle2 } from 'lucide-react';

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: 'General Inquiry',
    message: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F8F5]">
      <Navbar />

      <main className="flex-1 py-14">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center space-y-4">
            <span className="text-xs font-bold text-emerald-800 tracking-wider uppercase bg-emerald-100 px-3 py-1 rounded-full border border-emerald-200">
              Support & Inquiries
            </span>
            <h1 className="text-4xl font-extrabold text-[#174C32]">Contact AGROVISION Team</h1>
            <p className="text-base text-gray-600 max-w-xl mx-auto">
              Smart India Hackathon 2025 Project Reference SIH25044. Reach out for technical collaborations, KVK agricultural inquiries, or demonstration requests.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Info Cards */}
            <div className="space-y-4">
              <div className="bg-white rounded-2xl p-6 border border-gray-200/80 shadow-sm space-y-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <Mail className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-gray-900">Email Address</h4>
                <p className="text-xs text-gray-600">contact@agrovision.in</p>
                <p className="text-xs text-gray-400">sih25044@agrovision.in</p>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-gray-200/80 shadow-sm space-y-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <MapPin className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-gray-900">Research Focus</h4>
                <p className="text-xs text-gray-600">Department of Computer Science & Engineering (Data Science)</p>
                <p className="text-xs text-gray-500">India</p>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-gray-200/80 shadow-sm space-y-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <Phone className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-gray-900">Farmer Toll-Free Helpline</h4>
                <p className="text-xs text-gray-600">1800-180-1551</p>
                <p className="text-xs text-gray-400">Kisan Call Centre (Govt. of India)</p>
              </div>
            </div>

            {/* Form */}
            <div className="md:col-span-2 bg-white rounded-2xl p-8 border border-gray-200/80 shadow-sm">
              {submitted ? (
                <div className="py-12 text-center space-y-3">
                  <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                  <h3 className="text-xl font-bold text-gray-900">Thank you for your message!</h3>
                  <p className="text-xs text-gray-600">Our research team has received your query and will reply shortly.</p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="mt-4 px-4 py-2 bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-lg hover:bg-emerald-200"
                  >
                    Send another query
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Your Name</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#174C32] focus:border-transparent"
                        placeholder="e.g. Ramesh Patil"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Email Address</label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#174C32] focus:border-transparent"
                        placeholder="ramesh@agrovision.in"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Subject</label>
                    <select
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#174C32] focus:border-transparent"
                    >
                      <option>General Inquiry</option>
                      <option>KVK & Agricultural Advisory Collaboration</option>
                      <option>Technical Bug / API Integration</option>
                      <option>Smart India Hackathon 2025 Evaluation</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Message</label>
                    <textarea
                      rows={4}
                      required
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#174C32] focus:border-transparent"
                      placeholder="Write your query or feedback here..."
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-[#174C32] text-white font-semibold text-sm hover:bg-[#1E6240] transition-colors shadow-sm"
                  >
                    <Send className="w-4 h-4" />
                    <span>Send Message</span>
                  </button>
                </form>
              )}
            </div>

          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
