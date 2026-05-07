import { useState, useEffect } from 'react';
import api from '../../api/axios';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function AdminReports() {
  const [results, setResults] = useState([]);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedExam, setSelectedExam] = useState('all');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    Promise.all([api.get('/admin/results'), api.get('/admin/exams')])
      .then(([r, e]) => { setResults(r.data); setExams(e.data); })
      .finally(() => setLoading(false));
  }, []);

  const filtered = results.filter((r) => {
    const matchExam = selectedExam === 'all' || r.exam?._id === selectedExam;
    const matchFilter = filter === 'all' || (filter === 'passed' ? r.passed : !r.passed);
    return matchExam && matchFilter;
  });

  const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  const formatTime = (s) => `${Math.floor(s / 60)}m ${s % 60}s`;

  // ── Excel Export ──────────────────────────────────────────
  const exportExcel = () => {
    const rows = filtered.map((r, i) => ({
      '#': i + 1,
      'Full Name': r.student?.name || '',
      'Student ID': r.student?.studentId || '',
      'Department': r.student?.department || '',
      'Exam': r.exam?.title || '',
      'Subject': r.exam?.subject || '',
      'Score (%)': r.percentage,
      'Points': `${r.score}/${r.totalPoints}`,
      'Status': r.passed ? 'PASSED' : 'FAILED',
      'Time Taken': formatTime(r.timeTaken),
      'Submitted': formatDate(r.submittedAt),
    }));

    const ws = XLSX.utils.json_to_sheet(rows);

    // Column widths
    ws['!cols'] = [
      { wch: 4 }, { wch: 22 }, { wch: 16 }, { wch: 18 },
      { wch: 24 }, { wch: 16 }, { wch: 10 }, { wch: 10 },
      { wch: 10 }, { wch: 12 }, { wch: 14 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Results');
    XLSX.writeFile(wb, `ExitExam_Results_${Date.now()}.xlsx`);
  };

  // ── PDF Export ────────────────────────────────────────────
  const exportPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape' });

    // Header
    doc.setFontSize(16);
    doc.setTextColor(67, 56, 202); // indigo
    doc.text('ExitExam Platform — Results Report', 14, 16);

    doc.setFontSize(9);
    doc.setTextColor(100);
    const examLabel = selectedExam === 'all' ? 'All Exams' : exams.find(e => e._id === selectedExam)?.title || '';
    doc.text(`Generated: ${new Date().toLocaleString()}   |   Exam: ${examLabel}   |   Filter: ${filter}   |   Total: ${filtered.length}`, 14, 23);

    const passCount = filtered.filter(r => r.passed).length;
    const passRate = filtered.length ? Math.round((passCount / filtered.length) * 100) : 0;
    doc.text(`Passed: ${passCount}   Failed: ${filtered.length - passCount}   Pass Rate: ${passRate}%`, 14, 29);

    autoTable(doc, {
      startY: 34,
      head: [['#', 'Full Name', 'Student ID', 'Department', 'Exam', 'Score', 'Points', 'Status', 'Time', 'Date']],
      body: filtered.map((r, i) => [
        i + 1,
        r.student?.name || '',
        r.student?.studentId || '',
        r.student?.department || '',
        r.exam?.title || '',
        `${r.percentage}%`,
        `${r.score}/${r.totalPoints}`,
        r.passed ? 'PASSED' : 'FAILED',
        formatTime(r.timeTaken),
        formatDate(r.submittedAt),
      ]),
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [67, 56, 202], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 247, 255] },
      didDrawCell: (data) => {
        // Color status column
        if (data.column.index === 7 && data.section === 'body') {
          const val = data.cell.text[0];
          doc.setTextColor(val === 'PASSED' ? 22 : 220, val === 'PASSED' ? 163 : 38, val === 'PASSED' ? 74 : 38);
        }
      },
    });

    doc.save(`ExitExam_Results_${Date.now()}.pdf`);
  };

  const passRate = filtered.length ? Math.round((filtered.filter(r => r.passed).length / filtered.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Reports</h1>
            <p className="text-sm text-gray-500 mt-0.5">Export student results as Excel or PDF</p>
          </div>
          <div className="flex gap-2">
            <button onClick={exportExcel} disabled={loading || filtered.length === 0}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white px-4 py-2 rounded-lg text-sm font-semibold transition">
              <span>📊</span> Export Excel
            </button>
            <button onClick={exportPDF} disabled={loading || filtered.length === 0}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white px-4 py-2 rounded-lg text-sm font-semibold transition">
              <span>📄</span> Export PDF
            </button>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          {[
            { label: 'Total', value: filtered.length, color: 'indigo' },
            { label: 'Passed', value: filtered.filter(r => r.passed).length, color: 'green' },
            { label: 'Failed', value: filtered.filter(r => !r.passed).length, color: 'red' },
            { label: 'Pass Rate', value: `${passRate}%`, color: 'purple' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white rounded-xl shadow-sm p-3 sm:p-4 text-center">
              <div className={`text-xl sm:text-2xl font-bold text-${color}-600`}>{loading ? '...' : value}</div>
              <div className="text-xs text-gray-500">{label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <select value={selectedExam} onChange={(e) => setSelectedExam(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm">
            <option value="all">All Exams</option>
            {exams.map(e => <option key={e._id} value={e._id}>{e.title}</option>)}
          </select>
          <select value={filter} onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm">
            <option value="all">All Results</option>
            <option value="passed">Passed Only</option>
            <option value="failed">Failed Only</option>
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden sm:block bg-white rounded-2xl shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-indigo-600 text-white">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold">#</th>
                    <th className="text-left px-4 py-3 font-semibold">Full Name</th>
                    <th className="text-left px-4 py-3 font-semibold">Student ID</th>
                    <th className="text-left px-4 py-3 font-semibold">Department</th>
                    <th className="text-left px-4 py-3 font-semibold">Exam</th>
                    <th className="text-center px-4 py-3 font-semibold">Score</th>
                    <th className="text-center px-4 py-3 font-semibold">Status</th>
                    <th className="text-center px-4 py-3 font-semibold">Time</th>
                    <th className="text-left px-4 py-3 font-semibold">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((r, i) => (
                    <tr key={r._id} className={i % 2 === 0 ? 'bg-white' : 'bg-indigo-50/30'}>
                      <td className="px-4 py-3 text-gray-400 text-xs">{i + 1}</td>
                      <td className="px-4 py-3 font-medium text-gray-800">{r.student?.name}</td>
                      <td className="px-4 py-3 text-gray-600 font-mono text-xs">{r.student?.studentId}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{r.student?.department || '—'}</td>
                      <td className="px-4 py-3 text-gray-700 text-xs">{r.exam?.title}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`font-bold ${r.passed ? 'text-green-600' : 'text-red-500'}`}>{r.percentage}%</span>
                        <div className="text-xs text-gray-400">{r.score}/{r.totalPoints}</div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${r.passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {r.passed ? 'PASSED' : 'FAILED'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-gray-500 text-xs">{formatTime(r.timeTaken)}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{formatDate(r.submittedAt)}</td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={9} className="text-center py-8 text-gray-400">No results found</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="sm:hidden space-y-3">
              {filtered.map((r, i) => (
                <div key={r._id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-bold text-gray-800 text-sm">{r.student?.name}</p>
                      <p className="text-xs text-gray-400 font-mono">{r.student?.studentId}</p>
                    </div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${r.passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {r.passed ? 'PASSED' : 'FAILED'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mb-2">{r.exam?.title}</p>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span className={`font-bold text-sm ${r.passed ? 'text-green-600' : 'text-red-500'}`}>{r.percentage}%</span>
                    <span>{r.score}/{r.totalPoints} pts</span>
                    <span>{formatTime(r.timeTaken)}</span>
                    <span>{formatDate(r.submittedAt)}</span>
                  </div>
                </div>
              ))}
              {filtered.length === 0 && <p className="text-center py-8 text-gray-400 text-sm">No results found</p>}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
