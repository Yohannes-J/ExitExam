import { useState, useEffect } from "react";
import api from "../../api/axios";

export default function AdminResults() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [deleting, setDeleting] = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const [success, setSuccess] = useState("");

  useEffect(() => {
    api.get("/admin/results").then((res) => setResults(res.data)).finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id) => {
    setDeleting(id);
    try {
      await api.delete("/admin/results/" + id);
      setResults((prev) => prev.filter((r) => r._id !== id));
      setSuccess("Result deleted successfully");
      setTimeout(() => setSuccess(""), 3000);
    } catch {
      // silent
    } finally {
      setDeleting(null);
      setConfirmId(null);
    }
  };

  const filtered = results.filter((r) => {
    const matchSearch =
      r.student?.name?.toLowerCase().includes(search.toLowerCase()) ||
      r.student?.studentId?.toLowerCase().includes(search.toLowerCase()) ||
      r.exam?.title?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || (filter === "passed" ? r.passed : !r.passed);
    return matchSearch && matchFilter;
  });

  const formatDate = (d) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const formatTime = (s) => `${Math.floor(s / 60)}m ${s % 60}s`;
  const passRate = results.length ? Math.round((results.filter(r => r.passed).length / results.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-7xl mx-auto px-4 xl:px-8">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-5">All Results</h1>

        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
            ✓ {success}
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-5">
          {[
            { label: "Total", value: results.length, color: "indigo" },
            { label: "Passed", value: results.filter(r => r.passed).length, color: "green" },
            { label: "Failed", value: results.filter(r => !r.passed).length, color: "red" },
            { label: "Pass Rate", value: `${passRate}%`, color: "purple" },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white rounded-xl shadow-sm p-3 sm:p-4 text-center">
              <div className={`text-xl sm:text-2xl font-bold text-${color}-600`}>{loading ? "..." : value}</div>
              <div className="text-xs text-gray-500">{label}</div>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-4">
          <input type="text" placeholder="Search by student name, ID, or exam..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
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

        <div className="hidden sm:block bg-white rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Student</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Exam</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Score</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Status</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Time</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Date</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((r) => (
                <tr key={r._id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-800">{r.student?.name}</div>
                    <div className="text-xs text-gray-400">{r.student?.studentId}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-gray-700">{r.exam?.title}</div>
                    <div className="text-xs text-indigo-500">{r.exam?.subject}</div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`font-bold ${r.passed ? "text-green-600" : "text-red-500"}`}>{r.percentage}%</span>
                    <div className="text-xs text-gray-400">{r.score}/{r.totalPoints} pts</div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${r.passed ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {r.passed ? "PASSED" : "FAILED"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-gray-500 text-xs">{formatTime(r.timeTaken)}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{formatDate(r.submittedAt)}</td>
                  <td className="px-4 py-3 text-center">
                    {confirmId === r._id ? (
                      <div className="flex items-center justify-center gap-1.5">
                        <button onClick={() => handleDelete(r._id)} disabled={deleting === r._id}
                          className="text-xs px-2.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition disabled:opacity-50">
                          {deleting === r._id ? "..." : "Confirm"}
                        </button>
                        <button onClick={() => setConfirmId(null)}
                          className="text-xs px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg font-medium transition">
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => setConfirmId(r._id)}
                        className="text-xs px-2.5 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-medium transition">
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={7} className="text-center py-8 text-gray-400">No results found</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="sm:hidden space-y-3">
          {filtered.map((r) => (
            <div key={r._id} className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-bold text-gray-800 text-sm">{r.student?.name}</p>
                  <p className="text-xs text-gray-400">{r.student?.studentId}</p>
                </div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${r.passed ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                  {r.passed ? "PASSED" : "FAILED"}
                </span>
              </div>
              <p className="text-sm text-gray-700 mb-1">{r.exam?.title}</p>
              <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                <span className={`font-bold text-base ${r.passed ? "text-green-600" : "text-red-500"}`}>{r.percentage}%</span>
                <span>{r.score}/{r.totalPoints} pts</span>
                <span>{formatTime(r.timeTaken)}</span>
                <span>{formatDate(r.submittedAt)}</span>
              </div>
              {confirmId === r._id ? (
                <div className="flex gap-2">
                  <button onClick={() => handleDelete(r._id)} disabled={deleting === r._id}
                    className="flex-1 text-xs py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition disabled:opacity-50">
                    {deleting === r._id ? "Deleting..." : "Confirm Delete"}
                  </button>
                  <button onClick={() => setConfirmId(null)}
                    className="flex-1 text-xs py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg font-medium transition">
                    Cancel
                  </button>
                </div>
              ) : (
                <button onClick={() => setConfirmId(r._id)}
                  className="w-full text-xs py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-medium transition">
                  Delete Result
                </button>
              )}
            </div>
          ))}
          {!loading && filtered.length === 0 && (
            <div className="text-center py-8 text-gray-400 text-sm">No results found</div>
          )}
        </div>
      </div>
    </div>
  );
}
