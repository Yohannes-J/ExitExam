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

  const formatTime = (secs) => `${Math.floor(secs / 60)}m ${secs % 60}s`;

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

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Result card */}
        <div className={`rounded-2xl shadow-xl p-6 sm:p-8 mb-6 text-white text-center ${
          result.passed ? 'bg-gradient-to-br from-green-500 to-emerald-600' : 'bg-gradient-to-br from-red-500 to-rose-600'
        }`}>
          <div className="text-5xl sm:text-6xl mb-3">{result.passed ? '🏆' : '😔'}</div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-1">
            {result.passed ? 'Congratulations!' : 'Better Luck Next Time'}
          </h1>
          <p className="text-white/80 mb-5 text-sm sm:text-base">{exam.title}</p>

          <div className="grid grid-cols-3 gap-2 sm:gap-4 max-w-xs sm:max-w-sm mx-auto">
            <div className="bg-white/20 rounded-xl p-2 sm:p-3">
              <div className="text-2xl sm:text-3xl font-bold">{result.percentage}%</div>
              <div className="text-xs text-white/70">Score</div>
            </div>
            <div className="bg-white/20 rounded-xl p-2 sm:p-3">
              <div className="text-xl sm:text-3xl font-bold">{result.score}/{result.totalPoints}</div>
              <div className="text-xs text-white/70">Points</div>
            </div>
            <div className="bg-white/20 rounded-xl p-2 sm:p-3">
              <div className="text-lg sm:text-2xl font-bold">{formatTime(result.timeTaken)}</div>
              <div className="text-xs text-white/70">Time</div>
            </div>
          </div>
          <div className="mt-3 text-xs sm:text-sm text-white/80">
            Passing score: {exam.passingScore}% · {result.passed ? '✓ Passed' : '✗ Failed'}
          </div>
        </div>

        {/* Answer review */}
        <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6 mb-6">
          <h2 className="text-base sm:text-lg font-bold text-gray-800 mb-4">Answer Review</h2>
          <div className="space-y-3 sm:space-y-4">
            {exam.questions?.map((q, i) => {
              const ans = result.answers[i];
              const isCorrect = ans?.isCorrect;
              const selected = ans?.selectedIndex;
              return (
                <div key={i} className={`rounded-xl border-2 p-3 sm:p-4 ${isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                  <div className="flex items-start gap-2 mb-3">
                    <span className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isCorrect ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                      {isCorrect ? '✓' : '✗'}
                    </span>
                    <p className="font-medium text-gray-800 text-sm sm:text-base">{q.text}</p>
                  </div>
                  {q.code && (
                    <pre className="bg-gray-900 text-green-400 rounded-lg p-3 mb-3 text-xs font-mono overflow-x-auto whitespace-pre ml-8">
                      {q.code}
                    </pre>
                  )}
                  <div className="space-y-1.5 ml-8">
                    {q.options.map((opt, j) => (
                      <div key={j} className={`text-xs sm:text-sm px-2 sm:px-3 py-1.5 rounded-lg ${
                        j === q.correctIndex ? 'bg-green-200 text-green-800 font-semibold'
                        : j === selected && !isCorrect ? 'bg-red-200 text-red-800'
                        : 'text-gray-600'
                      }`}>
                        <span className="font-bold mr-1 sm:mr-2">{String.fromCharCode(65 + j)}.</span>
                        {opt}
                        {j === q.correctIndex && <span className="ml-1 sm:ml-2 text-green-700 text-xs">← Correct</span>}
                        {j === selected && !isCorrect && <span className="ml-1 sm:ml-2 text-red-700 text-xs">← Your answer</span>}
                      </div>
                    ))}
                    {selected === -1 && <p className="text-xs text-gray-400 italic">Not answered</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button onClick={() => navigate('/dashboard')}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition text-sm sm:text-base">
            Back to Dashboard
          </button>
          <button onClick={() => navigate('/results')}
            className="flex-1 border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold py-3 rounded-xl transition text-sm sm:text-base">
            All Results
          </button>
        </div>
      </div>
    </div>
  );
}
