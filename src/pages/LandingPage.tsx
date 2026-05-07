import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Shield, Clock, Users, CheckCircle, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-700">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between w-full h-20 items-center gap-4">
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <div className="bg-indigo-600 p-1.5 sm:p-2 rounded-xl shadow-lg shadow-indigo-200">
                <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <span className="font-black text-xl sm:text-2xl tracking-tight text-slate-900">GeoAttend</span>
            </div>
            <div className="flex items-center gap-3 sm:gap-8 flex-shrink-0">
              <Link to="/login" className="text-sm font-bold text-slate-600 hover:text-indigo-600 transition-colors whitespace-nowrap">Sign In</Link>
              <Link to="/register" className="px-4 sm:px-6 py-2 sm:py-3 bg-indigo-600 text-white rounded-xl sm:rounded-2xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 active:scale-95 whitespace-nowrap">
                Join Now
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-8"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold uppercase tracking-widest">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600"></span>
                </span>
                Next-Gen Attendance
              </div>
              <h1 className="text-5xl sm:text-7xl font-black leading-[1.1] tracking-tight text-slate-900">
                Precision <span className="text-indigo-600">GPS</span> Attendance Tracking.
              </h1>
              <p className="text-xl text-slate-500 leading-relaxed max-w-lg">
                Eliminate proxy attendance with our advanced geofencing technology. Secure, real-time, and effortless for both lecturers and students.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link to="/register" className="group px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold text-lg hover:bg-slate-800 transition-all shadow-2xl shadow-slate-200 flex items-center justify-center gap-2">
                  Get Started Free
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link to="/login" className="px-8 py-4 bg-white border-2 border-slate-100 text-slate-900 rounded-2xl font-bold text-lg hover:border-indigo-100 hover:bg-indigo-50/30 transition-all flex items-center justify-center">
                  Live Demo
                </Link>
              </div>
              <div className="flex items-center gap-6 pt-8 border-t border-slate-100">
                <div className="flex -space-x-3">
                  {[1,2,3,4].map(i => (
                    <img key={i} src={`https://picsum.photos/seed/${i+10}/100/100`} className="w-10 h-10 rounded-full border-2 border-white shadow-sm" alt="User" referrerPolicy="no-referrer" />
                  ))}
                </div>
                <p className="text-sm font-medium text-slate-500">
                  Trusted by <span className="text-slate-900 font-bold">2,000+</span> students daily
                </p>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="absolute -inset-4 bg-indigo-600/5 rounded-[40px] blur-3xl"></div>
              <div className="relative bg-white rounded-[32px] shadow-2xl border border-slate-100 overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&q=80&w=1200" 
                  alt="Students in a lecture hall" 
                  className="w-full h-[500px] object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent"></div>
                <div className="absolute bottom-8 left-8 right-8">
                  <div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/20 flex items-center gap-4">
                    <div className="bg-emerald-500 p-3 rounded-2xl shadow-lg shadow-emerald-500/30">
                      <CheckCircle className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-emerald-300 uppercase tracking-wider">Attendance Status</p>
                      <p className="text-xl font-black text-white">Verified Present</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
            <h2 className="text-sm font-bold text-indigo-600 uppercase tracking-[0.2em]">Core Features</h2>
            <p className="text-4xl font-black text-slate-900 tracking-tight">Everything you need to manage attendance securely.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <MapPin className="w-8 h-8" />,
                title: "Geofence Precision",
                desc: "Define exact lecture hall boundaries. Students must be within the radius to mark attendance.",
                color: "bg-blue-500"
              },
              {
                icon: <Shield className="w-8 h-8" />,
                title: "Anti-Spoof Protection",
                desc: "Advanced detection for VPNs, mock locations, and device fingerprinting to prevent fraud.",
                color: "bg-indigo-500"
              },
              {
                icon: <Clock className="w-8 h-8" />,
                title: "Real-time Analytics",
                desc: "Instant insights into attendance rates, anomalies, and student engagement patterns.",
                color: "bg-purple-500"
              }
            ].map((feature, i) => (
              <div key={i} className="bg-white p-10 rounded-[32px] shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all group">
                <div className={`${feature.color} w-16 h-16 rounded-2xl flex items-center justify-center text-white mb-8 shadow-lg shadow-indigo-100 group-hover:scale-110 transition-transform`}>
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-4">{feature.title}</h3>
                <p className="text-slate-500 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Visual Section */}
      <section className="py-24 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="relative">
              <div className="grid grid-cols-2 gap-4">
                <img 
                  src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=800"
                  alt="Diverse students"
                  className="rounded-3xl object-cover h-64 w-full shadow-lg"
                  referrerPolicy="no-referrer"
                />
                <img 
                  src="https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&q=80&w=800"
                  alt="Lecture hall"
                  className="rounded-3xl object-cover h-80 w-full shadow-lg mt-8"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-indigo-600 text-white p-6 rounded-full shadow-2xl border-4 border-white">
                <Shield className="w-10 h-10" />
              </div>
            </div>
            <div className="space-y-8">
              <h2 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
                Built for modern <span className="text-indigo-600">universities</span>.
              </h2>
              <p className="text-lg text-slate-500 leading-relaxed">
                Whether you're in a massive lecture theatre or a small seminar room, GeoAttend ensures that only students who are physically present can mark their attendance. 
              </p>
              <ul className="space-y-4">
                {[
                  "Eliminates buddy-punching and proxy attendance.",
                  "Works seamlessly across iOS and Android devices.",
                  "Respects student privacy with minimal location tracking.",
                  "Exports directly to your university's grading system."
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="bg-indigo-100 p-1 rounded-full">
                      <CheckCircle className="w-4 h-4 text-indigo-600" />
                    </div>
                    <span className="text-slate-700 font-medium">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-24 bg-indigo-600 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
          <div className="absolute top-10 left-10 w-64 h-64 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
            {[
              { label: "Attendance Marked", value: "150K+" },
              { label: "Active Courses", value: "450+" },
              { label: "Fraud Prevented", value: "12K+" },
              { label: "Accuracy Rate", value: "99.9%" }
            ].map((stat, i) => (
              <div key={i} className="space-y-2">
                <p className="text-5xl font-black text-white">{stat.value}</p>
                <p className="text-indigo-100 font-medium uppercase tracking-widest text-xs">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2.5">
            <div className="bg-slate-900 p-1.5 rounded-lg">
              <MapPin className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900">GeoAttend</span>
          </div>
          <p className="text-slate-400 text-sm">© 2026 GeoAttend. Built for academic integrity.</p>
          <div className="flex gap-8">
            <a href="#" className="text-sm font-bold text-slate-400 hover:text-indigo-600 transition-colors">Privacy</a>
            <a href="#" className="text-sm font-bold text-slate-400 hover:text-indigo-600 transition-colors">Terms</a>
            <a href="#" className="text-sm font-bold text-slate-400 hover:text-indigo-600 transition-colors">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
};
