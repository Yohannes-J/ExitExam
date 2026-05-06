import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ exams: 0, results: 0, students: 0 });
  const [recentResults, setRecentResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [seedMsg, setSeedMsg] = useState('');

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

  const handleSeed = async () => {
    setSeeding(true);
    setSeedMsg('');
    try {
      const { data } = await api.post('/admin/seed');
      setSeedMsg(data.message);
    } catch (err) {
      setSeedMsg(err.response?.data?.message || 'Seed failed');
    } finally {
      setSeeding(false);
    }
  };

  const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
            <p className="text-gray-500 text-sm">Welcome, {user?.name}</p>
          </div>
          <button
            onClick={handleSeed}
            disabled={seeding}
            className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
          >
            {seeding ? 'Seeding...' : '🌱 Seed Sample Exam'}
          </button>
        </div>

        {seedMsg && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">{seedMsg}</div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Total Exams', value: stats.exams, icon: '📋', color: 'indigo', link: '/admin/exams' },
            { label: 'Submissions', value: stats.results, icon: '📊', color: 'green', link: '/admin/results' },
            { label: 'Students', value: stats.students, icon: '👥', color: 'purple', link: '/admin/students' },          ].map(({ label, value, icon, color, link }) => (
            <Link key={label} to={link} className={`bg-white rounded-xl shadow-sm border border-gray-100 hover:border-${color}-200 hover:shadow-md transition p-5`}>
              <div className="text-3xl mb-2">{icon}</div>
              <div className={`text-3xl font-bold text-${color}-600`}>{loading ? '...' : value}</div>
              <div className="text-sm text-gray-500">{label}</div>
            </Link>
          ))}
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Link to="/admin/exams/new" className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl p-5 transition">
            <div className="text-2xl mb-1">➕</div>
            <div className="font-bold">Create New Exam</div>
            <div className="text-indigo-200 text-sm">Add questions and configure settings</div>
          </Link>
          <Link to="/admin/students" className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl p-5 transition">
            <div className="text-2xl mb-1">👥</div>
            <div className="font-bold">Manage Students</div>
            <div className="text-purple-200 text-sm">Add, edit or remove student accounts</div>
          </Link>
          <Link to="/admin/results" className="bg-green-600 hover:bg-green-700 text-white rounded-xl p-5 transition">
            <div className="text-2xl mb-1">📈</div>
            <div className="font-bold">View All Results</div>
            <div className="text-green-200 text-sm">Monitor student performance</div>
          </Link>
        </div>

        {/* Recent submissions */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-800">Recent Submissions</h2>
            <Link to="/admin/results" className="text-indigo-600 text-sm hover:underline">View all</Link>
          </div>
          {recentResults.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">No submissions yet</p>
          ) : (
            <div className="space-y-3">
              {recentResults.map((r) => (
                <div key={r._id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="font-medium text-gray-800 text-sm">{r.student?.name}</p>
                    <p className="text-xs text-gray-400">{r.exam?.title} · {formatDate(r.submittedAt)}</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-sm font-bold ${r.passed ? 'text-green-600' : 'text-red-500'}`}>{r.percentage}%</span>
                    <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${r.passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
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
