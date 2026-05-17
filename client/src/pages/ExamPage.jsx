import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import CountdownTimer from '../components/CountdownTimer';
import { seededShuffle } from '../utils/shuffle';
import { useAuth } from '../context/AuthContext';

const sessionKey = (examId) => `exam_session_${examId}`;
const SESSION_TTL = 24 * 60 * 60 * 1000; 

const saveSession = (examId, data) => {
  try { localStorage.setItem(sessionKey(examId), JSON.stringify({ ...data, savedAt: Date.now() })); } catch {}
};

const loadSession = (examId) => {
  try {
    const raw = localStorage.getItem(sessionKey(examId));
    if (!raw) return null;
    const data = JSON.parse(raw);
    
    if (Date.now() - (data.savedAt || 0) > SESSION_TTL) {
      localStorage.removeItem(sessionKey(examId));
      return null;
    }
    return data;
  } catch { return null; }
};

const clearSession = (examId) => {
  try { localStorage.removeItem(sessionKey(examId)); } catch {}
};

export default function ExamPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [exam, setExam] = useState(null);
  const [questionOrder, setQuestionOrder] = useState([]); 
  const [answers, setAnswers] = useState({});
  const [currentQ, setCurrentQ] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [started, setStarted] = useState(false);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [savedTimeLeft, setSavedTimeLeft] = useState(null);
  const [violations, setViolations] = useState(0);
  const [showViolationWarning, setShowViolationWarning] = useState(false);
  const MAX_VIOLATIONS = 5;

  const startTimeRef = useRef(null);
  const timeLeftRef = useRef(0);

  
  useEffect(() => {
    api.get(`/exams/${id}`)
      .then((res) => {
        const examData = res.data;
        setExam(examData);
        const fullDuration = examData.duration * 60;
        timeLeftRef.current = fullDuration;

        
        const indices = examData.questions.map((_, i) => i);
        const order = examData.shuffleQuestions && user?.id
          ? seededShuffle(indices, user.id + id) 
          : indices;
        setQuestionOrder(order);

        
        const saved = loadSession(id);
        if (saved && saved.started) {
          const elapsed = saved.pausedAt ? 0 : Math.floor((Date.now() - saved.lastSaved) / 1000);
          const remaining = Math.max(0, (saved.timeLeft ?? fullDuration) - elapsed);
          if (remaining > 0) {
            setAnswers(saved.answers || {});
            setCurrentQ(saved.currentQ || 0);
            setSavedTimeLeft(remaining);
            timeLeftRef.current = remaining;
            setResuming(true);
            setStarted(true);
          } else {
            clearSession(id);
          }
        }
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed to load exam'))
      .finally(() => setLoading(false));
  }, [id, user]);

  const persistSession = useCallback((updatedAnswers, updatedQ, timeLeft) => {    if (!started) return;
    saveSession(id, {
      started: true,
      answers: updatedAnswers,
      currentQ: updatedQ,
      timeLeft,
      lastSaved: Date.now(),
      pausedAt: null,
    });
  }, [id, started]);

  
  useEffect(() => {
    if (started) persistSession(answers, currentQ, timeLeftRef.current);
  }, [answers, currentQ]);

  
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && started) {
        saveSession(id, {
          started: true,
          answers,
          currentQ,
          timeLeft: timeLeftRef.current,
          lastSaved: Date.now(),
          pausedAt: Date.now(), 
        });
      }
    };
    const handleBeforeUnload = () => {
      if (started) {
        saveSession(id, {
          started: true,
          answers,
          currentQ,
          timeLeft: timeLeftRef.current,
          lastSaved: Date.now(),
          pausedAt: Date.now(),
        });
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [id, started, answers, currentQ]);

  const handleSelect = (qIndex, optIndex) => {
    setAnswers((prev) => {
      const next = prev[qIndex] === optIndex
        ? (() => { const n = { ...prev }; delete n[qIndex]; return n; })()
        : { ...prev, [qIndex]: optIndex };
      persistSession(next, currentQ, timeLeftRef.current);
      return next;
    });
  };

  const handleClear = (qIndex) => {
    setAnswers((prev) => {
      const next = { ...prev };
      delete next[qIndex];
      persistSession(next, currentQ, timeLeftRef.current);
      return next;
    });
  };

  const handleSubmit = useCallback(async (forced = false) => {
    if (!forced && !confirmSubmit) { setConfirmSubmit(true); return; }
    setSubmitting(true);
    const totalDuration = exam.duration * 60;
    const remaining = timeLeftRef.current;
    const timeTaken = totalDuration - remaining;

    const payload = exam.questions.map((q, i) => ({
      questionId: q._id,
      selectedIndex: (q.type === 'short' || q.type === 'essay') ? -1 : (answers[i] ?? -1),
      textAnswer: (q.type === 'short' || q.type === 'essay') ? (answers[i] || '') : '',
    }));
    try {
      const { data } = await api.post(`/exams/${id}/submit`, { answers: payload, timeTaken });
      clearSession(id); 
      navigate(`/results/${data.result._id}`, { state: { fresh: true } });
    } catch (err) {
      setError(err.response?.data?.message || 'Submission failed');
      setSubmitting(false);
    }
  }, [answers, exam, id, navigate, confirmSubmit]);

  const handleTimeUp = useCallback(() => { handleSubmit(true); }, [handleSubmit]);

  useEffect(() => {
    if (!started) return;
    const onBlur = () => {
      setViolations(prev => {
        const next = prev + 1;
        setShowViolationWarning(true);
        if (next >= MAX_VIOLATIONS) handleSubmit(true);
        return next;
      });
    };
    const onVisChange = () => { if (document.hidden) onBlur(); };
    window.addEventListener('blur', onBlur);
    document.addEventListener('visibilitychange', onVisChange);
    return () => {
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('visibilitychange', onVisChange);
    };
  }, [started, handleSubmit]);

  const handleTick = (t) => {
    timeLeftRef.current = t;
    
    if (t % 10 === 0) persistSession(answers, currentQ, t);
  };

  const handleStart = () => {
    setStarted(true);
    startTimeRef.current = Date.now();
    saveSession(id, {
      started: true,
      answers: {},
      currentQ: 0,
      timeLeft: exam.duration * 60,
      lastSaved: Date.now(),
      pausedAt: null,
    });
  };

  const answeredCount = Object.values(answers).filter(v => v !== undefined && v !== '').length;
  const totalQ = exam?.questions?.length || 0;
  
  const realQIndex = questionOrder[currentQ] ?? currentQ;

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-2xl shadow p-6 sm:p-8 max-w-md w-full text-center">
        <div className="text-5xl mb-4">⚠️</div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Cannot Load Exam</h2>
        <p className="text-gray-500 mb-6 text-sm">{error}</p>
        <button onClick={() => navigate('/dashboard')}
          className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg hover:bg-indigo-700 transition w-full sm:w-auto">
          Back to Dashboard
        </button>
      </div>
    </div>
  );

  
  if (!started) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8">
      <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 max-w-lg w-full">
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">📝</div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">{exam.title}</h1>
          <p className="text-indigo-600 font-medium mt-1">{exam.subject}</p>
        </div>
        {exam.description && <p className="text-gray-500 text-sm text-center mb-6">{exam.description}</p>}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-6">
          {[
            { label: 'Duration', value: exam.duration >= 60 ? `${Math.floor(exam.duration/60)}h${exam.duration%60>0?' '+exam.duration%60+'m':''}` : `${exam.duration}m`, color: 'indigo' },
            { label: 'Questions', value: totalQ, color: 'purple' },
            { label: 'Pass Score', value: `${exam.passingScore}%`, color: 'green' },
          ].map(({ label, value, color }) => (
            <div key={label} className={`bg-${color}-50 rounded-xl p-3 text-center`}>
              <div className={`text-xl sm:text-2xl font-bold text-${color}-700`}>{value}</div>
              <div className="text-xs text-gray-500">{label}</div>
            </div>
          ))}
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-sm text-yellow-800">
          <strong>⚠️ Instructions:</strong>
          <ul className="mt-2 space-y-1 list-disc list-inside">
            <li>Once started, the timer cannot be paused.</li>
            <li>The exam auto-submits when time runs out.</li>
            <li>You can navigate between questions freely.</li>
            <li>Unanswered questions count as wrong.</li>
            <li>If interrupted, your progress is saved automatically.</li>
            <li>Do not switch tabs or open other windows during the exam.</li>
            <li>Switching tabs 5 times will auto-submit your exam.</li>
          </ul>
        </div>
        <button onClick={handleStart}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition text-lg">
          Start Exam →
        </button>
      </div>
    </div>
  );

  const question = exam.questions[realQIndex];

  return (
    <div className="min-h-screen bg-gray-50"
      onCopy={e => e.preventDefault()}
      onCut={e => e.preventDefault()}
      onPaste={e => e.preventDefault()}
      onContextMenu={e => e.preventDefault()}
      style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
    >
      {showViolationWarning && (
        <div className="bg-red-600 text-white px-4 py-2.5 flex items-center justify-between text-sm z-50 relative">
          <span>
            ⚠️ <strong>Tab switch detected!</strong> Violation {violations}/{MAX_VIOLATIONS}.
            {violations >= MAX_VIOLATIONS
              ? ' Exam is being submitted.'
              : ` ${MAX_VIOLATIONS - violations} more will auto-submit your exam.`}
          </span>
          <button onClick={() => setShowViolationWarning(false)} className="ml-4 text-white/80 hover:text-white font-bold text-lg leading-none">✕</button>
        </div>
      )}
      <div className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 py-2 sm:py-3 flex items-center gap-2 sm:gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-gray-800 truncate text-sm sm:text-base">{exam.title}</h1>
            <div className="flex items-center gap-2">
              <p className="text-xs text-gray-500">{answeredCount}/{totalQ} answered</p>
              {violations > 0 && (
                <span className="text-xs bg-red-100 text-red-600 font-semibold px-2 py-0.5 rounded-full">
                  ⚠️ {violations} violation{violations !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
          <CountdownTimer
            durationSeconds={exam.duration * 60}
            initialSeconds={savedTimeLeft ?? exam.duration * 60}
            onTimeUp={handleTimeUp}
            onTick={handleTick}
          />
          <button onClick={() => setShowSidebar(!showSidebar)}
            className="lg:hidden bg-gray-100 hover:bg-gray-200 text-gray-700 px-2.5 py-1.5 rounded-lg text-xs font-medium transition">
            📋 {answeredCount}/{totalQ}
          </button>
          <button onClick={() => handleSubmit(false)} disabled={submitting}
            className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg transition text-xs sm:text-sm whitespace-nowrap">
            {submitting ? '...' : 'Submit'}
          </button>
        </div>
        <div className="h-1 bg-gray-100">
          <div className="h-full bg-indigo-500 transition-all duration-300"
            style={{ width: `${(answeredCount / totalQ) * 100}%` }} />
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-3 sm:px-4 xl:px-8 py-4 sm:py-6 flex gap-4 lg:gap-8">
        {}
        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6 mb-4">
            <div className="flex items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2">
                <span className="bg-indigo-100 text-indigo-700 text-xs sm:text-sm font-bold px-3 py-1 rounded-full">
                  Q{currentQ + 1} / {totalQ}
                </span>
                <span className="text-xs text-gray-400">{question.points} pt{question.points !== 1 ? 's' : ''}</span>
              </div>
              {answers[realQIndex] !== undefined && (
                <button onClick={() => handleClear(realQIndex)}
                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition px-2 py-1 rounded-lg hover:bg-red-50">
                  <span>✕</span> Clear answer
                </button>
              )}
            </div>
            <p className="text-gray-800 text-base sm:text-lg font-medium leading-relaxed mb-5 sm:mb-6">
              {question.text}
            </p>
            {question.code && (
              <pre className="bg-gray-900 text-green-400 rounded-xl p-4 mb-5 text-xs sm:text-sm font-mono overflow-x-auto whitespace-pre leading-relaxed border border-gray-700">
                {question.code}
              </pre>
            )}
            <div className="space-y-2 sm:space-y-3">
              {}
              {(!question.type || question.type === 'mcq') && question.options.map((opt, i) => (
                <button key={i} onClick={() => handleSelect(realQIndex, i)}
                  className={`w-full text-left px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border-2 transition font-medium text-sm sm:text-base ${
                    answers[realQIndex] === i
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-800'
                      : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50 text-gray-700'
                  }`}>
                  <span className={`inline-flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-full text-xs sm:text-sm font-bold mr-2 sm:mr-3 shrink-0 ${
                    answers[realQIndex] === i ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {String.fromCharCode(65 + i)}
                  </span>
                  {opt}
                </button>
              ))}

              {}
              {question.type === 'truefalse' && (
                <div className="flex gap-3">
                  {['True', 'False'].map((val, i) => (
                    <button key={val} onClick={() => handleSelect(realQIndex, i)}
                      className={`flex-1 py-3 rounded-xl border-2 font-bold text-sm transition ${
                        answers[realQIndex] === i
                          ? i === 0 ? 'border-green-500 bg-green-50 text-green-700' : 'border-red-500 bg-red-50 text-red-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-600'
                      }`}>
                      {i === 0 ? '✓ True' : '✗ False'}
                    </button>
                  ))}
                </div>
              )}

              {}
              {question.type === 'short' && (
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">Your Answer</label>
                  <input
                    type="text"
                    value={answers[realQIndex] ?? ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setAnswers(prev => {
                        const next = val === '' ? (() => { const n = {...prev}; delete n[realQIndex]; return n; })() : { ...prev, [realQIndex]: val };
                        persistSession(next, currentQ, timeLeftRef.current);
                        return next;
                      });
                    }}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 text-sm transition"
                    placeholder="Type your answer here..."
                  />
                </div>
              )}

              {}
              {question.type === 'essay' && (
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">Your Essay Answer</label>
                  <textarea
                    rows={6}
                    value={answers[realQIndex] ?? ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setAnswers(prev => {
                        const next = val === '' ? (() => { const n = {...prev}; delete n[realQIndex]; return n; })() : { ...prev, [realQIndex]: val };
                        persistSession(next, currentQ, timeLeftRef.current);
                        return next;
                      });
                    }}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 text-sm transition resize-y"
                    placeholder="Write your essay answer here..."
                  />
                  <p className="text-xs text-gray-400 mt-1">Write a detailed answer. Your response will be reviewed by the teacher.</p>
                </div>
              )}
            </div>
          </div>

          {}
          <div className="flex justify-between gap-3">
            <button onClick={() => { const q = Math.max(0, currentQ - 1); setCurrentQ(q); persistSession(answers, q, timeLeftRef.current); }}
              disabled={currentQ === 0}
              className="flex-1 sm:flex-none bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-40 text-gray-700 font-medium px-4 sm:px-5 py-2.5 rounded-lg transition text-sm">
              ← Prev
            </button>
            {currentQ === totalQ - 1 ? (
              <button onClick={() => handleSubmit(false)} disabled={submitting}
                className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold px-4 sm:px-6 py-2.5 rounded-lg transition text-sm">
                {submitting ? 'Submitting...' : '✓ Finish Exam'}
              </button>
            ) : (
              <button onClick={() => { const q = Math.min(totalQ - 1, currentQ + 1); setCurrentQ(q); persistSession(answers, q, timeLeftRef.current); }}
                className="flex-1 sm:flex-none bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 sm:px-5 py-2.5 rounded-lg transition text-sm">
                Next →
              </button>
            )}
          </div>
        </div>

        {}
        <div className={`${showSidebar ? 'fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/40 lg:bg-transparent lg:static lg:inset-auto lg:z-auto lg:flex' : 'hidden lg:block'} lg:w-44 lg:shrink-0`}>
          <div className="bg-white rounded-2xl shadow-lg lg:shadow-sm p-4 w-full max-w-xs sm:max-w-sm lg:max-w-none lg:sticky lg:top-24 mx-4 sm:mx-0 mb-4 lg:mb-0">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-600">Questions</h3>
              <button onClick={() => setShowSidebar(false)} className="lg:hidden text-gray-400 hover:text-gray-600 text-lg leading-none">✕</button>
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {exam.questions.map((_, i) => {
                const realIdx = questionOrder[i] ?? i;
                return (
                  <button key={i} onClick={() => { setCurrentQ(i); setShowSidebar(false); persistSession(answers, i, timeLeftRef.current); }}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition ${
                      i === currentQ ? 'bg-indigo-600 text-white ring-2 ring-indigo-300'
                      : answers[realIdx] !== undefined ? 'bg-green-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}>
                    {i + 1}
                  </button>
                );
              })}
            </div>
            <div className="mt-3 space-y-1.5 text-xs text-gray-500">
              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-green-500 inline-block"></span> Answered</div>
              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-gray-200 inline-block"></span> Unanswered</div>
              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-indigo-600 inline-block"></span> Current</div>
            </div>
          </div>
        </div>
      </div>

      {}
      {confirmSubmit && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 px-4 pb-4 sm:pb-0">
          <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-sm text-center">
            <div className="text-5xl mb-4">📤</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Submit Exam?</h2> 
            <p className="text-gray-500 text-sm mb-2">
              You answered <strong>{answeredCount}</strong> of <strong>{totalQ}</strong> questions.
            </p>
            {answeredCount < totalQ && (
              <p className="text-yellow-600 text-sm mb-4">⚠️ {totalQ - answeredCount} unanswered.</p>
            )}
            <div className="flex gap-3 mt-5">
              <button onClick={() => setConfirmSubmit(false)}
                className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg hover:bg-gray-50 transition font-medium text-sm">
                Cancel
              </button>
              <button onClick={() => handleSubmit(true)} disabled={submitting}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-lg transition font-semibold text-sm">
                {submitting ? 'Submitting...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
