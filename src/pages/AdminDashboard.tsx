import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, AlertTriangle, CheckCircle, Clock, LogOut, MapPin, X } from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [lecturers, setLecturers] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('anomalies');
  const [user, setUser] = useState<any>(null);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showLecturerModal, setShowLecturerModal] = useState(false);
  const [newCourse, setNewCourse] = useState({
    course_code: '',
    course_name: '',
    lecturer_id: '',
    department: '',
    semester: 1,
    academic_year: '2025/2026'
  });
  const [newLecturer, setNewLecturer] = useState({
    full_name: '',
    email: '',
    password: '',
    department: ''
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchUser();
    fetchAnomalies();
    fetchAttendance();
    fetchCourses();
    fetchLecturers();
  }, []);

  const fetchUser = async () => {
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

  const getInitials = (name: string) => {
    if (!name) return 'A';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const fetchAnomalies = async () => {
    try {
      const res = await fetch('/api/admin/anomalies');
      const data = await res.json();
      if (data.success) setAnomalies(data.data);
    } catch (err) {
      console.error('Failed to fetch anomalies', err);
    }
  };

  const fetchAttendance = async () => {
    try {
      const res = await fetch('/api/admin/attendance');
      const data = await res.json();
      if (data.success) setAttendance(data.data);
    } catch (err) {
      console.error('Failed to fetch attendance', err);
    }
  };

  const fetchCourses = async () => {
    try {
      const res = await fetch('/api/admin/courses');
      const data = await res.json();
      if (data.success) setCourses(data.data);
    } catch (err) {
      console.error('Failed to fetch courses', err);
    }
  };

  const fetchLecturers = async () => {
    try {
      console.log('Fetching lecturers...');
      const res = await fetch('/api/admin/lecturers');
      const data = await res.json();
      console.log('Lecturers data received:', data);
      if (data.success) {
        setLecturers(data.data);
      } else {
        console.error('Failed to fetch lecturers:', data.message);
      }
    } catch (err) {
      console.error('Failed to fetch lecturers', err);
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Submitting course creation form:', newCourse);
    try {
      const res = await fetch('/api/admin/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCourse),
      });
      const data = await res.json();
      console.log('Course creation response:', data);
      if (data.success) {
        alert('Course created successfully!');
        setShowCourseModal(false);
        fetchCourses();
        setNewCourse({
          course_code: '',
          course_name: '',
          lecturer_id: '',
          department: '',
          semester: 1,
          academic_year: '2025/2026'
        });
      } else {
        alert('Failed to create course: ' + (data.message || 'Unknown error'));
      }
    } catch (err) {
      console.error('Failed to create course', err);
      alert('An error occurred while creating the course');
    }
  };

  const handleCreateLecturer = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Submitting lecturer creation form:', newLecturer);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newLecturer, role_name: 'lecturer' }),
      });
      const data = await res.json();
      console.log('Lecturer creation response:', data);
      if (data.success) {
        alert('Lecturer account created successfully!');
        setShowLecturerModal(false);
        fetchLecturers();
        setNewLecturer({
          full_name: '',
          email: '',
          password: '',
          department: ''
        });
      } else {
        alert('Failed to create lecturer: ' + (data.message || 'Unknown error'));
      }
    } catch (err) {
      console.error('Failed to create lecturer', err);
      alert('An error occurred while creating the lecturer account');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation Bar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-[9990]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <div className="bg-slate-900 p-1.5 rounded-lg">
                <MapPin className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-slate-900 text-lg tracking-tight">GeoAttend Admin</span>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-3 px-3 py-1.5 bg-slate-50 rounded-full border border-slate-100">
                <div className="w-9 h-9 rounded-full bg-slate-900 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                  {getInitials(user?.full_name)}
                </div>
                <div className="text-sm">
                  <p className="font-bold text-slate-900 leading-none">{user?.full_name || 'Admin'}</p>
                  <p className="text-slate-500 font-medium text-[10px] mt-0.5 uppercase tracking-wider">Administrator</p>
                </div>
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

      <div className="max-w-7xl mx-auto p-6 space-y-8">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">System Overview</h1>
            <p className="text-sm sm:text-base text-gray-500">Real-time monitoring and anomaly detection</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {activeTab === 'courses' && (
              <button 
                onClick={() => setShowCourseModal(true)}
                className="w-full sm:w-auto px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold text-sm hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
              >
                Add New Course
              </button>
            )}
            {activeTab === 'lecturers' && (
              <button 
                onClick={() => setShowLecturerModal(true)}
                className="w-full sm:w-auto px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold text-sm hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
              >
                Add New Lecturer
              </button>
            )}
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="p-3 bg-red-100 rounded-lg text-red-600"><AlertTriangle className="w-6 h-6" /></div>
            <div>
              <div className="text-sm text-gray-500 font-medium">Anomalies Detected</div>
              <div className="text-2xl font-bold text-gray-900">{anomalies.length}</div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg text-green-600"><CheckCircle className="w-6 h-6" /></div>
            <div>
              <div className="text-sm text-gray-500 font-medium">Total Attendance</div>
              <div className="text-2xl font-bold text-gray-900">{attendance.length}</div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="p-3 bg-indigo-100 rounded-lg text-indigo-600"><Clock className="w-6 h-6" /></div>
            <div>
              <div className="text-sm text-gray-500 font-medium">Active Courses</div>
              <div className="text-2xl font-bold text-gray-900">{courses.length}</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex border-b overflow-x-auto scrollbar-hide whitespace-nowrap">
            <button 
              className={`px-4 sm:px-6 py-4 font-medium text-sm focus:outline-none flex-shrink-0 ${activeTab === 'anomalies' ? 'border-b-2 border-red-500 text-red-600' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('anomalies')}
            >
              Anomalies & Spoof Alerts
            </button>
            <button 
              className={`px-4 sm:px-6 py-4 font-medium text-sm focus:outline-none flex-shrink-0 ${activeTab === 'attendance' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('attendance')}
            >
              All Attendance Records
            </button>
            <button 
              className={`px-4 sm:px-6 py-4 font-medium text-sm focus:outline-none flex-shrink-0 ${activeTab === 'courses' ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('courses')}
            >
              Course Management
            </button>
            <button 
              className={`px-4 sm:px-6 py-4 font-medium text-sm focus:outline-none flex-shrink-0 ${activeTab === 'lecturers' ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('lecturers')}
            >
              Lecturer Management
            </button>
          </div>

          <div className="p-0">
            <div className="overflow-x-auto">
              {activeTab === 'courses' ? (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lecturer</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Semester</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {courses.map((course: any) => (
                      <tr key={course.course_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{course.course_name}</div>
                          <div className="text-sm text-gray-500">{course.course_code}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {course.lecturer_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {course.department}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {course.semester}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {course.academic_year}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : activeTab === 'lecturers' ? (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {lecturers.map((lecturer: any) => (
                      <tr key={lecturer.user_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{lecturer.full_name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {lecturer.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {lecturer.department}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Distance</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {(activeTab === 'anomalies' ? anomalies : attendance).map((record: any) => (
                      <tr key={record.record_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{record.full_name}</div>
                          <div className="text-sm text-gray-500">{record.matric_number}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {record.course_code}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {(() => {
                            const isSpoof = record.anomaly_reason?.toLowerCase().includes('spoof') || record.event_type === 'spoof_alert';
                            const displayStatus = isSpoof ? 'Spoofed' : record.status.charAt(0).toUpperCase() + record.status.slice(1);
                            
                            return (
                              <div className="flex flex-col items-start gap-1">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  record.status === 'present' ? 'bg-green-100 text-green-800' : 
                                  isSpoof ? 'bg-red-100 text-red-800' : 
                                  record.status === 'flagged' ? 'bg-orange-100 text-orange-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {displayStatus}
                                </span>
                                {activeTab === 'anomalies' && record.anomaly_reason && (
                                  <span className="text-[10px] text-gray-500 max-w-[150px] truncate" title={record.anomaly_reason}>
                                    {record.anomaly_reason}
                                  </span>
                                )}
                              </div>
                            );
                          })()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {record.haversine_distance_meters}m
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(record.submitted_at).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            {((activeTab === 'anomalies' ? anomalies : 
               activeTab === 'attendance' ? attendance : 
               activeTab === 'courses' ? courses : 
               lecturers)).length === 0 && (
              <div className="p-8 text-center text-gray-500">No records found.</div>
            )}
          </div>
        </div>
      </div>

      {/* Course Creation Modal */}
      {showCourseModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-slate-800">Create New Course</h3>
              <button onClick={() => setShowCourseModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateCourse} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Course Code</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. CSC 401"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    value={newCourse.course_code}
                    onChange={e => setNewCourse({...newCourse, course_code: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Department</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Computer Science"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    value={newCourse.department}
                    onChange={e => setNewCourse({...newCourse, department: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Course Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Artificial Intelligence"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  value={newCourse.course_name}
                  onChange={e => setNewCourse({...newCourse, course_name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Assign Lecturer</label>
                <select 
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  value={newCourse.lecturer_id}
                  onChange={e => setNewCourse({...newCourse, lecturer_id: e.target.value})}
                >
                  <option value="">Select a lecturer</option>
                  {lecturers.map(l => (
                    <option key={l.user_id} value={l.user_id}>{l.full_name} ({l.department})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Semester</label>
                  <select 
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    value={newCourse.semester}
                    onChange={e => setNewCourse({...newCourse, semester: parseInt(e.target.value)})}
                  >
                    <option value={1}>1st Semester</option>
                    <option value={2}>2nd Semester</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Academic Year</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. 2025/2026"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    value={newCourse.academic_year}
                    onChange={e => setNewCourse({...newCourse, academic_year: e.target.value})}
                  />
                </div>
              </div>
              <button 
                type="submit"
                className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 mt-4"
              >
                Create Course
              </button>
            </form>
          </div>
        </div>
      )}
      {/* Lecturer Creation Modal */}
      {showLecturerModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-slate-800">Add New Lecturer</h3>
              <button onClick={() => setShowLecturerModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateLecturer} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Full Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Dr. Jane Smith"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  value={newLecturer.full_name}
                  onChange={e => setNewLecturer({...newLecturer, full_name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Email Address</label>
                <input 
                  type="email" 
                  required
                  placeholder="e.g. jane.smith@uniben.edu"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  value={newLecturer.email}
                  onChange={e => setNewLecturer({...newLecturer, email: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Password</label>
                <input 
                  type="password" 
                  required
                  placeholder="Minimum 8 characters"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  value={newLecturer.password}
                  onChange={e => setNewLecturer({...newLecturer, password: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Department</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Computer Science"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  value={newLecturer.department}
                  onChange={e => setNewLecturer({...newLecturer, department: e.target.value})}
                />
              </div>
              <button 
                type="submit"
                className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 mt-4"
              >
                Create Lecturer Account
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
