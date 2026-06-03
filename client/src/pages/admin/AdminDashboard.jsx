import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ exams: 0, results: 0, students: 0, admins: 0 });
  const [recentResults, setRecentResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newFeedbackCount, setNewFeedbackCount] = useState(0);

  useEffect(() => {
    Promise.all([
      api.get('/admin/exams'),
      api.get('/admin/results'),
      api.get('/admin/students'),
    ]).then(([exams, results, users]) => {
      const students = users.data.filter(u => u.role === 'student').length;
      const admins = users.data.filter(u => u.role === 'admin').length;
      setStats({ exams: exams.data.length, results: results.data.length, students, admins });
      setRecentResults(results.data.slice(0, 5));
    }).finally(() => setLoading(false));
  }, []);

  // Check for new feedback only for admins
  useEffect(() => {
    if (user?.role !== 'admin') return;

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Initial check
    checkNewFeedback();

    // Check every 10 seconds
    const interval = setInterval(checkNewFeedback, 10000);
    return () => clearInterval(interval);
  }, [user?.role]);

  const checkNewFeedback = async () => {
    try {
      const res = await api.get('/feedback?status=new');
      const count = res.data.length;
      if (count > 0 && count > newFeedbackCount) {
        setNewFeedbackCount(count);
        // Show browser notification
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('New Student Feedback', {
            body: `You have ${count} new feedback submission(s) waiting for review`,
            icon: '💬'
          });
        }
      }
      setNewFeedbackCount(count);
    } catch (err) {
      console.error('Error checking feedback:', err);
    }
  };

  const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-7xl mx-auto px-4 xl:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
              {user?.role === 'teacher' ? 'Teacher Dashboard' : 'Admin Dashboard'}
            </h1>
            <p className="text-gray-500 text-sm">
              Welcome, {user?.name}
              {user?.role === 'teacher' && user?.department && (
                <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">
                  🏫 {user.department}
                </span>
              )}
            </p>
          </div>
        </div>

        {user?.role === 'admin' && newFeedbackCount > 0 && (
          <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-lg mb-6 flex items-center justify-between">
            <span className="text-sm font-medium">
              🔔 You have <strong>{newFeedbackCount}</strong> new student feedback waiting for review
            </span>
            <Link
              to="/admin/feedback"
              className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-1.5 rounded text-sm font-medium transition"
            >
              View Now
            </Link>
          </div>
        )}

        {}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">          {[
            { label: 'Exams', value: stats.exams, icon: '📋', color: 'indigo', link: '/admin/exams' },
            { label: 'Submissions', value: stats.results, icon: '📊', color: 'green', link: '/admin/results' },
            { label: 'Students', value: stats.students, icon: '🎓', color: 'blue', link: '/admin/students' },
            { label: 'Admins', value: stats.admins, icon: '👑', color: 'purple', link: '/admin/students' },
          ].map(({ label, value, icon, color, link }) => (
            <Link key={label} to={link}
              className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition p-3 sm:p-5">
              <div className="text-2xl sm:text-3xl mb-1 sm:mb-2">{icon}</div>
              <div className={`text-2xl sm:text-3xl font-bold text-${color}-600`}>{loading ? '...' : value}</div>
              <div className="text-xs sm:text-sm text-gray-500">{label}</div>
            </Link>
          ))}
        </div>

        {}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
          <Link to="/admin/exams/new" className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl p-4 sm:p-5 transition">
            <div className="text-2xl mb-1">➕</div>
            <div className="font-bold text-sm sm:text-base">Create New Exam</div>
            <div className="text-indigo-200 text-xs sm:text-sm mt-0.5">Add questions and configure</div>
          </Link>
          <Link to="/admin/students" className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl p-4 sm:p-5 transition">
            <div className="text-2xl mb-1">👥</div>
            <div className="font-bold text-sm sm:text-base">Manage Students</div>
            <div className="text-purple-200 text-xs sm:text-sm mt-0.5">Add, edit or remove accounts</div>
          </Link>
          <Link to="/admin/feedback" className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl p-4 sm:p-5 transition">
            <div className="text-2xl mb-1">💬</div>
            <div className="font-bold text-sm sm:text-base">View Feedback</div>
            <div className="text-amber-200 text-xs sm:text-sm mt-0.5">Student feedback & suggestions</div>
          </Link>
        </div>

        {}
        <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-800 text-sm sm:text-base">Recent Submissions</h2>
            <Link to="/admin/results" className="text-indigo-600 text-xs sm:text-sm hover:underline">View all</Link>
          </div>
          {recentResults.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">No submissions yet</p>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {recentResults.map((r) => (
                <div key={r._id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0 gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-800 text-sm truncate">{r.student?.name}</p>
                    <p className="text-xs text-gray-400 truncate">{r.exam?.title} · {formatDate(r.submittedAt)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`text-sm font-bold ${r.passed ? 'text-green-600' : 'text-red-500'}`}>{r.percentage}%</span>
                    <span className={`ml-1 sm:ml-2 text-xs px-1.5 sm:px-2 py-0.5 rounded-full ${r.passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {r.passed ? 'Pass' : 'Fail'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
