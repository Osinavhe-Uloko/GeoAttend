import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Lock, Building, Hash, Loader2, MapPin } from 'lucide-react';
import { motion } from 'motion/react';

export const RegisterPage: React.FC = () => {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    role_name: 'student',
    matric_number: '',
    department: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (data.success) {
        navigate('/login');
      } else {
        setError(data.message || 'Registration failed');
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white font-sans text-slate-900">
      
      {/* Right side panel with branding (Swapped side for contrast from Login) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-indigo-950 overflow-hidden order-2">
        <div className="absolute inset-0 z-0 opacity-40">
          <div className="absolute top-[20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-500/40 blur-[100px]" />
          <div className="absolute bottom-[10%] right-[-10%] w-[400px] h-[400px] rounded-full bg-cyan-400/20 blur-[100px]" />
        </div>
        
        <div className="relative z-10 p-12 lg:p-24 flex flex-col justify-between w-full h-full">
          <div className="mt-12">
            <motion.h1 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="text-5xl lg:text-5xl font-semibold tracking-tight text-white leading-[1.2] mb-6"
            >
              Start tracking attendance the right way.
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="text-lg text-indigo-200 border-l-2 border-indigo-500 pl-4 max-w-md"
            >
              Join your institution's smart attendance network today. Secure, privacy-friendly, and precise.
            </motion.p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/10 max-w-sm">
             <p className="text-white font-medium mb-1">"The GPS verification makes sure everyone is exactly where they need to be. It's transformed our classes."</p>
             <p className="text-indigo-300 text-sm font-semibold">— Dr. Adewale, Faculty</p>
          </div>
        </div>
      </div>

      {/* Left side panel - Register Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 xl:p-16 bg-white relative order-1 overflow-y-auto">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md mx-auto space-y-8"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
              <MapPin className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900">GeoAttend</span>
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl font-semibold tracking-tight text-slate-900">
              Create your account
            </h2>
            <p className="text-sm text-slate-500">
              Enter your details to register as a new student.
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleRegister}>
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50/50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-3 w-full"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-red-600" />
                {error}
              </motion.div>
            )}
            
            <div className="space-y-4">
              
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 block text-left">Full Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    name="full_name"
                    type="text"
                    required
                    className="block w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 text-slate-900 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all font-medium sm:text-sm placeholder:text-slate-400 placeholder:font-normal"
                    placeholder="John Doe"
                    value={formData.full_name}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 block text-left">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    name="email"
                    type="email"
                    required
                    className="block w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 text-slate-900 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all font-medium sm:text-sm placeholder:text-slate-400 placeholder:font-normal"
                    placeholder="name@university.edu"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 block text-left">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    name="password"
                    type="password"
                    required
                    className="block w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 text-slate-900 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all font-medium sm:text-sm placeholder:text-slate-400 placeholder:font-normal"
                    placeholder="Create a strong password"
                    value={formData.password}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 block text-left">Matric Number</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Hash className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      name="matric_number"
                      type="text"
                      required
                      className="block w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 text-slate-900 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all font-medium sm:text-sm placeholder:text-slate-400 placeholder:font-normal"
                      placeholder="e.g. U/19/22.."
                      value={formData.matric_number}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 block text-left">Department</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Building className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      name="department"
                      type="text"
                      required
                      className="block w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 text-slate-900 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all font-medium sm:text-sm placeholder:text-slate-400 placeholder:font-normal"
                      placeholder="Computer Sci..."
                      value={formData.department}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center py-3.5 px-4 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600 transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-sm shadow-indigo-200"
            >
              {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Create Account'}
            </button>
            
            <p className="text-center text-sm font-medium text-slate-500 pt-2">
              Already have an account?{' '}
              <Link to="/login" className="font-bold text-slate-900 hover:text-indigo-600 transition-colors">
                Sign in here
              </Link>
            </p>
          </form>
        </motion.div>
      </div>
    </div>
  );
};
