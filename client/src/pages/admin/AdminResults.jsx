import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import Pagination from "../../components/Pagination";

const PAGE_SIZE = 15;

export default function AdminResults() {
  const { user } = useAuth();

  const isTeacher = user?.role === "teacher";

  const myDepts = isTeacher
    ? user?.departments?.length > 0
      ? user.departments
      : user?.department
      ? [user.department]
      : []
    : [];

  const [results, setResults] = useState([]);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedExam, setSelectedExam] =
    useState("all");

  const [deleting, setDeleting] = useState(null);
  const [confirmId, setConfirmId] =
    useState(null);

  const [success, setSuccess] = useState("");

  const [viewMode, setViewMode] =
    useState("all");

  const [activeDept, setActiveDept] =
    useState(null);

  const [teacherDeptTab, setTeacherDeptTab] =
    useState("all");

  const [page, setPage] = useState(1);

  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      api.get("/admin/results"),
      api.get("/admin/exams"),
    ])
      .then(([r, e]) => {
        setResults(r.data);

        const examIdsWithResults = new Set(
          r.data
            .map((res) => res.exam?._id)
            .filter(Boolean)
        );

        setExams(
          e.data.filter((ex) =>
            examIdsWithResults.has(ex._id)
          )
        );
      })
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id) => {
    setDeleting(id);

    try {
      await api.delete("/admin/results/" + id);

      setResults((prev) =>
        prev.filter((r) => r._id !== id)
      );

      setSuccess("Result deleted successfully");

      setTimeout(() => setSuccess(""), 3000);
    } catch {}

    finally {
      setDeleting(null);
      setConfirmId(null);
    }
  };

  const filtered = results.filter((r) => {
    const matchSearch =
      r.student?.name
        ?.toLowerCase()
        .includes(search.toLowerCase()) ||
      r.student?.studentId
        ?.toLowerCase()
        .includes(search.toLowerCase()) ||
      r.exam?.title
        ?.toLowerCase()
        .includes(search.toLowerCase());

    const matchFilter =
      filter === "all" ||
      (filter === "passed"
        ? r.passed
        : !r.passed);

    const matchExam =
      selectedExam === "all" ||
      r.exam?._id === selectedExam;

    const matchDept = isTeacher
      ? teacherDeptTab === "all" ||
        r.student?.department ===
          teacherDeptTab
      : !activeDept ||
        r.student?.department === activeDept;

    return (
      matchSearch &&
      matchFilter &&
      matchExam &&
      matchDept
    );
  });

  const resetPage = () => setPage(1);

  const totalPages = Math.ceil(
    filtered.length / PAGE_SIZE
  );

  const paginated = filtered.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  // EXAM SPECIFIC STATS
  const currentResults =
    selectedExam === "all"
      ? results
      : results.filter(
          (r) => r.exam?._id === selectedExam
        );

  const totalResults = currentResults.length;

  const passedResults = currentResults.filter(
    (r) => r.passed
  ).length;

  const failedResults =
    totalResults - passedResults;

  const passRate = totalResults
    ? Math.round(
        (passedResults / totalResults) * 100
      )
    : 0;

  const formatDate = (d) =>
    new Date(d).toLocaleDateString(
      "en-US",
      {
        month: "short",
        day: "numeric",
        year: "numeric",
      }
    );

  const formatTime = (s) =>
    `${Math.floor(s / 60)}m ${s % 60}s`;

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-7xl mx-auto px-4 xl:px-8">

        <div className="flex items-center justify-between mb-5">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
            {activeDept ? (
              <span className="flex items-center gap-2">
                <button
                  onClick={() =>
                    setActiveDept(null)
                  }
                  className="text-gray-400 hover:text-indigo-600 transition"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>

                {activeDept}
              </span>
            ) : selectedExam !== "all" ? (
              <span className="flex items-center gap-2">
                <button
                  onClick={() =>
                    setSelectedExam("all")
                  }
                  className="text-gray-400 hover:text-indigo-600 transition"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>

                {exams.find(
                  (e) => e._id === selectedExam
                )?.title || "Exam Results"}
              </span>
            ) : (
              "All Results"
            )}
          </h1>

          <div className="flex bg-gray-100 p-0.5 rounded-lg">
            <button
              onClick={() => {
                setViewMode("all");
                setActiveDept(null);
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                viewMode === "all"
                  ? "bg-white shadow text-indigo-700"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              ☰ All
            </button>

            <button
              onClick={() => {
                setViewMode("departments");
                setActiveDept(null);
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                viewMode === "departments"
                  ? "bg-white shadow text-indigo-700"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              🏛 By Dept
            </button>
          </div>
        </div>

        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
            ✓ {success}
          </div>
        )}

        {viewMode === "departments" &&
          !activeDept &&
          (() => {
            const deptMap = {};

            results.forEach((r) => {
              const d =
                r.student?.department;

              if (d) {
                if (!deptMap[d])
                  deptMap[d] = {
                    total: 0,
                    passed: 0,
                  };

                deptMap[d].total++;

                if (r.passed)
                  deptMap[d].passed++;
              }
            });

            const depts = Object.entries(
              deptMap
            ).sort(([a], [b]) =>
              a.localeCompare(b)
            );

            return depts.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl shadow-sm text-gray-400 mb-5">
                <div className="text-5xl mb-3">
                  📊
                </div>

                <p>
                  No results with department
                  data yet
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 mb-5">
                {depts.map(
                  ([dept, stat]) => (
                    <button
                      key={dept}
                      onClick={() =>
                        setActiveDept(dept)
                      }
                      className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:border-indigo-300 hover:shadow-md transition p-5 text-left group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center text-xl mb-3 group-hover:bg-indigo-600 group-hover:text-white transition">
                        📊
                      </div>

                      <h3 className="font-bold text-gray-800 mb-2">
                        {dept}
                      </h3>

                      <div className="flex gap-3 text-xs">
                        <span className="text-gray-500">
                          {stat.total} submissions
                        </span>

                        <span className="text-green-600 font-semibold">
                          {Math.round(
                            (stat.passed /
                              stat.total) *
                              100
                          )}
                          % pass
                        </span>
                      </div>

                      <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-400 rounded-full"
                          style={{
                            width: `${Math.round(
                              (stat.passed /
                                stat.total) *
                                100
                            )}%`,
                          }}
                        />
                      </div>
                    </button>
                  )
                )}
              </div>
            );
          })()}

        {(viewMode === "all" ||
          activeDept) && (
          <>
            {/* STATS */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-5">
              {[
                {
                  label: "Total",
                  value: totalResults,
                  color: "indigo",
                },

                {
                  label: "Passed",
                  value: passedResults,
                  color: "green",
                },

                {
                  label: "Failed",
                  value: failedResults,
                  color: "red",
                },

                {
                  label: "Pass Rate",
                  value: `${passRate}%`,
                  color: "purple",
                },
              ].map(
                ({
                  label,
                  value,
                  color,
                }) => (
                  <div
                    key={label}
                    className="bg-white rounded-xl shadow-sm p-3 sm:p-4 text-center"
                  >
                    <div
                      className={`text-xl sm:text-2xl font-bold ${
                        color === "indigo"
                          ? "text-indigo-600"
                          : color === "green"
                          ? "text-green-600"
                          : color === "red"
                          ? "text-red-600"
                          : "text-purple-600"
                      }`}
                    >
                      {loading
                        ? "..."
                        : value}
                    </div>

                    <div className="text-xs text-gray-500">
                      {label}
                    </div>
                  </div>
                )
              )}
            </div>

            {/* FILTERS */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-4">

              <select
                value={selectedExam}
                onChange={(e) => {
                  setSelectedExam(
                    e.target.value
                  );

                  setActiveDept(null);

                  resetPage();
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white min-w-0 sm:max-w-xs"
              >
                <option value="all">
                  All Exams (
                  {results.length})
                </option>

                {exams.map((e) => (
                  <option
                    key={e._id}
                    value={e._id}
                  >
                    {e.title} (
                    {
                      results.filter(
                        (r) =>
                          r.exam?._id ===
                          e._id
                      ).length
                    }
                    )
                  </option>
                ))}
              </select>

              <input
                type="text"
                placeholder="Search by student name, ID..."
                value={search}
                onChange={(e) => {
                  setSearch(
                    e.target.value
                  );

                  resetPage();
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />

              <select
                value={filter}
                onChange={(e) =>
                  setFilter(
                    e.target.value
                  )
                }
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              >
                <option value="all">
                  All
                </option>

                <option value="passed">
                  Passed
                </option>

                <option value="failed">
                  Failed
                </option>
              </select>
            </div>

            {/* LOADING */}
            {loading && (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
              </div>
            )}

            {/* TABLE */}
            <div className="hidden sm:block bg-white rounded-2xl shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">
                      Student
                    </th>

                    <th className="text-left px-4 py-3 font-semibold text-gray-600">
                      Exam
                    </th>

                    <th className="text-center px-4 py-3 font-semibold text-gray-600">
                      Score
                    </th>

                    <th className="text-center px-4 py-3 font-semibold text-gray-600">
                      Status
                    </th>

                    <th className="text-center px-4 py-3 font-semibold text-gray-600">
                      Time
                    </th>

                    <th className="text-left px-4 py-3 font-semibold text-gray-600">
                      Date
                    </th>

                    <th className="text-center px-4 py-3 font-semibold text-gray-600">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-50">
                  {paginated.map((r) => (
                    <tr
                      key={r._id}
                      onClick={() =>
                        navigate(
                          `/admin/results/${r._id}`
                        )
                      }
                      className="hover:bg-indigo-50/40 transition cursor-pointer group"
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-800">
                          {
                            r.student?.name
                          }
                        </div>

                        <div className="text-xs text-gray-400">
                          {
                            r.student
                              ?.studentId
                          }
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="text-gray-700">
                          {r.exam?.title}
                        </div>

                        <div className="text-xs text-indigo-500">
                          {
                            r.exam?.subject
                          }
                        </div>
                      </td>

                      <td className="px-4 py-3 text-center">
                        <span
                          className={`font-bold ${
                            r.passed
                              ? "text-green-600"
                              : "text-red-500"
                          }`}
                        >
                          {r.percentage}%
                        </span>

                        <div className="text-xs text-gray-400">
                          {r.score}/
                          {
                            r.totalPoints
                          }{" "}
                          pts
                        </div>
                      </td>

                      <td className="px-4 py-3 text-center">
                        <span
                          className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                            r.passed
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {r.passed
                            ? "PASSED"
                            : "FAILED"}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-center text-gray-500 text-xs">
                        {formatTime(
                          r.timeTaken
                        )}
                      </td>

                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {formatDate(
                          r.submittedAt
                        )}
                      </td>

                      <td
                        className="px-4 py-3 text-center"
                        onClick={(e) =>
                          e.stopPropagation()
                        }
                      >
                        {confirmId ===
                        r._id ? (
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={(
                                e
                              ) => {
                                e.stopPropagation();

                                handleDelete(
                                  r._id
                                );
                              }}
                              disabled={
                                deleting ===
                                r._id
                              }
                              className="text-xs px-2.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition disabled:opacity-50"
                            >
                              {deleting ===
                              r._id
                                ? "..."
                                : "Confirm"}
                            </button>

                            <button
                              onClick={(
                                e
                              ) => {
                                e.stopPropagation();

                                setConfirmId(
                                  null
                                );
                              }}
                              className="text-xs px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg font-medium transition"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={(
                              e
                            ) => {
                              e.stopPropagation();

                              setConfirmId(
                                r._id
                              );
                            }}
                            className="text-xs px-2.5 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-medium transition"
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}

                  {!loading &&
                    filtered.length ===
                      0 && (
                      <tr>
                        <td
                          colSpan={7}
                          className="text-center py-8 text-gray-400"
                        >
                          No results found
                        </td>
                      </tr>
                    )}
                </tbody>
              </table>
            </div>

            {/* MOBILE */}
            <div className="sm:hidden space-y-3">
              {paginated.map((r) => (
                <div
                  key={r._id}
                  className="bg-white rounded-xl shadow-sm p-4 border border-gray-100"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-bold text-gray-800 text-sm">
                        {
                          r.student?.name
                        }
                      </p>

                      <p className="text-xs text-gray-400">
                        {
                          r.student
                            ?.studentId
                        }
                      </p>
                    </div>

                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        r.passed
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {r.passed
                        ? "PASSED"
                        : "FAILED"}
                    </span>
                  </div>

                  <p className="text-sm text-gray-700 mb-1">
                    {r.exam?.title}
                  </p>

                  <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                    <span
                      className={`font-bold text-base ${
                        r.passed
                          ? "text-green-600"
                          : "text-red-500"
                      }`}
                    >
                      {r.percentage}%
                    </span>

                    <span>
                      {r.score}/
                      {
                        r.totalPoints
                      }{" "}
                      pts
                    </span>

                    <span>
                      {formatTime(
                        r.timeTaken
                      )}
                    </span>

                    <span>
                      {formatDate(
                        r.submittedAt
                      )}
                    </span>
                  </div>

                  {confirmId ===
                  r._id ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          handleDelete(
                            r._id
                          )
                        }
                        disabled={
                          deleting ===
                          r._id
                        }
                        className="flex-1 text-xs py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition disabled:opacity-50"
                      >
                        {deleting ===
                        r._id
                          ? "Deleting..."
                          : "Confirm Delete"}
                      </button>

                      <button
                        onClick={() =>
                          setConfirmId(
                            null
                          )
                        }
                        className="flex-1 text-xs py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg font-medium transition"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() =>
                        setConfirmId(
                          r._id
                        )
                      }
                      className="w-full text-xs py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-medium transition"
                    >
                      Delete Result
                    </button>
                  )}
                </div>
              ))}

              {!loading &&
                filtered.length ===
                  0 && (
                  <div className="text-center py-8 text-gray-400 text-sm">
                    No results found
                  </div>
                )}
            </div>

            {/* PAGINATION */}
            {filtered.length >
              PAGE_SIZE && (
              <div className="mt-4">
                <p className="text-center text-xs text-gray-400 mb-2">
                  Showing{" "}
                  {Math.min(
                    (page - 1) *
                      PAGE_SIZE +
                      1,
                    filtered.length
                  )}
                  –
                  {Math.min(
                    page *
                      PAGE_SIZE,
                    filtered.length
                  )}{" "}
                  of{" "}
                  {filtered.length}
                </p>

                <Pagination
                  page={page}
                  totalPages={totalPages}
                  onPage={setPage}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}