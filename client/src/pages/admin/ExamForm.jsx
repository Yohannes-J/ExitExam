import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api/axios';

const emptyQuestion = () => ({ text: '', code: '', options: ['', '', '', ''], correctIndex: 0, points: 1 });

export default function ExamForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState({
    title: '', description: '', subject: '', department: 'All',
    duration: 30, passingScore: 60, isActive: true, questions: [emptyQuestion()],
  });
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [departments, setDepartments] = useState([]);

  // Common departments list + fetch from existing students
  const DEFAULT_DEPTS = ['All', 'Computer Science', 'Information Technology', 'Software Engineering', 'Electrical Engineering', 'Civil Engineering', 'Mechanical Engineering', 'Business Administration', 'Accounting', 'Law', 'Medicine', 'Nursing', 'Natural Science', 'Social Science'];

  useEffect(() => {
    api.get('/admin/students').then((res) => {
      const depts = [...new Set(res.data.map(u => u.department).filter(Boolean))];
      const merged = [...new Set([...DEFAULT_DEPTS, ...depts])];
      setDepartments(merged);
    }).catch(() => setDepartments(DEFAULT_DEPTS));
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    api.get(`/admin/exams`).then((res) => {
      const exam = res.data.find((e) => e._id === id);
      if (exam) setForm(exam);
    }).finally(() => setLoading(false));
  }, [id, isEdit]);

  const updateQuestion = (i, field, value) => {
    setForm((prev) => {
      const qs = [...prev.questions];
      qs[i] = { ...qs[i], [field]: value };
      return { ...prev, questions: qs };
    });
  };

  const updateOption = (qi, oi, value) => {
    setForm((prev) => {
      const qs = [...prev.questions];
      const opts = [...qs[qi].options];
      opts[oi] = value;
      qs[qi] = { ...qs[qi], options: opts };
      return { ...prev, questions: qs };
    });
  };

  const addQuestion = () => setForm((prev) => ({ ...prev, questions: [...prev.questions, emptyQuestion()] }));
  const removeQuestion = (i) => setForm((prev) => ({ ...prev, questions: prev.questions.filter((_, idx) => idx !== i) }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    // Validate
    for (let i = 0; i < form.questions.length; i++) {
      const q = form.questions[i];
      if (!q.text.trim()) { setError(`Question ${i + 1} text is empty`); return; }
      if (q.options.some((o) => !o.trim())) { setError(`Question ${i + 1} has empty options`); return; }
    }
    setSaving(true);
    try {
      if (isEdit) {
        await api.put(`/admin/exams/${id}`, form);
      } else {
        await api.post('/admin/exams', form);
      }
      navigate('/admin/exams');
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('/admin/exams')} className="text-gray-500 hover:text-gray-700">← Back</button>
          <h1 className="text-2xl font-bold text-gray-800">{isEdit ? 'Edit Exam' : 'Create New Exam'}</h1>
        </div>

        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic info */}
          <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
            <h2 className="font-bold text-gray-700 text-sm uppercase tracking-wide">Exam Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Final Exit Exam 2024" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Brief description..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
                <input required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Computer Science" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <select value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                  {departments.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-400 mt-1">Select "All" to show to every student</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes) *</label>
                <input type="number" min={1} required value={form.duration} onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Passing Score (%)</label>
                <input type="number" min={0} max={100} value={form.passingScore} onChange={(e) => setForm({ ...form, passingScore: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="isActive" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded" />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700">Active (visible to students)</label>
              </div>
            </div>
          </div>

          {/* Questions */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-gray-700 text-sm uppercase tracking-wide">Questions ({form.questions.length})</h2>
              <button type="button" onClick={addQuestion}
                className="bg-indigo-100 hover:bg-indigo-200 text-indigo-700 text-sm font-medium px-3 py-1.5 rounded-lg transition">
                + Add Question
              </button>
            </div>

            {form.questions.map((q, qi) => (
              <div key={qi} className="bg-white rounded-2xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="bg-indigo-100 text-indigo-700 text-sm font-bold px-3 py-1 rounded-full">Q{qi + 1}</span>
                  <div className="flex items-center gap-3">
                    <label className="text-xs text-gray-500">Points:</label>
                    <input type="number" min={1} value={q.points} onChange={(e) => updateQuestion(qi, 'points', Number(e.target.value))}
                      className="w-16 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                    {form.questions.length > 1 && (
                      <button type="button" onClick={() => removeQuestion(qi)}
                        className="text-red-500 hover:text-red-700 text-sm font-medium">Remove</button>
                    )}
                  </div>
                </div>

                <textarea
                  required
                  value={q.text}
                  onChange={(e) => updateQuestion(qi, 'text', e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-3"
                  placeholder="Enter question text..."
                />

                {/* Optional code block */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-gray-500">Code Snippet (optional)</label>
                    {q.code && (
                      <button type="button" onClick={() => updateQuestion(qi, 'code', '')}
                        className="text-xs text-red-400 hover:text-red-600">Clear code</button>
                    )}
                  </div>
                  <textarea
                    value={q.code || ''}
                    onChange={(e) => updateQuestion(qi, 'code', e.target.value)}
                    rows={5}
                    spellCheck={false}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm bg-gray-900 text-green-400 placeholder-gray-600 resize-y"
                    placeholder={"// Paste code here (optional)\nfunction example() {\n  return 'Hello';\n}"}
                  />
                </div>

                <div className="space-y-2">
                  {q.options.map((opt, oi) => (
                    <div key={oi} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={`correct-${qi}`}
                        checked={q.correctIndex === oi}
                        onChange={() => updateQuestion(qi, 'correctIndex', oi)}
                        className="w-4 h-4 text-green-600"
                      />
                      <span className="text-sm font-bold text-gray-500 w-5">{String.fromCharCode(65 + oi)}.</span>
                      <input
                        required
                        value={opt}
                        onChange={(e) => updateOption(qi, oi, e.target.value)}
                        className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                        placeholder={`Option ${String.fromCharCode(65 + oi)}`}
                      />
                      {q.correctIndex === oi && <span className="text-green-600 text-xs font-semibold">✓ Correct</span>}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-2">Select the radio button next to the correct answer.</p>
              </div>
            ))}
          </div>

          <div className="flex gap-3 pb-8">
            <button type="button" onClick={() => navigate('/admin/exams')}
              className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-xl hover:bg-gray-50 transition font-medium">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white py-3 rounded-xl transition font-bold">
              {saving ? 'Saving...' : isEdit ? 'Update Exam' : 'Create Exam'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
