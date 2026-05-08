import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';

export default function ResultDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/results/${id}`)
      .then((res) => setResult(res.data))
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
        <p className="text-red-600 mb-4 text-sm">{error}</p>
        <button onClick={() => navigate('/results')} className="bg-indigo-600 text-white px-6 py-2 rounded-lg">Back</button>
      </div>
    </div>
  );

  const exam = result.exam;
  const correctCount = result.answers?.filter(a => a.isCorrect).length || 0;
  const wrongCount = (exam.questions?.length || 0) - correctCount;

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-4xl mx-auto xl:px-8">

        {/* Result hero card */}
        <div className={`rounded-2xl shadow-lg mb-6 overflow-hidden`}>
          {/* Top accent bar */}
          <div className={`h-1.5 w-full ${result.passed ? 'bg-gradient-to-r from-emerald-400 to-green-500' : 'bg-gradient-to-r from-red-400 to-rose-500'}`} />

          <div className={`p-6 sm:p-8 ${result.passed ? 'bg-gradient-to-br from-emerald-600 to-green-700' : 'bg-gradient-to-br from-red-600 to-rose-700'} text-white`}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className={`inline-flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-full mb-3 ${result.passed ? 'bg-white/20 text-white' : 'bg-white/20 text-white'}`}>
                  <span className={`w-2 h-2 rounded-full ${result.passed ? 'bg-green-300' : 'bg-red-300'}`}></span>
                  {result.passed ? 'PASSED' : 'FAILED'}
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold mb-1">
                  {result.passed ? 'Well Done!' : 'Keep Trying'}
                </h1>
                <p className="text-white/70 text-sm">{exam.title} · {exam.subject}</p>
              </div>
              <div className="text-center sm:text-right">
                <div className="text-5xl sm:text-6xl font-black tabular-nums">{result.percentage}%</div>
                <div className="text-white/60 text-xs mt-1">Pass mark: {exam.passingScore}%</div>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3 mt-6 pt-5 border-t border-white/20">
              {[
                { label: 'Score', value: `${result.score}/${result.totalPoints}` },
                { label: 'Correct', value: correctCount },
                { label: 'Time Taken', value: formatTime(result.timeTaken) },
              ].map(({ label, value }) => (
                <div key={label} className="text-center">
                  <div className="text-xl sm:text-2xl font-bold">{value}</div>
                  <div className="text-white/60 text-xs mt-0.5">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Summary bar */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Total Questions', value: exam.questions?.length || 0, color: 'bg-indigo-50 text-indigo-700 border-indigo-100' },
            { label: 'Correct', value: correctCount, color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
            { label: 'Wrong / Skipped', value: wrongCount, color: 'bg-red-50 text-red-700 border-red-100' },
          ].map(({ label, value, color }) => (
            <div key={label} className={`rounded-xl border p-3 sm:p-4 text-center ${color}`}>
              <div className="text-2xl sm:text-3xl font-bold">{value}</div>
              <div className="text-xs mt-0.5 opacity-80">{label}</div>
            </div>
          ))}
        </div>

        {/* Answer Review — modern table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-gray-800 text-base sm:text-lg">Answer Review</h2>
            <span className="text-xs text-gray-400">{exam.questions?.length} questions</span>
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide w-12">#</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Question & Choices</th>
                  <th className="text-center px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide w-24">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {exam.questions?.map((q, i) => {
                  const ans = result.answers[i];
                  const isCorrect = ans?.isCorrect;
                  const selected = ans?.selectedIndex;

                  return (
                    <tr key={i} className={`transition ${isCorrect ? 'hover:bg-gray-50/80' : 'bg-red-50/20 hover:bg-red-50/40'}`}>
                      <td className="px-5 py-4 text-gray-400 font-mono text-xs align-top">{i + 1}</td>
                      <td className="px-5 py-4">
                        {/* Question text */}
                        <p className="text-gray-800 font-medium text-sm leading-snug mb-3">{q.text}</p>
                        {q.code && (
                          <pre className="mb-3 bg-gray-900 text-green-400 rounded-lg p-2.5 text-xs font-mono overflow-x-auto whitespace-pre">
                            {q.code}
                          </pre>
                        )}
                    {/* All options for MCQ/TrueFalse */}
                        {(q.type === 'mcq' || !q.type || q.type === 'truefalse') && (
                          <div className="space-y-1.5">
                            {(q.type === 'truefalse' ? ['True', 'False'] : q.options).map((opt, j) => {
                              const isCorrectOpt = j === q.correctIndex;
                              const isSelected = j === selected;
                              const isWrongSelected = isSelected && !isCorrect;
                              let rowClass = 'text-gray-500 bg-transparent';
                              if (isCorrectOpt && isSelected) rowClass = 'bg-emerald-100 text-emerald-800 font-semibold';
                              else if (isCorrectOpt) rowClass = 'bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200';
                              else if (isWrongSelected) rowClass = 'bg-red-100 text-red-800 font-semibold';
                              return (
                                <div key={j} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs ${rowClass}`}>
                                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                                    isCorrectOpt && isSelected ? 'bg-emerald-500 text-white'
                                    : isCorrectOpt ? 'bg-emerald-400 text-white'
                                    : isWrongSelected ? 'bg-red-500 text-white'
                                    : 'bg-gray-200 text-gray-500'
                                  }`}>
                                    {q.type === 'truefalse' ? (j === 0 ? 'T' : 'F') : String.fromCharCode(65 + j)}
                                  </span>
                                  <span className="flex-1">{opt}</span>
                                  {isCorrectOpt && !isWrongSelected && <span className="ml-auto text-emerald-600 font-semibold text-xs shrink-0">✓ Correct</span>}
                                  {isWrongSelected && <span className="ml-auto text-red-500 font-semibold text-xs shrink-0">✗ Your answer</span>}
                                </div>
                              );
                            })}
                            {(selected === -1 || selected === undefined) && (
                              <p className="text-xs text-gray-400 italic px-3">— Not answered</p>
                            )}
                          </div>
                        )}

                        {/* Short / Essay answer */}
                        {(q.type === 'short' || q.type === 'essay') && (
                          <div className="space-y-2">
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                              <p className="text-xs text-gray-400 mb-1 font-semibold uppercase tracking-wide">Student's Answer</p>
                              <p className="text-sm text-gray-800 whitespace-pre-wrap">
                                {ans?.textAnswer || <span className="italic text-gray-400">Not answered</span>}
                              </p>
                            </div>
                            {q.correctText && (
                              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                                <p className="text-xs text-emerald-600 mb-1 font-semibold uppercase tracking-wide">
                                  {q.type === 'essay' ? 'Grading Notes' : 'Expected Answer'}
                                </p>
                                <p className="text-sm text-emerald-800">{q.correctText}</p>
                              </div>
                            )}
                            <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                              ⏳ This question is graded manually by the teacher.
                            </p>
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4 text-center align-top pt-5">
                        {isCorrect ? (
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 font-bold text-base">✓</span>
                        ) : (
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-100 text-red-600 font-bold text-base">✗</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="sm:hidden divide-y divide-gray-50">
            {exam.questions?.map((q, i) => {
              const ans = result.answers[i];
              const isCorrect = ans?.isCorrect;
              const selected = ans?.selectedIndex;
              return (
                <div key={i} className={`p-4 ${isCorrect ? '' : 'bg-red-50/40'}`}>
                  <div className="flex items-start gap-3 mb-3">
                    <span className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isCorrect ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                      {isCorrect ? '✓' : '✗'}
                    </span>
                    <p className="text-gray-800 font-medium text-sm">{q.text}</p>
                  </div>
                  {q.code && (
                    <pre className="bg-gray-900 text-green-400 rounded-lg p-2.5 mb-3 text-xs font-mono overflow-x-auto whitespace-pre ml-9">
                      {q.code}
                    </pre>
                  )}
                  <div className="ml-9 space-y-1.5">
                    {(q.type === 'mcq' || !q.type || q.type === 'truefalse') && (
                      (q.type === 'truefalse' ? ['True', 'False'] : q.options).map((opt, j) => (
                        <div key={j} className={`text-xs px-3 py-1.5 rounded-lg flex items-center gap-2 ${
                          j === q.correctIndex ? 'bg-emerald-100 text-emerald-800 font-semibold'
                          : j === selected && !isCorrect ? 'bg-red-100 text-red-800'
                          : 'text-gray-500'
                        }`}>
                          <span className="font-bold w-4 shrink-0">{q.type === 'truefalse' ? (j === 0 ? 'T' : 'F') : String.fromCharCode(65 + j)}.</span>
                          <span>{opt}</span>
                          {j === q.correctIndex && !isCorrect && <span className="ml-auto text-emerald-600 text-xs">✓</span>}
                          {j === selected && !isCorrect && <span className="ml-auto text-red-500 text-xs">✗</span>}
                        </div>
                      ))
                    )}
                    {(q.type === 'short' || q.type === 'essay') && (
                      <div className="space-y-2">
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-2.5">
                          <p className="text-xs text-gray-400 mb-1">Student's Answer</p>
                          <p className="text-xs text-gray-800 whitespace-pre-wrap">{ans?.textAnswer || <span className="italic text-gray-400">Not answered</span>}</p>
                        </div>
                        <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5">⏳ Graded manually</p>
                      </div>
                    )}
                    {(q.type === 'mcq' || !q.type) && (selected === -1 || selected === undefined) && (
                      <p className="text-xs text-gray-400 italic px-3">Not answered</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button onClick={() => navigate('/dashboard')}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold py-3 rounded-xl transition text-sm shadow-sm shadow-indigo-200">
            ← Back to Dashboard
          </button>
          <button onClick={() => navigate('/results')}
            className="flex-1 border border-gray-200 hover:bg-gray-50 active:bg-gray-100 text-gray-700 font-semibold py-3 rounded-xl transition text-sm">
            View All Results
          </button>
        </div>
      </div>
    </div>
  );
}
