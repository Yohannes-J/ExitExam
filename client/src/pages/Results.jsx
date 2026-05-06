import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

export default function Results() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/results')
      .then((res) => setResults(res.data))
      .finally(() => setLoading(false));
  }, []);

  const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">My Results</h1>

        {loading && (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
          </div>
        )}

        {!loading && results.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <div className="text-5xl mb-3">📊</div>
            <p>No results yet. Take an exam first!</p>
            <Link to="/dashboard" className="mt-4 inline-block bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition">
              Go to Dashboard
            </Link>
          </div>
        )}

        <div className="space-y-4">
          {results.map((r) => (
            <Link key={r._id} to={`/results/${r._id}`} className="block bg-white rounded-xl shadow-sm border border-gray-100 hover:border-indigo-200 hover:shadow-md transition p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-gray-800">{r.exam?.title}</h3>
                  <p className="text-sm text-indigo-600">{r.exam?.subject}</p>
                  <p className="text-xs text-gray-400 mt-1">{formatDate(r.submittedAt)}</p>
                </div>
                <div className="text-right">
                  <div className={`text-2xl font-bold ${r.passed ? 'text-green-600' : 'text-red-500'}`}>
                    {r.percentage}%
                  </div>
                  <div className={`text-xs font-semibold px-2 py-0.5 rounded-full ${r.passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {r.passed ? 'PASSED' : 'FAILED'}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">{r.score}/{r.totalPoints} pts</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
