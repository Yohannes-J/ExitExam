import { useState, useEffect, useCallback } from 'react';

export default function CountdownTimer({ durationSeconds, onTimeUp, onTick }) {
  const [timeLeft, setTimeLeft] = useState(durationSeconds);

  const formatTime = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  useEffect(() => {
    if (timeLeft <= 0) {
      onTimeUp?.();
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        const next = prev - 1;
        onTick?.(next);
        if (next <= 0) { clearInterval(timer); onTimeUp?.(); }
        return next;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const pct = (timeLeft / durationSeconds) * 100;
  const isWarning = pct <= 25;
  const isDanger = pct <= 10;

  return (
    <div className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl border-2 ${
      isDanger ? 'border-red-500 bg-red-50 animate-pulse' :
      isWarning ? 'border-yellow-500 bg-yellow-50' :
      'border-indigo-300 bg-indigo-50'
    }`}>
      <span className="text-xs font-semibold uppercase tracking-widest text-gray-500">Time Left</span>
      <span className={`text-3xl font-mono font-bold tabular-nums ${
        isDanger ? 'text-red-600' : isWarning ? 'text-yellow-600' : 'text-indigo-700'
      }`}>
        {formatTime(timeLeft)}
      </span>
      {/* Progress bar */}
      <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden mt-1">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${
            isDanger ? 'bg-red-500' : isWarning ? 'bg-yellow-500' : 'bg-indigo-500'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
