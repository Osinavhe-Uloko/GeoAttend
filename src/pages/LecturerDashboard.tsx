import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGPS } from '../hooks/useGPS';
import { 
  MapPin, Clock, Plus, BookOpen, Users, LogOut, 
  ChevronRight, Calendar, Settings, AlertCircle, CheckCircle, Loader2, X, Copy, Download, Edit2, Trash2
} from 'lucide-react';

export const LecturerDashboard: React.FC = () => {
  const { getCoordinates, isLoading: isGpsLoading } = useGPS();
  const [activeTab, setActiveTab] = useState<'sessions' | 'zones'>('sessions');
  const [sessions, setSessions] = useState<any[]>([]);
  const [zones, setZones] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [isUserLoading, setIsUserLoading] = useState(true);
  const [isSessionsLoading, setIsSessionsLoading] = useState(true);
  const [isZonesLoading, setIsZonesLoading] = useState(true);
  const [isCoursesLoading, setIsCoursesLoading] = useState(true);
  const navigate = useNavigate();

  // Form states
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [showZoneModal, setShowZoneModal] = useState(false);
  const [editingSession, setEditingSession] = useState<any>(null);
  const [newSession, setNewSession] = useState({ course_id: '', geofence_zone_id: '', start_time: '', end_time: '' });
  const [newZone, setNewZone] = useState({ zone_name: '', latitude: '', longitude: '', radius_meters: 100, course_id: '' });
  const [zoneToDelete, setZoneToDelete] = useState<string | null>(null);
  const [selectedSessionDetails, setSelectedSessionDetails] = useState<any>(null);
  const [sessionAttendance, setSessionAttendance] = useState<any[]>([]);
  const [isAttendanceLoading, setIsAttendanceLoading] = useState(false);

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    fetchUser();
    fetchSessions();
    fetchZones();
    fetchCourses();
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
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

  const fetchSessions = async () => {
    setIsSessionsLoading(true);
    try {
      const res = await fetch('/api/sessions');
      const data = await res.json();
      if (data.success) setSessions(data.data);
    } catch (err) {
      console.error('Failed to fetch sessions', err);
    } finally {
      setIsSessionsLoading(false);
    }
  };

  const fetchZones = async () => {
    setIsZonesLoading(true);
    try {
      const res = await fetch('/api/zones');
      const data = await res.json();
      if (data.success) setZones(data.data);
    } catch (err) {
      console.error('Failed to fetch zones', err);
    } finally {
      setIsZonesLoading(false);
    }
  };

  const fetchCourses = async () => {
    setIsCoursesLoading(true);
    try {
      const res = await fetch('/api/admin/courses');
      const data = await res.json();
      if (data.success) setCourses(data.data);
    } catch (err) {
      console.error('Failed to fetch courses', err);
    } finally {
      setIsCoursesLoading(false);
    }
  };

  const fetchInitialData = () => {
    fetchSessions();
    fetchZones();
    fetchCourses();
  };

  useEffect(() => {
    if (selectedSessionDetails) {
      fetchSessionAttendance(selectedSessionDetails.session_id);
    } else {
      setSessionAttendance([]);
    }
  }, [selectedSessionDetails]);

  const fetchSessionAttendance = async (sessionId: string) => {
    setIsAttendanceLoading(true);
    try {
      const res = await fetch(`/api/sessions/${sessionId}/attendance`);
      const data = await res.json();
      if (data.success) {
        setSessionAttendance(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch attendance', err);
    } finally {
      setIsAttendanceLoading(false);
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

  const handleUseCurrentLocation = async () => {
    try {
      const coords = await getCoordinates();
      setNewZone(prev => ({
        ...prev,
        latitude: coords.latitude.toFixed(7),
        longitude: coords.longitude.toFixed(7)
      }));
    } catch (err: any) {
      alert(err.message || 'Failed to get current location');
    }
  };

  const parseLocalDatetime = (dtString: string) => {
    const [datePart, timePart] = dtString.split('T');
    const [year, month, day] = datePart.split('-').map(Number);
    const [hours, minutes] = timePart.split(':').map(Number);
    return new Date(year, month - 1, day, hours, minutes);
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingSession ? `/api/sessions/${editingSession.session_id}` : '/api/sessions';
      const method = editingSession ? 'PATCH' : 'POST';
      
      const payload = {
        ...newSession,
        start_time: parseLocalDatetime(newSession.start_time).toISOString(),
        end_time: parseLocalDatetime(newSession.end_time).toISOString()
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        alert(editingSession ? 'Session updated successfully!' : 'Session created successfully!');
        setShowSessionModal(false);
        setEditingSession(null);
        setNewSession({ course_id: '', geofence_zone_id: '', start_time: '', end_time: '' });
        fetchInitialData();
      } else {
        alert('Error: ' + (data.message || 'Unknown error'));
      }
    } catch (err) {
      console.error('Failed to save session', err);
      alert('An error occurred');
    }
  };

  const toLocalDatetimeString = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const handleEditSession = (session: any) => {
    setEditingSession(session);
    setNewSession({
      course_id: session.course_id,
      geofence_zone_id: session.geofence_zone_id,
      start_time: toLocalDatetimeString(session.start_time),
      end_time: toLocalDatetimeString(session.end_time)
    });
    setShowSessionModal(true);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Session code copied: ' + text);
  };

  const downloadCSV = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/sessions/csv/${sessionId}`);
      if (!response.ok) {
        const data = await response.json();
        alert(data.message || 'Failed to download CSV');
        return;
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance_${sessionId}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error downloading CSV:', err);
      alert('Failed to download CSV');
    }
  };

  const getInitials = (name: string) => {
    if (!name) return 'L';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const handleCreateZone = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Submitting zone creation form:', newZone);
    try {
      // Ensure course_id is null if empty string to avoid DB errors
      const zoneData = {
        ...newZone,
        course_id: newZone.course_id === '' ? null : newZone.course_id,
        radius_meters: Number(newZone.radius_meters) || 100,
        latitude: parseFloat(newZone.latitude),
        longitude: parseFloat(newZone.longitude)
      };

      if (isNaN(zoneData.latitude) || isNaN(zoneData.longitude)) {
        alert('Please provide valid coordinates');
        return;
      }

      const res = await fetch('/api/zones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(zoneData),
      });
      const data = await res.json();
      console.log('Zone creation response:', data);
      if (data.success) {
        alert('Zone saved successfully!');
        setShowZoneModal(false);
        fetchInitialData();
        setNewZone({ zone_name: '', latitude: '', longitude: '', radius_meters: 100, course_id: '' });
      } else {
        alert(data.message || 'Failed to create zone');
      }
    } catch (err) {
      console.error('Failed to create zone', err);
      alert('An error occurred while creating the zone');
    }
  };

  const handleDeleteZone = async () => {
    if (!zoneToDelete) return;
    try {
      const res = await fetch(`/api/zones/${zoneToDelete}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setZoneToDelete(null);
        fetchInitialData();
      } else {
        console.error(data.message || 'Failed to delete zone');
      }
    } catch (err) {
      console.error('Failed to delete zone', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Navigation Bar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-[9990]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <div className="bg-indigo-600 p-1.5 rounded-lg">
                <Users className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-slate-900 text-lg tracking-tight">GeoAttend Lecturer</span>
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
                    <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                      {getInitials(user?.full_name)}
                    </div>
                    <div className="text-sm">
                      <p className="font-bold text-slate-900 leading-none">{user?.full_name || 'Lecturer'}</p>
                      <p className="text-indigo-600 font-medium text-[10px] mt-0.5 uppercase tracking-wider">{user?.department || 'Faculty'}</p>
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Lecturer Dashboard</h1>
            <p className="text-sm text-slate-500">Manage your lecture sessions and geofence zones.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button 
              onClick={() => setShowZoneModal(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl font-semibold text-sm hover:bg-slate-50 transition-colors"
            >
              <MapPin className="w-4 h-4" />
              New Zone
            </button>
            <button 
              onClick={() => setShowSessionModal(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Start Session
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 mb-6 overflow-x-auto scrollbar-hide whitespace-nowrap">
          <button 
            onClick={() => setActiveTab('sessions')}
            className={`px-4 sm:px-6 py-4 text-sm font-bold transition-all border-b-2 flex-shrink-0 ${activeTab === 'sessions' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
          >
            Lecture Sessions
          </button>
          <button 
            onClick={() => setActiveTab('zones')}
            className={`px-4 sm:px-6 py-4 text-sm font-bold transition-all border-b-2 flex-shrink-0 ${activeTab === 'zones' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
          >
            Geofence Zones
          </button>
        </div>

        {/* Content */}
        {activeTab === 'sessions' && (
          <div className="grid gap-4">
            {isSessionsLoading ? (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-8 space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-12 bg-slate-50 animate-pulse rounded-xl" />
                  ))}
                </div>
              </div>
            ) : sessions.length === 0 ? (
              <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center">
                <Clock className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                <h3 className="text-slate-900 font-semibold">No sessions created yet</h3>
                <p className="text-slate-500 text-sm mt-1">Click "Start Session" to begin tracking attendance.</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Course</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Zone</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Code</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Time Window</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {sessions.map(session => (
                      <tr 
                        key={session.session_id} 
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div 
                            className="cursor-pointer group"
                            onClick={() => setSelectedSessionDetails(session)}
                          >
                            <div className="font-bold text-indigo-600 group-hover:text-indigo-800 group-hover:underline">
                              {session.course_code}
                            </div>
                            <div className="text-xs text-slate-500 group-hover:text-slate-700">{session.course_name}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 text-sm text-slate-600">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            {session.zone_name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {currentTime > new Date(session.end_time) ? (
                            <span className="text-xs text-slate-400 italic">Hidden (Ended)</span>
                          ) : (
                            <div className="flex items-center gap-2">
                              <code className="bg-slate-100 px-2 py-1 rounded text-indigo-600 font-mono font-bold text-sm">
                                {session.session_code}
                              </code>
                              <button 
                                onClick={(e) => { e.stopPropagation(); copyToClipboard(session.session_code); }}
                                className="p-1 text-slate-400 hover:text-indigo-600 transition-colors"
                                title="Copy Code"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-xs font-mono text-slate-600">
                            {new Date(session.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(session.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {new Date(session.start_time).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {currentTime > new Date(session.start_time) && currentTime < new Date(session.end_time) ? (
                            <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full uppercase">Active</span>
                          ) : currentTime > new Date(session.end_time) ? (
                            <span className="px-2 py-1 bg-slate-100 text-slate-500 text-[10px] font-bold rounded-full uppercase">Ended</span>
                          ) : (
                            <span className="px-2 py-1 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full uppercase">Scheduled</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex justify-end gap-2">
                            {currentTime < new Date(session.start_time) && (
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleEditSession(session); }}
                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                title="Edit Session"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                            )}
                            <button 
                              onClick={(e) => { e.stopPropagation(); downloadCSV(session.session_id); }}
                              className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                              title="Download CSV"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'zones' && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isZonesLoading ? (
              [1, 2, 3].map(i => (
                <div key={i} className="h-48 bg-white border border-slate-200 rounded-2xl animate-pulse" />
              ))
            ) : (
              <>
                {zones.map(zone => (
                  <div key={zone.zone_id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-indigo-200 transition-all group">
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                        <MapPin className="w-5 h-5" />
                      </div>
                      <div className="flex gap-2">
                        <button className="text-slate-400 hover:text-slate-600">
                          <Settings className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => setZoneToDelete(zone.zone_id)}
                          className="text-slate-400 hover:text-red-500 transition-colors"
                          title="Delete Zone"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <h3 className="font-bold text-slate-900">{zone.zone_name}</h3>
                    <div className="mt-4 space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Radius</span>
                        <span className="font-bold text-slate-700">{zone.radius_meters}m</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Coordinates</span>
                        <span className="font-mono text-slate-700">{parseFloat(zone.latitude).toFixed(4)}, {parseFloat(zone.longitude).toFixed(4)}</span>
                      </div>
                    </div>
                  </div>
                ))}
                <button 
                  onClick={() => setShowZoneModal(true)}
                  className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center text-slate-400 hover:bg-white hover:border-indigo-300 hover:text-indigo-500 transition-all"
                >
                  <Plus className="w-8 h-8 mb-2" />
                  <span className="font-bold text-sm">Create New Zone</span>
                </button>
              </>
            )}
          </div>
        )}
      </main>

      {/* Modals */}
      {zoneToDelete && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Delete Zone</h3>
            <p className="text-sm text-slate-500 mb-6">Are you sure you want to delete this zone? This action cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setZoneToDelete(null)}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteZone}
                className="px-4 py-2 text-sm font-semibold bg-red-600 text-white hover:bg-red-700 rounded-xl transition-colors shadow-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {showSessionModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="font-bold text-slate-900">{editingSession ? 'Edit Session' : 'Start Lecture Session'}</h2>
              <button onClick={() => { setShowSessionModal(false); setEditingSession(null); }} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateSession} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Select Course</label>
                <select 
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  value={newSession.course_id}
                  onChange={e => setNewSession({...newSession, course_id: e.target.value})}
                >
                  <option value="">Choose a course...</option>
                  {courses.map(c => <option key={c.course_id} value={c.course_id}>{c.course_code} - {c.course_name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Select Zone</label>
                <select 
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  value={newSession.geofence_zone_id}
                  onChange={e => setNewSession({...newSession, geofence_zone_id: e.target.value})}
                >
                  <option value="">Choose a location...</option>
                  {zones.map(z => <option key={z.zone_id} value={z.zone_id}>{z.zone_name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Start Time</label>
                  <input 
                    type="datetime-local" 
                    required
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    value={newSession.start_time}
                    onChange={e => setNewSession({...newSession, start_time: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">End Time</label>
                  <input 
                    type="datetime-local" 
                    required
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    value={newSession.end_time}
                    onChange={e => setNewSession({...newSession, end_time: e.target.value})}
                  />
                </div>
              </div>
              <button 
                type="submit"
                className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 mt-4"
              >
                {editingSession ? 'Update Session' : 'Create Session'}
              </button>
            </form>
          </div>
        </div>
      )}

      {showZoneModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="font-bold text-slate-900">Create Geofence Zone</h2>
              <button onClick={() => setShowZoneModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateZone} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Zone Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Lecture Theater 1"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  value={newZone.zone_name}
                  onChange={e => setNewZone({...newZone, zone_name: e.target.value})}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-400 uppercase">Coordinates</label>
                <button 
                  type="button"
                  onClick={handleUseCurrentLocation}
                  disabled={isGpsLoading}
                  className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 uppercase tracking-wider disabled:opacity-50"
                >
                  {isGpsLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <MapPin className="w-3 h-3" />}
                  Use Current Location
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Latitude</label>
                  <input 
                    type="number" 
                    step="any"
                    required
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    value={newZone.latitude}
                    onChange={e => setNewZone({...newZone, latitude: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Longitude</label>
                  <input 
                    type="number" 
                    step="any"
                    required
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    value={newZone.longitude}
                    onChange={e => setNewZone({...newZone, longitude: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Radius (meters)</label>
                <input 
                  type="number" 
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  value={newZone.radius_meters}
                  onChange={e => setNewZone({...newZone, radius_meters: e.target.value as any})}
                />
              </div>
              <button 
                type="submit"
                className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 mt-4"
              >
                Save Zone
              </button>
            </form>
          </div>
        </div>
      )}

      {selectedSessionDetails && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={() => setSelectedSessionDetails(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="font-bold text-slate-900">Session Details</h2>
              <button onClick={() => setSelectedSessionDetails(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Course</label>
                <div className="font-bold text-slate-900">{selectedSessionDetails.course_code}</div>
                <div className="text-sm text-slate-500">{selectedSessionDetails.course_name}</div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Zone</label>
                <div className="flex items-center gap-1.5 text-sm text-slate-700">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  {selectedSessionDetails.zone_name}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Session Code</label>
                <div className="flex items-center gap-2">
                  <code className="bg-indigo-50 px-3 py-1.5 rounded-lg text-indigo-700 font-mono font-bold text-lg">
                    {selectedSessionDetails.session_code}
                  </code>
                  <button 
                    onClick={() => copyToClipboard(selectedSessionDetails.session_code)}
                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    title="Copy Code"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Time Window</label>
                <div className="text-sm text-slate-700">
                  {new Date(selectedSessionDetails.start_time).toLocaleString()} - {new Date(selectedSessionDetails.end_time).toLocaleString()}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Attendance ({sessionAttendance.length})</label>
                <div className="max-h-48 overflow-y-auto space-y-2 pr-2">
                  {isAttendanceLoading ? (
                    <div className="flex items-center justify-center py-4 text-slate-400">
                      <Loader2 className="w-5 h-5 animate-spin" />
                    </div>
                  ) : sessionAttendance.length === 0 ? (
                    <div className="text-sm text-slate-500 text-center py-2">No attendance records yet.</div>
                  ) : (
                    sessionAttendance.map((record, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                        <div>
                          <div className="text-sm font-bold text-slate-900">{record.full_name}</div>
                          <div className="text-xs text-slate-500">{record.matric_number}</div>
                        </div>
                        <div className="text-right">
                          <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${
                            record.status === 'present' ? 'bg-emerald-100 text-emerald-700' :
                            record.status === 'flagged' ? 'bg-amber-100 text-amber-700' :
                            'bg-rose-100 text-rose-700'
                          }`}>
                            {record.status}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                {currentTime <= new Date(selectedSessionDetails.end_time) && (
                  <button 
                    onClick={() => {
                      setSelectedSessionDetails(null);
                      handleEditSession(selectedSessionDetails);
                    }}
                    className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </button>
                )}
                <button 
                  onClick={() => downloadCSV(selectedSessionDetails.session_id)}
                  className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200 flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download CSV
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

