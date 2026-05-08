import { useState, useEffect } from "react";
import api from "../../api/axios";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function AdminReports() {
  const [results, setResults] = useState([]);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedExam, setSelectedExam] = useState("all");
  const [filter, setFilter] = useState("all");
  const [checked, setChecked] = useState(new Set());

  useEffect(() => {
    Promise.all([api.get("/admin/results"), api.get("/admin/exams")])
      .then(([r, e]) => { setResults(r.data); setExams(e.data); })
      .finally(() => setLoading(false));
  }, []);

  const filtered = results.filter((r) => {
    const matchExam = selectedExam === "all" || r.exam?._id === selectedExam;
    const matchFilter = filter === "all" || (filter === "passed" ? r.passed : !r.passed);
    return matchExam && matchFilter;
  });

  // When filters change, clear selection
  useEffect(() => { setChecked(new Set()); }, [selectedExam, filter]);

  const allChecked = filtered.length > 0 && filtered.every(r => checked.has(r._id));
  const someChecked = filtered.some(r => checked.has(r._id));

  const toggleAll = () => {
    if (allChecked) {
      setChecked(new Set());
    } else {
      setChecked(new Set(filtered.map(r => r._id)));
    }
  };

  const toggleOne = (id) => {
    setChecked(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // Rows to export: checked ones, or all filtered if none checked
  const exportRows = filtered.filter(r => checked.size === 0 || checked.has(r._id));

  const formatDate = (d) => new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  const formatTime = (s) => `${Math.floor(s / 60)}m ${s % 60}s`;
  const passRate = filtered.length ? Math.round((filtered.filter(r => r.passed).length / filtered.length) * 100) : 0;

  const exportExcel = () => {
    const rows = exportRows.map((r, i) => ({
      "#": i + 1,
      "Full Name": r.student?.name || "",
      "Student ID": r.student?.studentId || "",
      "Department": r.student?.department || "",
      "Result (%)": r.percentage,
      "Pass/Fail": r.passed ? "PASSED" : "FAILED",
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = [
      { wch: 4 }, { wch: 24 }, { wch: 16 }, { wch: 20 }, { wch: 12 }, { wch: 10 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Results");
    XLSX.writeFile(wb, `ExitExam_Results_${Date.now()}.xlsx`);
  };

  const exportPDF = () => {
    const doc = new jsPDF({ orientation: "portrait" });
    doc.setFontSize(16);
    doc.setTextColor(67, 56, 202);
    doc.text("ExitExam Platform — Results Report", 14, 16);
    doc.setFontSize(9);
    doc.setTextColor(100);
    const examLabel = selectedExam === "all" ? "All Exams" : exams.find(e => e._id === selectedExam)?.title || "";
    doc.text(`Generated: ${new Date().toLocaleString()}   |   Exam: ${examLabel}`, 14, 23);
    const passCount = exportRows.filter(r => r.passed).length;
    const pr = exportRows.length ? Math.round((passCount / exportRows.length) * 100) : 0;
    doc.text(`Total: ${exportRows.length}   Passed: ${passCount}   Failed: ${exportRows.length - passCount}   Pass Rate: ${pr}%`, 14, 29);
    autoTable(doc, {
      startY: 34,
      head: [["#", "Full Name", "Student ID", "Department", "Result (%)", "Pass/Fail"]],
      body: exportRows.map((r, i) => [
        i + 1,
        r.student?.name || "",
        r.student?.studentId || "",
        r.student?.department || "",
        `${r.percentage}%`,
        r.passed ? "PASSED" : "FAILED",
      ]),
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [67, 56, 202], textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [245, 247, 255] },
      columnStyles: {
        5: { fontStyle: "bold" },
      },
      didParseCell: (data) => {
        if (data.column.index === 5 && data.section === "body") {
          data.cell.styles.textColor = data.cell.text[0] === "PASSED" ? [22, 163, 74] : [220, 38, 38];
        }
      },
    });
    doc.save(`ExitExam_Results_${Date.now()}.pdf`);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-7xl mx-auto px-4 xl:px-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Reports</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {checked.size > 0
                ? `${checked.size} student${checked.size !== 1 ? "s" : ""} selected`
                : "Select students or export all"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {checked.size > 0 && (
              <button onClick={() => setChecked(new Set())}
                className="flex items-center gap-1.5 border border-gray-300 text-gray-600 hover:bg-gray-50 px-3 py-2 rounded-lg text-sm font-medium transition">
                ✕ Clear ({checked.size})
              </button>
            )}
            <button onClick={exportExcel} disabled={loading || filtered.length === 0}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white px-4 py-2 rounded-lg text-sm font-semibold transition">
              📊 Export Excel
            </button>
            <button onClick={exportPDF} disabled={loading || filtered.length === 0}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white px-4 py-2 rounded-lg text-sm font-semibold transition">
              📄 Export PDF
            </button>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          {[
            { label: "Total", value: filtered.length, color: "indigo" },
            { label: "Passed", value: filtered.filter(r => r.passed).length, color: "green" },
            { label: "Failed", value: filtered.filter(r => !r.passed).length, color: "red" },
            { label: "Pass Rate", value: `${passRate}%`, color: "purple" },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white rounded-xl shadow-sm p-3 sm:p-4 text-center">
              <div className={`text-xl sm:text-2xl font-bold text-${color}-600`}>{loading ? "..." : value}</div>
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
                    <th className="px-4 py-3 w-10">
                      <input type="checkbox" checked={allChecked} ref={el => { if (el) el.indeterminate = someChecked && !allChecked; }}
                        onChange={toggleAll}
                        className="w-4 h-4 rounded accent-white cursor-pointer" />
                    </th>
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
                  {filtered.map((r, i) => {
                    const isChecked = checked.has(r._id);
                    return (
                      <tr key={r._id}
                        onClick={() => toggleOne(r._id)}
                        className={`cursor-pointer transition ${isChecked ? "bg-indigo-50" : i % 2 === 0 ? "bg-white hover:bg-gray-50" : "bg-indigo-50/20 hover:bg-gray-50"}`}>
                        <td className="px-4 py-3 text-center" onClick={e => e.stopPropagation()}>
                          <input type="checkbox" checked={isChecked} onChange={() => toggleOne(r._id)}
                            className="w-4 h-4 rounded accent-indigo-600 cursor-pointer" />
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-800">{r.student?.name}</div>
                        </td>
                        <td className="px-4 py-3 text-gray-600 font-mono text-xs">{r.student?.studentId}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{r.student?.department || "—"}</td>
                        <td className="px-4 py-3 text-gray-700 text-xs">{r.exam?.title}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`font-bold ${r.passed ? "text-green-600" : "text-red-500"}`}>{r.percentage}%</span>
                          <div className="text-xs text-gray-400">{r.score}/{r.totalPoints}</div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${r.passed ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                            {r.passed ? "PASSED" : "FAILED"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-gray-500 text-xs">{formatTime(r.timeTaken)}</td>
                        <td className="px-4 py-3 text-gray-400 text-xs">{formatDate(r.submittedAt)}</td>
                      </tr>
                    );
                  })}
                  {filtered.length === 0 && (
                    <tr><td colSpan={9} className="text-center py-8 text-gray-400">No results found</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="sm:hidden space-y-3">
              {/* Select all mobile */}
              {filtered.length > 0 && (
                <div className="flex items-center justify-between bg-white rounded-xl px-4 py-3 shadow-sm border border-gray-100">
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700">
                    <input type="checkbox" checked={allChecked}
                      ref={el => { if (el) el.indeterminate = someChecked && !allChecked; }}
                      onChange={toggleAll} className="w-4 h-4 rounded accent-indigo-600" />
                    Select All ({filtered.length})
                  </label>
                  {someChecked && (
                    <span className="text-xs text-indigo-600 font-semibold">{checked.size} selected</span>
                  )}
                </div>
              )}
              {filtered.map((r) => {
                const isChecked = checked.has(r._id);
                return (
                  <div key={r._id}
                    onClick={() => toggleOne(r._id)}
                    className={`rounded-xl shadow-sm border p-4 cursor-pointer transition ${isChecked ? "border-indigo-400 bg-indigo-50" : "border-gray-100 bg-white"}`}>
                    <div className="flex items-start gap-3 mb-2">
                      <input type="checkbox" checked={isChecked} onChange={() => toggleOne(r._id)}
                        onClick={e => e.stopPropagation()}
                        className="w-4 h-4 rounded accent-indigo-600 mt-0.5 shrink-0 cursor-pointer" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-bold text-gray-800 text-sm">{r.student?.name}</p>
                            <p className="text-xs text-gray-400 font-mono">{r.student?.studentId}</p>
                          </div>
                          <span className={`shrink-0 text-xs font-bold px-2 py-0.5 rounded-full ${r.passed ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                            {r.passed ? "PASSED" : "FAILED"}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">{r.exam?.title}</p>
                        <div className="flex gap-3 text-xs text-gray-500 mt-1">
                          <span className={`font-bold ${r.passed ? "text-green-600" : "text-red-500"}`}>{r.percentage}%</span>
                          <span>{r.score}/{r.totalPoints} pts</span>
                          <span>{formatTime(r.timeTaken)}</span>
                          <span>{formatDate(r.submittedAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {filtered.length === 0 && <p className="text-center py-8 text-gray-400 text-sm">No results found</p>}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
