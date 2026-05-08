import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';

export default function AdminResultDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [allResults, setAllResults] = useState([]); // all results for same exam
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/admin/results/${id}`)
      .then(async (res) => {
        setResult(res.data);
        // Fetch all results for this exam to compute difficulty
        const all = await api.get('/admin/results');
        const examResults = all.data.filter(r => r.exam?._id === res.data.exam?._id);
        setAllResults(examResults);
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed to load result'))
      .finally(() => setLoading(false));
  }, [id]);

  const formatTime = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    return `${m}m ${s}s`;
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        <p className="text-red-600 mb-4">{error}</p>
        <button onClick={() => navigate(-1)} className="bg-indigo-600 text-white px-6 py-2 rounded-lg">Back</button>
      </div>
    </div>
  );

  const exam = result.exam;
  const student = result.student;

  // Compute per-question miss rate across all students who took this exam
  const questionStats = exam.questions?.map((q, i) => {
    const total = allResults.length;
    const missed = allResults.filter(r => {
      const ans = r.answers?.[i];
      return !ans?.isCorrect;
    }).length;
    const missRate = total > 0 ? Math.round((missed / total) * 100) : 0;
    return { ...q, index: i, missed, total, missRate };
  }) || [];

  // Sort by miss rate descending for difficulty ranking
  const hardest = [...questionStats].sort((a, b) => b.missRate - a.missRate).slice(0, 3);

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-5xl mx-auto xl:px-8">

        {/* Back */}
        <button onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm mb-5 transition">
          ← Back to Results
        </button>

        {/* Student + score header */}
        <div className={`rounded-2xl shadow-lg mb-6 overflow-hidden`}>
          <div className={`h-1.5 ${result.passed ? 'bg-gradient-to-r from-emerald-400 to-green-500' : 'bg-gradient-to-r from-red-400 to-rose-500'}`} />
          <div className={`p-5 sm:p-6 ${result.passed ? 'bg-gradient-to-br from-emerald-600 to-green-700' : 'bg-gradient-to-br from-red-600 to-rose-700'} text-white`}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-xl font-bold shrink-0">
                  {student?.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h1 className="text-xl font-bold">{student?.name}</h1>
                  <p className="text-white/70 text-sm">{student?.studentId} · {student?.department}</p>
                  <p className="text-white/60 text-xs mt-0.5">{exam?.title}</p>
                </div>
              </div>
              <div className="text-center sm:text-right">
                <div className="text-5xl font-black">{result.percentage}%</div>
                <div className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full mt-1 ${result.passed ? 'bg-white/20' : 'bg-white/20'}`}>
                  <span className={`w-2 h-2 rounded-full ${result.passed ? 'bg-green-300' : 'bg-red-300'}`}></span>
                  {result.passed ? 'PASSED' : 'FAILED'}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-3 mt-5 pt-4 border-t border-white/20">
              {[
                { label: 'Score', value: `${result.score}/${result.totalPoints}` },
                { label: 'Correct', value: result.answers?.filter(a => a.isCorrect).length || 0 },
                { label: 'Wrong', value: (exam.questions?.length || 0) - (result.answers?.filter(a => a.isCorrect).length || 0) },
                { label: 'Time', value: formatTime(result.timeTaken) },
              ].map(({ label, value }) => (
                <div key={label} className="text-center">
                  <div className="text-lg sm:text-xl font-bold">{value}</div>
                  <div className="text-white/60 text-xs">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Hardest questions for this exam */}
        {allResults.length > 1 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg">📊</span>
              <h2 className="font-bold text-gray-800">Hardest Questions for This Exam</h2>
              <span className="text-xs text-gray-400 ml-auto">{allResults.length} students submitted</span>
            </div>
            <div className="space-y-3">
              {hardest.map((q, rank) => (
                <div key={q.index} className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    rank === 0 ? 'bg-red-100 text-red-600' : rank === 1 ? 'bg-orange-100 text-orange-600' : 'bg-yellow-100 text-yellow-600'
                  }`}>{rank + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 truncate">Q{q.index + 1}: {q.text}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-red-400 rounded-full transition-all" style={{ width: `${q.missRate}%` }} />
                      </div>
                      <span className="text-xs font-semibold text-red-600 shrink-0">{q.missRate}% missed</span>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 shrink-0">{q.missed}/{q.total}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Detailed answer review */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-gray-800">Detailed Answer Review</h2>
            <span className="text-xs text-gray-400">{exam.questions?.length} questions</span>
          </div>

          <div className="divide-y divide-gray-50">
            {exam.questions?.map((q, i) => {
              const ans = result.answers?.[i];
              const isCorrect = ans?.isCorrect;
              const selected = ans?.selectedIndex;
              const stat = questionStats[i];

              return (
                <div key={i} className={`p-5 ${isCorrect ? '' : 'bg-red-50/30'}`}>
                  {/* Question header */}
                  <div className="flex items-start gap-3 mb-3">
                    <span className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${isCorrect ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                      {isCorrect ? '✓' : '✗'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-xs font-semibold text-gray-400">Q{i + 1}</span>
                        {q.type && q.type !== 'mcq' && (
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            q.type === 'truefalse' ? 'bg-blue-100 text-blue-600'
                            : q.type === 'short' ? 'bg-amber-100 text-amber-600'
                            : 'bg-purple-100 text-purple-600'
                          }`}>
                            {q.type === 'truefalse' ? 'True/False' : q.type === 'short' ? 'Short Answer' : 'Essay'}
                          </span>
                        )}
                        {/* Miss rate badge */}
                        {allResults.length > 1 && stat && (
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ml-auto ${
                            stat.missRate >= 70 ? 'bg-red-100 text-red-600'
                            : stat.missRate >= 40 ? 'bg-orange-100 text-orange-600'
                            : 'bg-green-100 text-green-600'
                          }`}>
                            {stat.missRate}% of students missed this
                          </span>
                        )}
                      </div>
                      <p className="text-gray-800 font-medium text-sm">{q.text}</p>
                    </div>
                  </div>

                  {q.code && (
                    <pre className="bg-gray-900 text-green-400 rounded-lg p-3 mb-3 text-xs font-mono overflow-x-auto whitespace-pre ml-10">
                      {q.code}
                    </pre>
                  )}

                  {/* MCQ / True-False options */}
                  {(q.type === 'mcq' || !q.type || q.type === 'truefalse') && (
                    <div className="ml-10 space-y-1.5">
                      {(q.type === 'truefalse' ? ['True', 'False'] : q.options).map((opt, j) => {
                        const isCorrectOpt = j === q.correctIndex;
                        const isSelectedOpt = j === selected;
                        const isWrong = isSelectedOpt && !isCorrect;
                        return (
                          <div key={j} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                            isCorrectOpt && isSelectedOpt ? 'bg-emerald-100 text-emerald-800 font-semibold'
                            : isCorrectOpt ? 'bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200'
                            : isWrong ? 'bg-red-100 text-red-800 font-semibold'
                            : 'text-gray-500'
                          }`}>
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                              isCorrectOpt && isSelectedOpt ? 'bg-emerald-500 text-white'
                              : isCorrectOpt ? 'bg-emerald-400 text-white'
                              : isWrong ? 'bg-red-500 text-white'
                              : 'bg-gray-200 text-gray-500'
                            }`}>
                              {q.type === 'truefalse' ? (j === 0 ? 'T' : 'F') : String.fromCharCode(65 + j)}
                            </span>
                            <span className="flex-1">{opt}</span>
                            {isCorrectOpt && !isWrong && <span className="text-emerald-600 text-xs font-semibold">✓ Correct</span>}
                            {isWrong && <span className="text-red-500 text-xs font-semibold">✗ Student's answer</span>}
                          </div>
                        );
                      })}
                      {(selected === -1 || selected === undefined) && (
                        <p className="text-xs text-gray-400 italic px-3">— Not answered</p>
                      )}
                    </div>
                  )}

                  {/* Short / Essay */}
                  {(q.type === 'short' || q.type === 'essay') && (
                    <div className="ml-10 space-y-2">
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                        <p className="text-xs text-gray-400 mb-1 font-semibold uppercase tracking-wide">Student's Answer</p>
                        <p className="text-sm text-gray-800 whitespace-pre-wrap">
                          {ans?.textAnswer || <span className="italic text-gray-400">Not answered</span>}
                        </p>
                      </div>
                      {q.correctText && (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                          <p className="text-xs text-emerald-600 mb-1 font-semibold uppercase tracking-wide">
                            {q.type === 'essay' ? 'Grading Notes / Rubric' : 'Expected Answer'}
                          </p>
                          <p className="text-sm text-emerald-800">{q.correctText}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <button onClick={() => navigate(-1)}
          className="w-full border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold py-3 rounded-xl transition text-sm">
          ← Back to Results
        </button>
      </div>
    </div>
  );
}
