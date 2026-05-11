import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const SESSION_DURATION = 24 * 60 * 60 * 1000; 
const WARN_BEFORE    = 5  * 60 * 1000;         
const CHECK_INTERVAL = 30 * 1000;               

export default function SessionManager() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [warning, setWarning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const intervalRef = useRef(null);
  const countdownRef = useRef(null);

  const doLogout = useCallback((reason = 'expired') => {
    clearInterval(intervalRef.current);
    clearInterval(countdownRef.current);
    setWarning(false);
    logout();
    navigate(`/login?session=${reason}`);
  }, [logout, navigate]);

  const extendSession = () => {
    localStorage.setItem('sessionStart', Date.now().toString());
    setWarning(false);
    clearInterval(countdownRef.current);
  };

  useEffect(() => {
    if (!user) return;

    
    if (!localStorage.getItem('sessionStart')) {
      localStorage.setItem('sessionStart', Date.now().toString());
    }

    const check = () => {
      const start = parseInt(localStorage.getItem('sessionStart') || '0', 10);
      const elapsed = Date.now() - start;
      const remaining = SESSION_DURATION - elapsed;

      if (remaining <= 0) {
        doLogout('expired');
        return;
      }

      if (remaining <= WARN_BEFORE && !warning) {
        setWarning(true);
        setSecondsLeft(Math.floor(remaining / 1000));

        
        clearInterval(countdownRef.current);
        countdownRef.current = setInterval(() => {
          const s = parseInt(localStorage.getItem('sessionStart') || '0', 10);
          const rem = SESSION_DURATION - (Date.now() - s);
          if (rem <= 0) {
            doLogout('expired');
          } else {
            setSecondsLeft(Math.floor(rem / 1000));
          }
        }, 1000);
      }
    };

    check(); 
    intervalRef.current = setInterval(check, CHECK_INTERVAL);

    return () => {
      clearInterval(intervalRef.current);
      clearInterval(countdownRef.current);
    };
  }, [user, doLogout, warning]);

  
  useEffect(() => {
    if (!user) {
      localStorage.removeItem('sessionStart');
      clearInterval(intervalRef.current);
      clearInterval(countdownRef.current);
      setWarning(false);
    }
  }, [user]);

  const fmt = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  if (!warning) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4">
      <div className="bg-white border-2 border-yellow-400 rounded-2xl shadow-2xl p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="text-2xl shrink-0">⏰</div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-800 text-sm">Session expiring soon</p>
            <p className="text-gray-500 text-xs mt-0.5">
              You will be logged out in{' '}
              <span className={`font-bold tabular-nums ${secondsLeft < 60 ? 'text-red-600' : 'text-yellow-600'}`}>
                {fmt(secondsLeft)}
              </span>
            </p>
            {}
            <div className="w-full h-1.5 bg-gray-100 rounded-full mt-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${secondsLeft < 60 ? 'bg-red-500' : 'bg-yellow-400'}`}
                style={{ width: `${(secondsLeft / (WARN_BEFORE / 1000)) * 100}%` }}
              />
            </div>
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => doLogout('manual')}
            className="flex-1 border border-gray-300 text-gray-600 py-2 rounded-lg text-sm hover:bg-gray-50 transition font-medium"
          >
            Logout now
          </button>
          <button
            onClick={extendSession}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg text-sm font-semibold transition"
          >
            Stay logged in
          </button>
        </div>
      </div>
    </div>
  );
}
