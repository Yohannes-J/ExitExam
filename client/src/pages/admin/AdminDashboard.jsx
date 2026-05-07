import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ exams: 0, results: 0, students: 0 });
  const [recentResults, setRecentResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/admin/exams'),
      api.get('/admin/results'),
      api.get('/admin/students'),
    ]).then(([exams, results, students]) => {
      setStats({ exams: exams.data.length, results: results.data.length, students: students.data.length });
      setRecentResults(results.data.slice(0, 5));
    }).finally(() => setLoading(false));
  }, []);

  const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Admin Dashboard</h1>
            <p className="text-gray-500 text-sm">Welcome, {user?.name}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6">
          {[
            { label: 'Exams', value: stats.exams, icon: '📋', color: 'indigo', link: '/admin/exams' },
            { label: 'Submissions', value: stats.results, icon: '📊', color: 'green', link: '/admin/results' },
            { label: 'Students', value: stats.students, icon: '👥', color: 'purple', link: '/admin/students' },
          ].map(({ label, value, icon, color, link }) => (
            <Link key={label} to={link}
              className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition p-3 sm:p-5">
              <div className="text-2xl sm:text-3xl mb-1 sm:mb-2">{icon}</div>
              <div className={`text-2xl sm:text-3xl font-bold text-${color}-600`}>{loading ? '...' : value}</div>
              <div className="text-xs sm:text-sm text-gray-500">{label}</div>
            </Link>
          ))}
        </div>

        {/* Quick actions */}
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
          <Link to="/admin/results" className="bg-green-600 hover:bg-green-700 text-white rounded-xl p-4 sm:p-5 transition">
            <div className="text-2xl mb-1">📈</div>
            <div className="font-bold text-sm sm:text-base">View All Results</div>
            <div className="text-green-200 text-xs sm:text-sm mt-0.5">Monitor student performance</div>
          </Link>
        </div>

        {/* Recent submissions */}
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
