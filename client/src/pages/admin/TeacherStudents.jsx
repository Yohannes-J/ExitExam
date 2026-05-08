import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSearchParams } from 'react-router-dom';
import api from '../../api/axios';
import Pagination from '../../components/Pagination';

const PAGE_SIZE = 10;

export default function TeacherStudents() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortAZ, setSortAZ] = useState(true);
  const [page, setPage] = useState(1);

  const myDepts = user?.departments?.length > 0
    ? user.departments
    : user?.department ? [user.department] : [];

  // Active dept from URL — null means show dept cards
  const activeDept = searchParams.get('dept') || null;

  useEffect(() => {
    api.get('/admin/students')
      .then(r => setStudents(r.data.filter(u => u.role === 'student')))
      .finally(() => setLoading(false));
  }, []);

  // Reset page/search when dept changes
  useEffect(() => { setPage(1); setSearch(''); }, [activeDept]);
  useEffect(() => { setPage(1); }, [search, sortAZ]);

  const deptStudents = activeDept
    ? students.filter(s => s.department === activeDept)
    : [];

  const filtered = deptStudents.filter(s =>
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.studentId?.toLowerCase().includes(search.toLowerCase())
  );

  const sorted = [...filtered].sort((a, b) =>
    sortAZ ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
  );

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  // ── Department cards view ──────────────────────────────────
  if (!activeDept) {
    return (
      <div className="min-h-screen bg-gray-50 py-6 px-4">
        <div className="max-w-5xl mx-auto xl:px-8">
          <div className="mb-6">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">My Students</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {students.filter(s => myDepts.includes(s.department)).length} students across {myDepts.length} department{myDepts.length !== 1 ? 's' : ''}
            </p>
          </div>

          {myDepts.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl shadow-sm text-gray-400">
              <div className="text-5xl mb-3">🏛</div>
              <p className="font-medium">No departments assigned</p>
              <p className="text-sm mt-1">Contact the admin to assign departments</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {myDepts.map(dept => {
                const count = students.filter(s => s.department === dept).length;
                return (
                  <button
                    key={dept}
                    onClick={() => setSearchParams({ dept })}
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:border-indigo-300 hover:shadow-md transition p-6 text-left group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center text-2xl mb-4 group-hover:bg-indigo-600 group-hover:text-white transition">
                      🎓
                    </div>
                    <h3 className="font-bold text-gray-800 text-lg leading-tight mb-1">{dept}</h3>
                    <p className="text-sm text-gray-500">{count} student{count !== 1 ? 's' : ''}</p>
                    <div className="mt-4 flex items-center gap-1 text-indigo-600 text-sm font-medium">
                      View students
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Student list view ──────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-5xl mx-auto xl:px-8">

        {/* Header with back button */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => setSearchParams({})}
            className="flex items-center gap-1.5 text-gray-500 hover:text-indigo-600 text-sm font-medium transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Departments
          </button>
          <span className="text-gray-300">/</span>
          <h1 className="text-xl font-bold text-gray-800">{activeDept}</h1>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: 'Total', value: deptStudents.length, color: 'indigo' },
            { label: 'Showing', value: sorted.length, color: 'green' },
            { label: 'Department', value: activeDept, color: 'purple', small: true },
          ].map(({ label, value, color, small }) => (
            <div key={label} className="bg-white rounded-xl shadow-sm p-3 sm:p-4 text-center border border-gray-100">
              <div className={`${small ? 'text-xs sm:text-sm' : 'text-2xl'} font-bold text-${color}-600 truncate`}>
                {loading ? '...' : value}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {/* Search + Sort */}
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder={`Search ${activeDept} students...`}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          />
          <button
            onClick={() => setSortAZ(p => !p)}
            title={sortAZ ? 'A→Z, click for Z→A' : 'Z→A, click for A→Z'}
            className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm font-medium text-gray-600 shrink-0"
          >
            <span>{sortAZ ? 'A→Z' : 'Z→A'}</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {sortAZ
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9M3 12h5m8 0l4-4m0 0l4 4m-4-4v12" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9M3 12h5m8 8l4-4m0 0l4 4m-4-4V8" />
              }
            </svg>
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
          </div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl shadow-sm text-gray-400">
            <div className="text-4xl mb-2">🎓</div>
            <p>{search ? 'No students match your search' : `No students in ${activeDept} yet`}</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden sm:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide w-10">#</th>
                    <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Student</th>
                    <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Student ID</th>
                    <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Registered</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paginated.map((s, i) => (
                    <tr key={s._id} className="hover:bg-gray-50 transition">
                      <td className="px-5 py-3 text-gray-400 text-xs">{(page - 1) * PAGE_SIZE + i + 1}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm shrink-0">
                            {s.name?.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-gray-800">{s.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-gray-600 font-mono text-xs">{s.studentId}</td>
                      <td className="px-5 py-3 text-gray-400 text-xs">{formatDate(s.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="sm:hidden space-y-3">
              {paginated.map((s, i) => (
                <div key={s._id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center gap-3">
                  <span className="text-xs text-gray-400 w-6 shrink-0">{(page - 1) * PAGE_SIZE + i + 1}</span>
                  <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold shrink-0">
                    {s.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-gray-800 text-sm">{s.name}</p>
                    <p className="text-xs text-gray-400 font-mono">{s.studentId}</p>
                  </div>
                  <p className="text-xs text-gray-400 shrink-0">{formatDate(s.createdAt)}</p>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {sorted.length > PAGE_SIZE && (
              <div className="mt-4">
                <p className="text-center text-xs text-gray-400 mb-2">
                  Showing {Math.min((page - 1) * PAGE_SIZE + 1, sorted.length)}–{Math.min(page * PAGE_SIZE, sorted.length)} of {sorted.length}
                </p>
                <Pagination page={page} totalPages={totalPages} onPage={setPage} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
