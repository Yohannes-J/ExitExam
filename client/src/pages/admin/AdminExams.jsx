import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

export default function AdminExams() {
  const { user } = useAuth();
  const currentUser = user ?? (() => {
    try { return JSON.parse(localStorage.getItem('user')); }
    catch { return null; }
  })();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    api.get('/admin/exams').then((res) => setExams(res.data)).finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this exam? This cannot be undone.')) return;
    setDeleting(id);
    try {
      await api.delete(`/admin/exams/${id}`);
      setExams((prev) => prev.filter((e) => e._id !== id));
    } finally { setDeleting(null); }
  };

  const toggleActive = async (exam) => {
    const updated = await api.put(`/admin/exams/${exam._id}`, { isActive: !exam.isActive });
    setExams((prev) => prev.map((e) => e._id === exam._id ? updated.data : e));
  };

  const canManageExam = (exam) => {
    if (currentUser?.role === 'admin') return true;
    return currentUser?.role === 'teacher' && (exam.createdBy?._id === currentUser?.id || exam.createdBy === currentUser?.id);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-7xl mx-auto px-4 xl:px-8">
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Manage Exams</h1>
          <Link to="/admin/exams/new"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 sm:px-4 py-2 rounded-lg font-medium transition text-sm">
            + New Exam
          </Link>
        </div>

        {loading && (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
          </div>
        )}

        {!loading && exams.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <div className="text-5xl mb-3">📋</div>
            <p>No exams yet. Create one!</p>
          </div>
        )}

        <div className="space-y-3 sm:space-y-4">
          {exams.map((exam) => (
            <div key={exam._id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-bold text-gray-800 text-sm sm:text-base">{exam.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${exam.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {exam.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-sm text-indigo-600">{exam.subject} · {exam.department}</p>
                  <p className="text-xs text-gray-500 mt-1">Created by {exam.createdBy?.name || 'Unknown teacher'}</p>
                  <div className="flex flex-wrap gap-2 sm:gap-4 text-xs text-gray-400 mt-2">
                    <span>⏱ {exam.duration >= 60 ? `${Math.floor(exam.duration/60)}h${exam.duration%60>0?' '+exam.duration%60+'m':''}` : `${exam.duration}m`}</span>
                    <span>❓ {exam.questions?.length} Qs</span>
                    <span>🎯 Pass: {exam.passingScore}%</span>
                    <span>📅 {new Date(exam.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => canManageExam(exam) && toggleActive(exam)}
                    disabled={!canManageExam(exam)}
                    className={`text-xs px-3 py-1.5 rounded-lg font-medium transition ${
                      canManageExam(exam)
                        ? exam.isActive
                          ? 'bg-yellow-100 hover:bg-yellow-200 text-yellow-700'
                          : 'bg-green-100 hover:bg-green-200 text-green-700'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {exam.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <Link
                    to={canManageExam(exam) ? `/admin/exams/${exam._id}/edit` : '#'}
                    onClick={(e) => {
                      if (!canManageExam(exam)) e.preventDefault();
                    }}
                    aria-disabled={!canManageExam(exam)}
                    className={`text-xs px-3 py-1.5 rounded-lg font-medium transition ${
                      canManageExam(exam)
                        ? 'bg-indigo-100 hover:bg-indigo-200 text-indigo-700'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => canManageExam(exam) && handleDelete(exam._id)}
                    disabled={!canManageExam(exam) || deleting === exam._id}
                    className="text-xs px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-medium transition disabled:opacity-50"
                  >
                    {deleting === exam._id ? '...' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
