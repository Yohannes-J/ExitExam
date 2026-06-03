import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newFeedbackAlert, setNewFeedbackAlert] = useState(0);
  const [previousFeedback, setPreviousFeedback] = useState([]);

  useEffect(() => {
    api.get('/exams')
      .then((res) => setExams(res.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load exams'))
      .finally(() => setLoading(false));

    // Initialize previous feedback and request notification permission
    const initFeedback = async () => {
      try {
        const res = await api.get('/feedback/student/my');
        setPreviousFeedback(res.data);
        // Request notification permission
        if ('Notification' in window && Notification.permission === 'default') {
          Notification.requestPermission();
        }
      } catch (err) {
        console.error('Error initializing feedback:', err);
      }
    };

    initFeedback();
  }, []);

  useEffect(() => {
    if (previousFeedback.length === 0) return; // Only run after previous feedback is initialized

    const checkNewFeedback = async () => {
      try {
        const res = await api.get('/feedback/student/my');
        // Find feedback items that NOW have a response but DIDN'T have one before
        const newResponses = res.data.filter(f => 
          f.adminResponse && 
          !previousFeedback.find(old => old._id === f._id && old.adminResponse)
        );
        
        if (newResponses.length > 0) {
          setNewFeedbackAlert(newResponses.length);
          // Show browser notification
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('New Feedback Response', {
              body: `You have ${newResponses.length} new response(s) from admin`,
              icon: '💬'
            });
          }
        } else {
          // Clear alert if no new responses detected
          setNewFeedbackAlert(0);
        }
        
        // Always update the previous state for next check
        setPreviousFeedback(res.data);
      } catch (err) {
        console.error('Error checking for new feedback:', err);
      }
    };

    const interval = setInterval(checkNewFeedback, 10000);
    return () => clearInterval(interval);
  }, [previousFeedback]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 xl:px-8 py-6">
        {}
        <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl p-5 sm:p-6 mb-6 shadow-sm">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Welcome back, {user?.name}!</h1>
          <p className="text-gray-500 mt-1 text-sm sm:text-base truncate">
            ID: {user?.studentId} · {user?.department || 'No department'}
          </p>
          <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-4 max-w-xs sm:max-w-sm">
            {[
              { label: 'Available', value: exams.length },
              { label: 'Completed', value: exams.filter(e => e.submitted).length },
              { label: 'Pending', value: exams.filter(e => !e.submitted).length },
            ].map(({ label, value }) => (
              <div key={label} className="bg-indigo-50 border border-indigo-100 rounded-xl px-2 py-2 text-center">
                <div className="text-xl sm:text-2xl font-bold text-indigo-700">{value}</div>
                <div className="text-xs text-gray-500">{label}</div>
              </div>
            ))}
          </div>
        </div>

        {newFeedbackAlert > 0 && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-6 flex items-center justify-between">
            <span>🔔 You have <strong>{newFeedbackAlert}</strong> new response(s) from admin!</span>
            <div className="flex gap-2">
              <button 
                onClick={() => navigate('/feedback')}
                className="bg-green-600 text-white px-4 py-1 rounded hover:bg-green-700 transition font-medium text-sm"
              >
                View Response
              </button>
              <button onClick={() => setNewFeedbackAlert(0)} className="text-green-600 hover:text-green-800 font-bold">✕</button>
            </div>
          </div>
        )}

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
