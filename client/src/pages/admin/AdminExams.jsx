import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';

export default function AdminExams() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    api.get('/admin/exams')
      .then((res) => setExams(res.data))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this exam? This cannot be undone.')) return;
    setDeleting(id);
    try {
      await api.delete(`/admin/exams/${id}`);
      setExams((prev) => prev.filter((e) => e._id !== id));
    } finally {
      setDeleting(null);
    }
  };

  const toggleActive = async (exam) => {
    const updated = await api.put(`/admin/exams/${exam._id}`, { isActive: !exam.isActive });
    setExams((prev) => prev.map((e) => e._id === exam._id ? updated.data : e));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Manage Exams</h1>
          <Link to="/admin/exams/new" className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition">
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

        <div className="space-y-4">
          {exams.map((exam) => (
            <div key={exam._id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-gray-800">{exam.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${exam.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {exam.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-sm text-indigo-600">{exam.subject} · {exam.department}</p>
                  <div className="flex gap-4 text-xs text-gray-400 mt-2">
                    <span>⏱ {exam.duration} min</span>
                    <span>❓ {exam.questions?.length} questions</span>
                    <span>🎯 Pass: {exam.passingScore}%</span>
                    <span>📅 {new Date(exam.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => toggleActive(exam)}
                    className={`text-xs px-3 py-1.5 rounded-lg font-medium transition ${exam.isActive ? 'bg-yellow-100 hover:bg-yellow-200 text-yellow-700' : 'bg-green-100 hover:bg-green-200 text-green-700'}`}
                  >
                    {exam.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <Link
                    to={`/admin/exams/${exam._id}/edit`}
                    className="text-xs px-3 py-1.5 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-lg font-medium transition"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(exam._id)}
                    disabled={deleting === exam._id}
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
