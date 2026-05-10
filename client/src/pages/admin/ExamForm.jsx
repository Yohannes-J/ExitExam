import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api/axios';
import SchoolDeptSelect from '../../components/SchoolDeptSelect';
import { useAuth } from '../../context/AuthContext';
import QuestionUploader from '../../components/QuestionUploader';

const emptyQuestion = () => ({ text: '', code: '', type: 'mcq', options: ['', '', '', ''], correctIndex: 0, correctText: '', points: 1 });

export default function ExamForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEdit = Boolean(id);
  const isTeacher = user?.role === 'teacher';

  const [form, setForm] = useState({
    title: '', description: '', subject: '', school: '', department: isTeacher ? (user?.department || '') : 'All',
    duration: 30, passingScore: 60, isActive: true, shuffleQuestions: false, questions: [emptyQuestion()],
  });
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [newQType, setNewQType] = useState('mcq');

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

  const addQuestion = () => setForm((prev) => ({
    ...prev,
    questions: [...prev.questions, { ...emptyQuestion(), type: newQType }],
  }));

  const handleImportQuestions = (imported) => {
    setForm(prev => ({ ...prev, questions: [...prev.questions, ...imported] }));
  };
  const removeQuestion = (i) => setForm((prev) => ({ ...prev, questions: prev.questions.filter((_, idx) => idx !== i) }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    // Validate
    for (let i = 0; i < form.questions.length; i++) {
      const q = form.questions[i];
      if (!q.text.trim()) { setError(`Question ${i + 1} text is empty`); return; }
      if (q.type === 'mcq' && q.options.some((o) => !o.trim())) {
        setError(`Question ${i + 1} has empty options`); return;
      }
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
      <div className="max-w-4xl mx-auto px-4 xl:px-8">
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
                  placeholder="exit exam" />
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
                  placeholder="Software Engineering" />
              </div>

              {/* Department — teacher picks from their departments, admin picks school+dept */}
              {isTeacher ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
                  <select required value={form.department}
                    onChange={e => setForm(prev => ({ ...prev, department: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white">
                    <option value="">— Select your department —</option>
                    {(user?.departments?.length > 0 ? user.departments : user?.department ? [user.department] : []).map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-400 mt-1">Only students in this department will see the exam</p>
                </div>
              ) : (
                <div className="col-span-2">
                  <SchoolDeptSelect
                    school={form.school || ''}
                    onSchoolChange={v => setForm(prev => ({ ...prev, school: v, department: '' }))}
                    department={form.department === 'All' ? '' : form.department}
                    onDeptChange={v => setForm(prev => ({ ...prev, department: v || 'All' }))}
                  />
                  <div className="flex items-center gap-2 mt-2">
                    <input type="checkbox" id="allDepts"
                      checked={form.department === 'All'}
                      onChange={e => setForm(prev => ({ ...prev, department: e.target.checked ? 'All' : '', school: e.target.checked ? '' : prev.school }))}
                      className="w-4 h-4 text-indigo-600 rounded" />
                    <label htmlFor="allDepts" className="text-sm text-gray-600">
                      Show to <strong>all departments</strong> (no restriction)
                    </label>
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration *</label>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <input
                      type="number" min={0} max={23}
                      value={Math.floor(form.duration / 60)}
                      onChange={(e) => {
                        const h = Math.max(0, Number(e.target.value));
                        const m = form.duration % 60;
                        setForm({ ...form, duration: h * 60 + m });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-center"
                      placeholder="0"
                    />
                    <p className="text-xs text-gray-400 text-center mt-0.5">Hours</p>
                  </div>
                  <span className="text-gray-400 font-bold text-lg pb-4">:</span>
                  <div className="flex-1">
                    <input
                      type="number" min={0} max={59}
                      value={form.duration % 60}
                      onChange={(e) => {
                        const m = Math.min(59, Math.max(0, Number(e.target.value)));
                        const h = Math.floor(form.duration / 60);
                        setForm({ ...form, duration: h * 60 + m });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-center"
                      placeholder="0"
                    />
                    <p className="text-xs text-gray-400 text-center mt-0.5">Minutes</p>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Total: {form.duration >= 60
                    ? `${Math.floor(form.duration / 60)}h ${form.duration % 60 > 0 ? `${form.duration % 60}m` : ''}`
                    : `${form.duration}m`}
                  {form.duration === 0 && <span className="text-red-500 ml-1">Must be at least 1 minute</span>}
                </p>
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
              <div className="flex items-center gap-2">
                <input type="checkbox" id="shuffleQuestions" checked={form.shuffleQuestions || false} onChange={(e) => setForm({ ...form, shuffleQuestions: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded" />
                <div>
                  <label htmlFor="shuffleQuestions" className="text-sm font-medium text-gray-700">Shuffle question order</label>
                  <p className="text-xs text-gray-400">Each student gets a different question order</p>
                </div>
              </div>
            </div>
          </div>

          {/* Questions */}
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-bold text-gray-700 text-sm uppercase tracking-wide">Questions ({form.questions.length})</h2>
              <div className="flex items-center gap-2 flex-wrap justify-end">
                <QuestionUploader onImport={handleImportQuestions} />
                <select
                  value={newQType}
                  onChange={(e) => setNewQType(e.target.value)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700"
                >
                  <option value="mcq">☑ Multiple Choice</option>
                  <option value="truefalse">◎ True / False</option>
                  <option value="short">✏️ Short Answer</option>
                  <option value="essay">📝 Essay</option>
                </select>
                <button type="button" onClick={addQuestion}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition whitespace-nowrap">
                  + Add Question
                </button>
              </div>
            </div>

            {form.questions.map((q, qi) => (
              <div key={qi} className="bg-white rounded-2xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="bg-indigo-100 text-indigo-700 text-sm font-bold px-3 py-1 rounded-full">Q{qi + 1}</span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      q.type === 'truefalse' ? 'bg-blue-100 text-blue-700'
                      : q.type === 'short' ? 'bg-amber-100 text-amber-700'
                      : q.type === 'essay' ? 'bg-purple-100 text-purple-700'
                      : 'bg-gray-100 text-gray-600'
                    }`}>
                      {q.type === 'truefalse' ? '◎ True/False'
                        : q.type === 'short' ? '✏️ Short Answer'
                        : q.type === 'essay' ? '📝 Essay'
                        : '☑ MCQ'}
                    </span>
                  </div>
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

                {/* Optional code block — collapsed by default */}
                <div className="mb-4">
                  <button
                    type="button"
                    onClick={() => updateQuestion(qi, '_showCode', !q._showCode)}
                    className={`flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-lg transition ${
                      q._showCode || q.code
                        ? 'bg-gray-800 text-green-400'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                    }`}
                  >
                    <span>{q._showCode || q.code ? '💻' : '+ 💻'}</span>
                    {q._showCode || q.code ? 'Hide Code Snippet' : 'Add Code Snippet'}
                  </button>

                  {(q._showCode || q.code) && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-400">Code editor</span>
                        {q.code && (
                          <button type="button" onClick={() => { updateQuestion(qi, 'code', ''); updateQuestion(qi, '_showCode', false); }}
                            className="text-xs text-red-400 hover:text-red-600">Clear & hide</button>
                        )}
                      </div>
                      <textarea
                        value={q.code || ''}
                        onChange={(e) => updateQuestion(qi, 'code', e.target.value)}
                        rows={5}
                        spellCheck={false}
                        className="w-full px-3 py-2 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-mono text-sm bg-gray-900 text-green-400 placeholder-gray-600 resize-y"
                        placeholder={"// Paste your code here\nfunction example() {\n  return 'Hello';\n}"}
                      />
                    </div>
                  )}
                </div>

                {/* Question type selector — removed, use dropdown above */}

                {/* MCQ options */}
                {q.type === 'mcq' && (
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Options <span className="text-gray-400 font-normal normal-case">(select correct answer)</span></label>
                    {q.options.map((opt, oi) => (
                      <div key={oi} className="flex items-center gap-2">
                        <input type="radio" name={`correct-${qi}`} checked={q.correctIndex === oi}
                          onChange={() => updateQuestion(qi, 'correctIndex', oi)}
                          className="w-4 h-4 text-green-600 shrink-0" />
                        <span className="text-sm font-bold text-gray-400 w-5">{String.fromCharCode(65 + oi)}.</span>
                        <input required value={opt} onChange={(e) => updateOption(qi, oi, e.target.value)}
                          className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                          placeholder={`Option ${String.fromCharCode(65 + oi)}`} />
                        {q.correctIndex === oi && <span className="text-green-600 text-xs font-semibold shrink-0">✓</span>}
                      </div>
                    ))}
                    <p className="text-xs text-gray-400">Select the radio button next to the correct answer.</p>
                  </div>
                )}

                {/* True / False */}
                {q.type === 'truefalse' && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Correct Answer</label>
                    <div className="flex gap-3">
                      {['True', 'False'].map((val, idx) => (
                        <button key={val} type="button"
                          onClick={() => updateQuestion(qi, 'correctIndex', idx)}
                          className={`flex-1 py-2.5 rounded-xl border-2 font-semibold text-sm transition ${
                            q.correctIndex === idx
                              ? idx === 0 ? 'border-green-500 bg-green-50 text-green-700' : 'border-red-500 bg-red-50 text-red-700'
                              : 'border-gray-200 text-gray-500 hover:border-gray-300'
                          }`}>
                          {idx === 0 ? '✓ True' : '✗ False'}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Short Answer */}
                {q.type === 'short' && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                      Expected Answer <span className="text-gray-400 font-normal normal-case">(used for reference — graded manually)</span>
                    </label>
                    <input value={q.correctText || ''} onChange={(e) => updateQuestion(qi, 'correctText', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm"
                      placeholder="Expected answer (optional reference)" />
                    <p className="text-xs text-gray-400 mt-1">Short answer questions are graded manually by the teacher.</p>
                  </div>
                )}

                {/* Essay */}
                {q.type === 'essay' && (
                  <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-purple-700 text-sm font-semibold mb-1">
                      <span>📝</span> Essay Question
                    </div>
                    <p className="text-xs text-purple-600">Students will write a long-form answer. Graded manually by the teacher.</p>
                    <div className="mt-3">
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Grading Notes / Rubric (optional)</label>
                      <textarea value={q.correctText || ''} onChange={(e) => updateQuestion(qi, 'correctText', e.target.value)}
                        rows={2} className="w-full px-3 py-2 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm bg-white"
                        placeholder="e.g. Mention 3 key points: X, Y, Z..." />
                    </div>
                  </div>
                )}
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
