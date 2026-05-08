import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/exams')
      .then((res) => setExams(res.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load exams'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 xl:px-8 py-6">
        {/* Welcome banner */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-5 sm:p-6 text-white mb-6 shadow-lg">
          <h1 className="text-xl sm:text-2xl font-bold">Welcome back, {user?.name}! 👋</h1>
          <p className="text-indigo-200 mt-1 text-sm sm:text-base truncate">
            ID: {user?.studentId} · {user?.department || 'No department'}
          </p>
          <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-4 max-w-xs sm:max-w-sm">
            {[
              { label: 'Available', value: exams.length },
              { label: 'Completed', value: exams.filter(e => e.submitted).length },
              { label: 'Pending', value: exams.filter(e => !e.submitted).length },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white/20 rounded-xl px-2 py-2 text-center">
                <div className="text-xl sm:text-2xl font-bold">{value}</div>
                <div className="text-xs text-indigo-200">{label}</div>
              </div>
            ))}
          </div>
        </div>

        <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4">Available Exams</h2>

        {loading && (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>
        )}

        {!loading && exams.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <div className="text-5xl mb-3">📋</div>
            <p className="text-lg">No exams available right now.</p>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {exams.map((exam) => (
            <div key={exam._id} className={`bg-white rounded-xl shadow-sm border-2 p-4 sm:p-5 transition hover:shadow-md ${
              exam.submitted ? 'border-green-200' : 'border-gray-100 hover:border-indigo-200'
            }`}>
              <div className="flex items-start justify-between mb-3 gap-2">
                <div className="min-w-0">
                  <h3 className="font-bold text-gray-800 text-base sm:text-lg leading-tight">{exam.title}</h3>
                  <p className="text-sm text-indigo-600 font-medium mt-0.5">{exam.subject}</p>
                </div>
                <span className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${
                  exam.submitted ? 'bg-green-100 text-green-700' : 'bg-indigo-100 text-indigo-700'
                }`}>
                  {exam.submitted ? '✓ Done' : 'Pending'}
                </span>
              </div>

              {exam.description && (
                <p className="text-sm text-gray-500 mb-3 line-clamp-2">{exam.description}</p>
              )}

              <div className="flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500 mb-4">
                <span>⏱ {Math.floor(exam.duration/60) > 0 ? `${Math.floor(exam.duration/60)}h ` : ''}{exam.duration%60 > 0 ? `${exam.duration%60}m` : ''}</span>
                <span>❓ {exam.questions?.length || 0} Qs</span>
                <span>🎯 Pass: {exam.passingScore}%</span>
              </div>

              {exam.submitted ? (
                <Link to="/results"
                  className="block text-center bg-green-50 hover:bg-green-100 text-green-700 font-semibold py-2.5 rounded-lg transition text-sm">
                  View Results
                </Link>
              ) : (
                <Link to={`/exam/${exam._id}`}
                  className="block text-center bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-lg transition text-sm">
                  Start Exam
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
