import { useState, useEffect } from 'react';
import api from '../../api/axios';

export default function AdminResults() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    api.get('/admin/results')
      .then((res) => setResults(res.data))
      .finally(() => setLoading(false));
  }, []);

  const filtered = results.filter((r) => {
    const matchSearch =
      r.student?.name?.toLowerCase().includes(search.toLowerCase()) ||
      r.student?.studentId?.toLowerCase().includes(search.toLowerCase()) ||
      r.exam?.title?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || (filter === 'passed' ? r.passed : !r.passed);
    return matchSearch && matchFilter;
  });

  const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const formatTime = (s) => `${Math.floor(s / 60)}m ${s % 60}s`;

  const passRate = results.length ? Math.round((results.filter(r => r.passed).length / results.length) * 100) : 0;
  const avgScore = results.length ? Math.round(results.reduce((s, r) => s + r.percentage, 0) / results.length) : 0;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">All Results</h1>

        {/* Summary */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Submissions', value: results.length, color: 'indigo' },
            { label: 'Passed', value: results.filter(r => r.passed).length, color: 'green' },
            { label: 'Failed', value: results.filter(r => !r.passed).length, color: 'red' },
            { label: 'Pass Rate', value: `${passRate}%`, color: 'purple' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white rounded-xl shadow-sm p-4 text-center">
              <div className={`text-2xl font-bold text-${color}-600`}>{loading ? '...' : value}</div>
              <div className="text-xs text-gray-500">{label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-4">
          <input
            type="text"
            placeholder="Search by student name, ID, or exam..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          />
          <select value={filter} onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm">
            <option value="all">All</option>
            <option value="passed">Passed</option>
            <option value="failed">Failed</option>
          </select>
        </div>

        {loading && (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Student</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Exam</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Score</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Status</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Time</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Submitted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((r) => (
                <tr key={r._id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-800">{r.student?.name}</div>
                    <div className="text-xs text-gray-400">{r.student?.studentId} · {r.student?.department}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-gray-700">{r.exam?.title}</div>
                    <div className="text-xs text-indigo-500">{r.exam?.subject}</div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`font-bold ${r.passed ? 'text-green-600' : 'text-red-500'}`}>{r.percentage}%</span>
                    <div className="text-xs text-gray-400">{r.score}/{r.totalPoints} pts</div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${r.passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {r.passed ? 'PASSED' : 'FAILED'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-gray-500">{formatTime(r.timeTaken)}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{formatDate(r.submittedAt)}</td>
                </tr>
              ))}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">No results found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
