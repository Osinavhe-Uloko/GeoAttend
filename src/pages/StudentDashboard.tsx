import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGPS } from '../hooks/useGPS';
import { GPSStatusIndicator } from '../components/GPSStatusIndicator';
import { AttendanceSubmitButton } from '../components/AttendanceSubmitButton';
import { GeofenceMapPreview } from '../components/GeofenceMapPreview';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Clock, AlertTriangle, CheckCircle, XCircle, LogOut, User, BookOpen, Calendar, Plus, Key, Loader2 } from 'lucide-react';

export const StudentDashboard: React.FC = () => {
  const { coordinates, error: gpsError, isLoading: isGpsLoading, getCoordinates } = useGPS();
  const [activeSessions, setActiveSessions] = useState<any[]>([]);
  const [pastSessions, setPastSessions] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'active' | 'past'>('active');
  const [selectedSession, setSelectedSession] = useState<any | null>(null);
  const [attendanceStatus, setAttendanceStatus] = useState<{ status: string; message: string; distance?: number } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [sessionCode, setSessionCode] = useState('');
  const [joinError, setJoinError] = useState('');
  const [user, setUser] = useState<any>(null);
  const [isUserLoading, setIsUserLoading] = useState(true);
  const [isActiveSessionsLoading, setIsActiveSessionsLoading] = useState(true);
  const [isPastSessionsLoading, setIsPastSessionsLoading] = useState(true);
  const [now, setNow] = useState(new Date());
  const navigate = useNavigate();

  useEffect(() => {
    fetchUser();
    fetchPastSessions();
    fetchActiveSessions();
    const timer = setInterval(() => setNow(new Date()), 10000);
    return () => clearInterval(timer);
  }, []);

  const fetchUser = async () => {
    setIsUserLoading(true);
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.success) {
        if (data.data.requires_password_change) {
          navigate('/force-change-password');
          return;
        }
        setUser(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch user', err);
    } finally {
      setIsUserLoading(false);
    }
  };

  const fetchPastSessions = async () => {
    setIsPastSessionsLoading(true);
    try {
      const res = await fetch('/api/sessions/past');
      const data = await res.json();
      if (data.success) {
        setPastSessions(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch past sessions', err);
    } finally {
      setIsPastSessionsLoading(false);
    }
  };

  const fetchActiveSessions = async () => {
    setIsActiveSessionsLoading(true);
    try {
      const res = await fetch('/api/sessions/active');
      const data = await res.json();
      if (data.success) {
        setActiveSessions(data.data);
        if (data.data.length > 0) setSelectedSession(data.data[0]);
      }
    } catch (err) {
      console.error('Failed to fetch sessions', err);
    } finally {
      setIsActiveSessionsLoading(false);
    }
  };

  const handleJoinSession = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = sessionCode.trim();
    if (!code) return;

    // Validate format: exactly 6 alphanumeric characters
    const codeRegex = /^[A-Z0-9]{6}$/;
    if (!codeRegex.test(code)) {
      setJoinError('Session code must be exactly 6 alphanumeric characters.');
      return;
    }

    setIsJoining(true);
    setJoinError('');

    const url = `/api/sessions/verify-code?code=${encodeURIComponent(code)}`;
    console.log(`[StudentDashboard] Fetching: ${url}`);
    try {
      const res = await fetch(url);
      const data = await res.json();

      if (data.success) {
        // Immediately update local state with the joined session
        const joinedSession = data.data;
        setActiveSessions(prev => {
          const exists = prev.some(s => s.session_id === joinedSession.session_id);
          if (exists) return prev;
          return [joinedSession, ...prev];
        });
        setSelectedSession(joinedSession);
        
        // Still refresh from server to ensure everything is in sync
        await fetchActiveSessions();
        setIsJoinModalOpen(false);
        setSessionCode('');
      } else {
        setJoinError(data.message || 'Invalid session code');
      }
    } catch (err) {
      setJoinError('Failed to verify session code');
    } finally {
      setIsJoining(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      navigate('/login');
    } catch (err) {
      console.error('Logout failed', err);
    }
  };

  const generateDeviceFingerprint = () => {
    return btoa(navigator.userAgent + window.screen.width + window.screen.height + new Date().getTimezoneOffset());
  };

  const getInitials = (name: string) => {
    if (!name) return 'S';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const handleMarkAttendance = async () => {
    if (!selectedSession) return;
    
    setIsSubmitting(true);
    setAttendanceStatus(null);

    try {
      const coords = await getCoordinates();
      
      const res = await fetch('/api/attendance/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: selectedSession.session_id,
          latitude: coords.latitude,
          longitude: coords.longitude,
          device_fingerprint: generateDeviceFingerprint(),
        }),
      });

      const data = await res.json();
      const newStatus = data.data?.status || (data.success ? 'present' : 'error');
      
      setAttendanceStatus({
        status: newStatus,
        message: data.message,
        distance: data.data?.distance_meters,
      });

      if (newStatus === 'present' || newStatus === 'flagged') {
        const updatedSession = { ...selectedSession, has_attended: true };
        setSelectedSession(updatedSession);
        setActiveSessions(prev => prev.map(s => s.session_id === updatedSession.session_id ? updatedSession : s));
      }
    } catch (err: any) {
      setAttendanceStatus({ status: 'error', message: err.message || 'Failed to mark attendance' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Navigation Bar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-[9990]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <div className="bg-blue-600 p-1.5 rounded-lg">
                <MapPin className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-slate-900 text-lg tracking-tight">GeoAttend</span>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-3 px-3 py-1.5 bg-slate-50 rounded-full border border-slate-100 min-w-[140px]">
                {isUserLoading ? (
                  <>
                    <div className="w-9 h-9 rounded-full bg-slate-200 animate-pulse" />
                    <div className="space-y-1">
                      <div className="h-3 w-20 bg-slate-200 animate-pulse rounded" />
                      <div className="h-2 w-12 bg-slate-200 animate-pulse rounded" />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                      {getInitials(user?.full_name)}
                    </div>
                    <div className="text-sm">
                      <p className="font-bold text-slate-900 leading-none">{user?.full_name || 'Student'}</p>
                      <p className="text-blue-600 font-medium text-[10px] mt-0.5 uppercase tracking-wider">{user?.matric_number || 'ID'}</p>
                    </div>
                  </>
                )}
              </div>
              <button 
                onClick={handleLogout}
                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-12 gap-8">
          
          {/* Left Column: Sessions & Controls */}
          <div className="lg:col-span-7 space-y-6">
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  {isUserLoading ? (
                    <div className="h-8 w-48 bg-slate-200 animate-pulse rounded" />
                  ) : (
                    `Welcome back, ${user?.full_name?.split(' ')[0]}`
                  )}
                </h1>
                <p className="text-slate-500 mt-1">Join a session to mark your attendance.</p>
              </div>
              <button
                onClick={() => setIsJoinModalOpen(true)}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 active:scale-95"
              >
                <Plus className="w-5 h-5" />
                Join Session
              </button>
            </header>

            <div className="flex border-b border-slate-200 overflow-x-auto scrollbar-hide whitespace-nowrap">
              <button 
                onClick={() => setActiveTab('active')}
                className={`px-4 sm:px-6 py-4 text-sm font-bold transition-all border-b-2 flex-shrink-0 ${activeTab === 'active' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
              >
                Active Sessions
              </button>
              <button 
                onClick={() => setActiveTab('past')}
                className={`px-4 sm:px-6 py-4 text-sm font-bold transition-all border-b-2 flex-shrink-0 ${activeTab === 'past' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
              >
                Past Sessions
              </button>
            </div>

            {activeTab === 'active' && (
              <>
                <section className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Active Sessions
                    </h2>
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-full uppercase">
                      {isActiveSessionsLoading ? '...' : activeSessions.length} Joined
                    </span>
                  </div>
                  
                  {isActiveSessionsLoading ? (
                    <div className="grid gap-3">
                      {[1, 2].map(i => (
                        <div key={i} className="h-32 bg-white border border-slate-100 rounded-2xl animate-pulse" />
                      ))}
                    </div>
                  ) : activeSessions.length === 0 ? (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center"
                    >
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Key className="w-8 h-8 text-slate-300" />
                      </div>
                      <h3 className="text-slate-900 font-semibold">No joined sessions</h3>
                      <p className="text-slate-500 text-sm mt-1">Click "Join Session" and enter the code provided by your lecturer.</p>
                    </motion.div>
                  ) : (
                    <div className="grid gap-3">
                      {activeSessions.map((session, index) => (
                        <motion.div 
                          key={session.session_id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          onClick={() => setSelectedSession(session)}
                          className={`group relative p-5 rounded-2xl border-2 transition-all cursor-pointer overflow-hidden ${
                            selectedSession?.session_id === session.session_id 
                              ? 'border-blue-600 bg-white shadow-md' 
                              : 'border-transparent bg-white hover:border-slate-200 shadow-sm'
                          }`}
                        >
                          {selectedSession?.session_id === session.session_id && (
                            <div className="absolute top-0 left-0 w-1 h-full bg-blue-600" />
                          )}
                          <div className="flex justify-between items-start">
                            <div className="flex gap-4">
                              <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                                selectedSession?.session_id === session.session_id ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'
                              }`}>
                                <BookOpen className="w-6 h-6" />
                              </div>
                              <div>
                                <h3 className="font-bold text-slate-900">{session.course_code}</h3>
                                <p className="text-sm text-slate-500">{session.course_name}</p>
                                <div className="mt-1 flex gap-2">
                                  {now < new Date(session.start_time) ? (
                                    <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full uppercase">Starting Soon</span>
                                  ) : (
                                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full uppercase">In Progress</span>
                                  )}
                                  {session.has_attended && (
                                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-full uppercase">Attended</span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xs font-bold text-slate-400 uppercase tracking-tighter">
                                {now < new Date(session.start_time) ? 'Starts at' : 'Ends in'}
                              </div>
                              <div className="text-sm font-mono font-bold text-slate-900">
                                {new Date(now < new Date(session.start_time) ? session.start_time : session.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                          </div>
                          <div className="mt-4 flex items-center gap-4 text-xs text-slate-400">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" /> {session.zone_name}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {new Date(session.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </section>

                {selectedSession && (
                  <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
                    <div className="flex items-center justify-between">
                      <h2 className="font-bold text-slate-900">Attendance Submission</h2>
                      <GPSStatusIndicator 
                        status={isGpsLoading ? 'loading' : (coordinates ? 'success' : (gpsError ? 'error' : 'idle'))} 
                        message={gpsError || undefined} 
                      />
                    </div>
                    
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                      <p className="text-xs text-slate-500 leading-relaxed">
                        {now < new Date(selectedSession.start_time) 
                          ? `This session hasn't started yet. It is scheduled to begin at ${new Date(selectedSession.start_time).toLocaleTimeString()}.`
                          : "By clicking below, your current GPS coordinates will be verified against the lecture hall's geofence boundary. Ensure you are physically present in the hall."
                        }
                      </p>
                    </div>

                    <AttendanceSubmitButton 
                      onClick={handleMarkAttendance} 
                      isLoading={isSubmitting || isGpsLoading} 
                      disabled={!selectedSession || selectedSession.has_attended || now < new Date(selectedSession.start_time)} 
                      text={
                        selectedSession?.has_attended 
                          ? 'Attendance Marked' 
                          : now < new Date(selectedSession.start_time)
                            ? 'Starting Soon'
                            : 'Mark Attendance'
                      }
                    />

                    {attendanceStatus && (
                      <div className={`p-5 rounded-xl flex items-start gap-4 animate-in fade-in slide-in-from-bottom-4 duration-300 ${
                        attendanceStatus.status === 'present' ? 'bg-emerald-50 text-emerald-900 border border-emerald-100' :
                        attendanceStatus.status === 'flagged' ? 'bg-amber-50 text-amber-900 border border-amber-100' :
                        'bg-rose-50 text-rose-900 border border-rose-100'
                      }`}>
                        <div className={`p-2 rounded-lg ${
                          attendanceStatus.status === 'present' ? 'bg-emerald-100 text-emerald-600' :
                          attendanceStatus.status === 'flagged' ? 'bg-amber-100 text-amber-600' :
                          'bg-rose-100 text-rose-600'
                        }`}>
                          {attendanceStatus.status === 'present' && <CheckCircle className="w-5 h-5" />}
                          {attendanceStatus.status === 'flagged' && <AlertTriangle className="w-5 h-5" />}
                          {(attendanceStatus.status === 'rejected' || attendanceStatus.status === 'error') && <XCircle className="w-5 h-5" />}
                        </div>
                        
                        <div className="flex-1">
                          <div className="font-bold capitalize text-sm">{attendanceStatus.status}</div>
                          <div className="text-xs mt-1 opacity-90">{attendanceStatus.message}</div>
                          {attendanceStatus.distance !== undefined && (
                            <div className="mt-3 pt-3 border-t border-current border-opacity-10 flex justify-between items-center">
                              <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">Distance Analysis</span>
                              <span className="text-xs font-mono font-bold">
                                {attendanceStatus.distance}m / {selectedSession.radius_meters}m
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </section>
                )}
              </>
            )}

            {activeTab === 'past' && (
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Past Sessions
                  </h2>
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold rounded-full uppercase">
                    {isPastSessionsLoading ? '...' : pastSessions.length} Total
                  </span>
                </div>
                
                {isPastSessionsLoading ? (
                  <div className="grid gap-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-24 bg-white border border-slate-100 rounded-2xl animate-pulse" />
                    ))}
                  </div>
                ) : pastSessions.length === 0 ? (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center"
                  >
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Clock className="w-8 h-8 text-slate-300" />
                    </div>
                    <h3 className="text-slate-900 font-semibold">No past sessions</h3>
                    <p className="text-slate-500 text-sm mt-1">You haven't had any sessions yet.</p>
                  </motion.div>
                ) : (
                  <div className="grid gap-3">
                    {pastSessions.map((session, index) => (
                      <motion.div 
                        key={session.session_id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="flex gap-4">
                          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center">
                            <BookOpen className="w-6 h-6" />
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-900">{session.course_code}</h3>
                            <p className="text-sm text-slate-500">{session.course_name}</p>
                            <div className="mt-2 flex items-center gap-4 text-xs text-slate-400">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" /> {new Date(session.start_time).toLocaleDateString()}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" /> {new Date(session.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="self-start sm:self-center">
                          {session.attendance_status === 'present' ? (
                            <span className="px-3 py-1.5 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full flex items-center gap-1.5 shadow-sm">
                              <CheckCircle className="w-3.5 h-3.5" /> Present
                            </span>
                          ) : session.attendance_status === 'flagged' ? (
                            <span className="px-3 py-1.5 bg-amber-100 text-amber-700 text-xs font-bold rounded-full flex items-center gap-1.5 shadow-sm">
                              <AlertTriangle className="w-3.5 h-3.5" /> Flagged
                            </span>
                          ) : (
                            <span className="px-3 py-1.5 bg-rose-100 text-rose-700 text-xs font-bold rounded-full flex items-center gap-1.5 shadow-sm">
                              <XCircle className="w-3.5 h-3.5" /> Not Present
                            </span>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </section>
            )}
          </div>

          {/* Right Column: Map & Info */}
          {activeTab === 'active' && (
            <div className="lg:col-span-5 space-y-6">
            {selectedSession ? (
              <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-full flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-bold text-slate-900 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-blue-600" />
                    Live Location Map
                  </h2>
                  <div className="px-2 py-1 bg-slate-100 rounded-md text-[10px] font-bold text-slate-500 uppercase">
                    Radius: {selectedSession.radius_meters}m
                  </div>
                </div>
                
                <div className="flex-1 min-h-[300px] relative">
                  <GeofenceMapPreview 
                    zoneLat={parseFloat(selectedSession.latitude)} 
                    zoneLon={parseFloat(selectedSession.longitude)} 
                    radiusMeters={selectedSession.radius_meters}
                    userLat={coordinates?.latitude}
                    userLon={coordinates?.longitude}
                  />
                </div>
                
                <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <h4 className="text-xs font-bold text-blue-700 uppercase mb-2">How it works</h4>
                  <ul className="text-[11px] text-blue-600 space-y-2">
                    <li className="flex gap-2">
                      <span className="font-bold">•</span>
                      <span>The blue circle represents the allowed attendance zone.</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-bold">•</span>
                      <span>Your device must be within this boundary to be marked present.</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-bold">•</span>
                      <span>GPS spoofing or using VPNs will flag your account for investigation.</span>
                    </li>
                  </ul>
                </div>
              </section>
            ) : (
              <div className="bg-slate-100 rounded-2xl p-12 text-center border-2 border-dashed border-slate-200 h-full flex flex-col justify-center">
                <MapPin className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-slate-400 font-medium">Select a session to view map</h3>
              </div>
            )}
          </div>
          )}
        </div>
      </main>

      {/* Join Session Modal */}
      <AnimatePresence>
        {isJoinModalOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-8">
                <div className="flex justify-between items-start mb-6">
                  <div className="bg-blue-50 p-3 rounded-2xl">
                    <Key className="w-6 h-6 text-blue-600" />
                  </div>
                  <button 
                    onClick={() => {
                      setIsJoinModalOpen(false);
                      setJoinError('');
                      setSessionCode('');
                    }}
                    className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                  >
                    <XCircle className="w-6 h-6 text-slate-400" />
                  </button>
                </div>
                
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Join Session</h2>
                <p className="text-slate-500 text-sm mb-8">Enter the 6-character unique code provided by your lecturer to join the active session.</p>
                
                <form onSubmit={handleJoinSession} className="space-y-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Session Code</label>
                    <input 
                      type="text"
                      value={sessionCode}
                      onChange={(e) => setSessionCode(e.target.value.toUpperCase())}
                      placeholder="e.g. A1B2C3"
                      maxLength={6}
                      className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-2xl font-mono font-bold text-center tracking-[0.5em] focus:border-blue-600 focus:bg-white outline-none transition-all placeholder:text-slate-200"
                      required
                    />
                    {joinError && (
                      <motion.p 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-rose-500 text-xs font-medium mt-3 flex items-center gap-1.5"
                      >
                        <AlertTriangle className="w-3.5 h-3.5" />
                        {joinError}
                      </motion.p>
                    )}
                  </div>
                  
                  <button
                    type="submit"
                    disabled={isJoining || sessionCode.length < 6}
                    className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isJoining ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      'Verify & Join'
                    )}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
